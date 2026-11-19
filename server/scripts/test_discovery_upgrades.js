import { DecisionMakerEngine } from '../src/services/decisionMakerEngine.js';
import { WikidataConnector } from '../src/services/connectors/wikidataConnector.js';
import { initDatabase } from '../src/db/index.js';

async function test() {
  await initDatabase();

  console.log('=== TEST 1: DecisionMakerEngine People Search (Philippines / Purchasing / Cosmetics) ===');
  const dme = new DecisionMakerEngine();
  const people = await dme.searchDecisionMakers({
    country: 'Philippines',
    industry: 'Cosmetics',
    role: 'All'
  });
  console.log(`Discovered ${people.length} People / Decision Makers:`);
  people.forEach((p, idx) => {
    console.log(`[#${idx + 1}] ${p.fullName} | ${p.jobTitle} | Company: ${p.companyName} | Web: ${p.officialWebsite}`);
  });

  console.log('\n=== TEST 2: High-Quality Commercial Company Discovery (Philippines / Cosmetics) ===');
  const wdc = new WikidataConnector();
  const companies = await wdc.search({
    country: 'Philippines',
    industry: 'Cosmetics',
    limit: 10
  });
  console.log(`Discovered ${companies.length} Commercial Companies:`);
  companies.forEach((c, idx) => {
    console.log(`[#${idx + 1}] ${c.legalName} (${c.primaryIndustry}) - Web: ${c.officialWebsite} | Summary: ${c.productsSummary.slice(0, 80)}...`);
  });

  console.log('\n=== TEST 3: Supplements Decision Makers (US / Supplements) ===');
  const usSupplements = await dme.searchDecisionMakers({
    country: 'United States',
    industry: 'Food Supplements'
  });
  console.log(`Discovered ${usSupplements.length} US Supplements Leaders:`);
  usSupplements.forEach((p, idx) => {
    console.log(`[#${idx + 1}] ${p.fullName} - ${p.jobTitle} at ${p.companyName} (${p.country})`);
  });
}

test().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
