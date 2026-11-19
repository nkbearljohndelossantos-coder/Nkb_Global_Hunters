import { initDatabase, execute } from '../src/db/index.js';

async function flag() {
  await initDatabase();
  const res = await execute(
    "UPDATE companies SET verification_status = 'pending_research', confidence_level = 'low' WHERE LOWER(legal_name) IN ('dietary supplement', 'bodybuilding supplement', 'iron supplement')"
  );
  console.log(`Flagged ${res.rowCount} generic concept records as pending_research for analyst review.`);
  process.exit(0);
}

flag().catch(console.error);
