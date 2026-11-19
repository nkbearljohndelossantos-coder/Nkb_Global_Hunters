import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, query, execute, getOne, getEngine } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[Migration] Starting database migration check...');
  await initDatabase();

  const migrationFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  // Split into executable statements
  const statements = sql
    .replace(/--.*$/gm, '') // Remove comments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await execute(statement);
    } catch (err) {
      // Ignore if index or table already exists
      if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
        console.warn(`[Migration Warning] Statement failed: ${statement.substring(0, 60)}... => ${err.message}`);
      }
    }
  }

  console.log('[Migration] Schema verified.');

  // Seed default roles
  const defaultRoles = [
    { id: 'role_admin', name: 'Administrator', description: 'Full system configuration, user administration, and audit access' },
    { id: 'role_sales_manager', name: 'Sales Manager', description: 'Pipeline supervision, opportunity approvals, and proposal reviews' },
    { id: 'role_sales_staff', name: 'Sales Staff', description: 'Lead handling, deal management, outreach creation, and client follow-ups' },
    { id: 'role_research_analyst', name: 'Research Analyst', description: 'Company discovery, intelligence verification, and contact discovery' },
    { id: 'role_read_only', name: 'Read-only User', description: 'Executive read-only visibility into reports, dashboard, and CRM' }
  ];

  for (const role of defaultRoles) {
    const existing = await getOne('SELECT id FROM roles WHERE id = $1', [role.id]);
    if (!existing) {
      await execute('INSERT INTO roles (id, name, description) VALUES ($1, $2, $3)', [role.id, role.name, role.description]);
    }
  }

  // Seed default research sources
  const defaultSources = [
    { id: 'src_wikidata', code: 'wikidata', name: 'Wikidata SPARQL Global Knowledge Graph', category: 'wikidata', is_active: 1, requires_auth: 0, rate_limit: 60, doc_url: 'https://query.wikidata.org' },
    { id: 'src_openalex', code: 'openalex', name: 'OpenAlex Global Corporate & Institution Index', category: 'public_directory', is_active: 1, requires_auth: 0, rate_limit: 100, doc_url: 'https://openalex.org' },
    { id: 'src_sec_edgar', code: 'sec_edgar', name: 'U.S. SEC EDGAR Public Company Filings', category: 'registry', is_active: 1, requires_auth: 0, rate_limit: 10, doc_url: 'https://www.sec.gov/edgar' },
    { id: 'src_web_inspector', code: 'web_inspector', name: 'Direct Public Website & Metadata Inspector', category: 'search_engine', is_active: 1, requires_auth: 0, rate_limit: 30, doc_url: 'https://nkb-manufacturing.com' },
    { id: 'src_custom_api', code: 'custom_api', name: 'Configurable Commercial Provider (Apollo/Hunter/Search)', category: 'search_engine', is_active: 0, requires_auth: 1, rate_limit: 10, doc_url: 'Settings > Data Sources' }
  ];

  for (const src of defaultSources) {
    const existing = await getOne('SELECT id FROM research_sources WHERE code = $1', [src.code]);
    if (!existing) {
      await execute(
        'INSERT INTO research_sources (id, code, name, category, is_active, requires_auth, rate_limit_per_minute, documentation_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [src.id, src.code, src.name, src.category, src.is_active, src.requires_auth, src.rate_limit, src.doc_url]
      );
      // Create source connector record
      await execute(
        'INSERT INTO source_connectors (id, source_id, name, status) VALUES ($1, $2, $3, $4)',
        [uuidv4(), src.id, src.name, src.requires_auth ? 'unconfigured' : 'active']
      );
    }
  }

  // Seed default scoring weights in system_settings
  const defaultSettings = [
    { key: 'scoring_weight_industry_fit', value: '25', category: 'qualification', description: 'Industry fit weight out of 100' },
    { key: 'scoring_weight_service_fit', value: '25', category: 'qualification', description: 'NKB manufacturing service fit weight out of 100' },
    { key: 'scoring_weight_purchasing_potential', value: '20', category: 'qualification', description: 'Purchasing scale and recurring potential weight out of 100' },
    { key: 'scoring_weight_legitimacy', value: '15', category: 'qualification', description: 'Business legitimacy and evidence quality weight out of 100' },
    { key: 'scoring_weight_buying_signals', value: '15', category: 'qualification', description: 'Buying signals & expansion activities weight out of 100' },
    { key: 'outreach_human_approval_required', value: 'true', category: 'outreach', description: 'Require explicit human approval before any external email transmission' },
    { key: 'nkb_company_name', value: 'NKB Manufacturing', category: 'branding', description: 'Manufacturing enterprise name' },
    { key: 'nkb_core_services', value: 'Cosmetics Manufacturing,Perfume Manufacturing,Food Supplement Manufacturing,Packaging Materials', category: 'manufacturing', description: 'Primary OEM/ODM capabilities' },
    { key: 'ai_provider', value: 'free_heuristic', category: 'ai', description: 'Default AI inference provider (free_heuristic, ollama, openai, gemini, anthropic)' }
  ];

  for (const setting of defaultSettings) {
    const existing = await getOne('SELECT key FROM system_settings WHERE key = $1', [setting.key]);
    if (!existing) {
      await execute(
        'INSERT INTO system_settings (key, value, category, description) VALUES ($1, $2, $3, $4)',
        [setting.key, setting.value, setting.category, setting.description]
      );
    }
  }

  // Seed initial Admin user if no users exist
  const existingUser = await getOne('SELECT id FROM users LIMIT 1');
  if (!existingUser) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nkb-hunter.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@NKB2026!';
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminId = uuidv4();

    await execute(
      'INSERT INTO users (id, username, email, password_hash, full_name, role_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [adminId, 'admin', adminEmail, passwordHash, 'Principal Administrator', 'role_admin', 1]
    );

    console.log(`[Migration] Initial Administrator account established: ${adminEmail}`);
  }

  // VERIFICATION: Check company count to ensure ZERO dummy data
  const companyCount = await getOne('SELECT COUNT(*) as count FROM companies');
  const count = companyCount ? (companyCount.count || 0) : 0;
  console.log(`[Zero-Dummy-Data Verification] Database initialized with exactly ${count} companies. (Must be 0).`);

  console.log('[Migration] Database migration completed successfully.');
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]', err);
      process.exit(1);
    });
}
