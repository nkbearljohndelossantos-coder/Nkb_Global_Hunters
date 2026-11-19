import { initDatabase, query, getOne, getEngine } from '../src/db/index.js';

async function auditDatabase() {
  console.log('=== DATABASE AUDIT START ===');
  await initDatabase();
  console.log(`Active Database Engine: ${getEngine()}`);

  const tables = await query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  console.log(`Verified Tables Count: ${tables.length}`);
  console.log('Tables Found:');
  tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.name}`));

  // Check Foreign Key enforcement
  const fkCheck = await getOne("PRAGMA foreign_keys");
  console.log(`Foreign Keys Enabled: ${JSON.stringify(fkCheck)}`);

  // Check Indexes
  const indexes = await query("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name");
  console.log(`Verified Indexes Count: ${indexes.length}`);

  // Check Zero Dummy Data in production/staging
  const companyCount = await getOne("SELECT COUNT(*) as count FROM companies");
  const contactCount = await getOne("SELECT COUNT(*) as count FROM business_contacts");
  const oppCount = await getOne("SELECT COUNT(*) as count FROM opportunities");

  console.log(`Initial Staging Company Count: ${companyCount.count} (Must start at 0)`);
  console.log(`Initial Staging Contact Count: ${contactCount.count} (Must start at 0)`);
  console.log(`Initial Staging Opportunity Count: ${oppCount.count} (Must start at 0)`);

  // Check Roles & System Settings seeded
  const roleCount = await getOne("SELECT COUNT(*) as count FROM roles");
  const settingsCount = await getOne("SELECT COUNT(*) as count FROM system_settings");
  const usersCount = await getOne("SELECT COUNT(*) as count FROM users");
  console.log(`Seeded Roles: ${roleCount.count}`);
  console.log(`Seeded System Settings: ${settingsCount.count}`);
  console.log(`Seeded Initial Users: ${usersCount.count}`);

  console.log('=== DATABASE AUDIT END ===');
  process.exit(0);
}

auditDatabase().catch(err => {
  console.error('Database Audit Error:', err);
  process.exit(1);
});
