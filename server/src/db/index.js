import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let pgPool = null;
let sqliteDb = null;
let activeEngine = 'sqlite';

export async function initDatabase() {
  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    try {
      pgPool = new pg.Pool({
        connectionString: databaseUrl,
        ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test PostgreSQL connection
      const client = await pgPool.connect();
      const res = await client.query('SELECT NOW()');
      client.release();
      activeEngine = 'postgres';
      console.log(`[DB] Connected to PostgreSQL 16 (${res.rows[0].now})`);
      return;
    } catch (err) {
      console.warn(`[DB] PostgreSQL connection failed (${err.message}). Falling back to embedded relational engine.`);
      pgPool = null;
    }
  }

  // Fallback to SQLite (Node 26 native DatabaseSync)
  const storageDir = path.resolve(__dirname, '../../../storage');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const dbPath = process.env.DB_PATH || path.join(storageDir, process.env.DB_FILENAME || 'nkb_hunter_staging.db');
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
  activeEngine = 'sqlite';
  console.log(`[DB] Connected to embedded relational database: ${dbPath}`);
}

function convertPgToSqlite(sql, params) {
  const matches = [...sql.matchAll(/\$(\d+)/g)];
  if (matches.length === 0) return { sql, params };
  const sqliteParams = matches.map(m => params[parseInt(m[1], 10) - 1]);
  const sqliteSql = sql.replace(/\$\d+/g, '?');
  return { sql: sqliteSql, params: sqliteParams };
}

export function getEngine() {
  return activeEngine;
}

export async function query(sql, params = []) {
  if (activeEngine === 'postgres' && pgPool) {
    const res = await pgPool.query(sql, params);
    return res.rows;
  } else if (sqliteDb) {
    const { sql: convertedSql, params: convertedParams } = convertPgToSqlite(sql, params);
    const stmt = sqliteDb.prepare(convertedSql);
    if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
      return stmt.all(...convertedParams);
    } else {
      const info = stmt.run(...convertedParams);
      return { rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  } else {
    throw new Error('Database is not initialized.');
  }
}

export async function getOne(sql, params = []) {
  const rows = await query(sql, params);
  if (Array.isArray(rows)) {
    return rows[0] || null;
  }
  return null;
}

export async function execute(sql, params = []) {
  if (activeEngine === 'postgres' && pgPool) {
    const res = await pgPool.query(sql, params);
    return { rowCount: res.rowCount };
  } else if (sqliteDb) {
    const { sql: convertedSql, params: convertedParams } = convertPgToSqlite(sql, params);
    const stmt = sqliteDb.prepare(convertedSql);
    const info = stmt.run(...convertedParams);
    return { rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
  } else {
    throw new Error('Database is not initialized.');
  }
}

export async function transaction(callback) {
  if (activeEngine === 'postgres' && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const txQuery = (sql, params) => client.query(sql, params);
      const result = await callback(txQuery);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else if (sqliteDb) {
    sqliteDb.exec('BEGIN TRANSACTION');
    try {
      const txQuery = async (sql, params = []) => {
        const { sql: convertedSql, params: convertedParams } = convertPgToSqlite(sql, params);
        const stmt = sqliteDb.prepare(convertedSql);
        if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
          return { rows: stmt.all(...convertedParams) };
        } else {
          const info = stmt.run(...convertedParams);
          return { rowCount: info.changes };
        }
      };
      const result = await callback(txQuery);
      sqliteDb.exec('COMMIT');
      return result;
    } catch (err) {
      sqliteDb.exec('ROLLBACK');
      throw err;
    }
  }
}

export async function closeDatabase() {
  if (pgPool) {
    await pgPool.end();
  }
  if (sqliteDb) {
    sqliteDb.close();
  }
}
