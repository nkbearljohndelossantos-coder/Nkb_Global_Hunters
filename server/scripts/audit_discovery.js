import { initDatabase, query, getOne } from '../src/db/index.js';
import { DiscoveryEngine } from '../src/services/discoveryEngine.js';

async function auditDiscovery() {
  console.log('=== REAL DISCOVERY AUDIT START ===');
  await initDatabase();

  const engine = new DiscoveryEngine();
  const admin = await getOne("SELECT id FROM users WHERE username = 'admin'");

  const testRuns = [
    { country: 'Philippines', industry: 'Cosmetics', keyword: 'cosmetics', limit: 5 },
    { country: 'France', industry: 'Perfume', keyword: 'perfume', limit: 5 },
    { country: 'United States', industry: 'Food Supplements', keyword: 'supplement', limit: 5 },
    { country: 'Japan', industry: 'Packaging Materials', keyword: 'packaging', limit: 5 }
  ];

  for (const testCase of testRuns) {
    console.log(`\n--- Testing Discovery: Country="${testCase.country}", Industry="${testCase.industry}", Keyword="${testCase.keyword}" ---`);
    const start = Date.now();
    try {
      const result = await engine.runDiscovery({
        country: testCase.country,
        industry: testCase.industry,
        keyword: testCase.keyword,
        limit: testCase.limit,
        userId: admin.id
      });
      const duration = Date.now() - start;
      console.log(`Search Duration: ${duration}ms`);
      console.log(`Total Found from Source: ${result.totalFound}`);
      console.log(`Newly Stored in DB: ${result.newlyDiscovered}`);
      console.log(`Reconciled Duplicates: ${result.duplicatesDetected}`);

      if (result.companies.length > 0) {
        console.log('Sample Discovered Records:');
        result.companies.slice(0, 3).forEach((c, idx) => {
          console.log(`  [Record ${idx + 1}]`);
          console.log(`    Legal Name: ${c.legal_name}`);
          console.log(`    Country: ${c.primary_country}`);
          console.log(`    City: ${c.primary_city || 'N/A'}`);
          console.log(`    Website: ${c.official_website || 'N/A'}`);
          console.log(`    Industry: ${c.primary_industry}`);
          console.log(`    NKB Fit: ${c.nkb_service_fit}`);
          console.log(`    Source Attribution: ${c.source_attribution}`);
          console.log(`    First Discovered: ${c.first_discovered_at}`);
        });
      } else {
        console.warn(`[Notice] Query returned 0 results for ${testCase.country} / ${testCase.industry}. Checking SPARQL endpoint response.`);
      }
    } catch (err) {
      console.error(`Discovery Error for ${testCase.country} / ${testCase.industry}:`, err.message);
    }
  }

  // Verify DB Persistence after runs
  const postCount = await getOne("SELECT COUNT(*) as c FROM companies");
  console.log(`\nPost-Discovery Total Genuine Companies in Staging DB: ${postCount.c}`);

  // Test Deduplication directly
  console.log('\n--- Testing Deduplication & Re-search Reconciliation ---');
  if (postCount.c > 0) {
    const existingCompany = await getOne("SELECT * FROM companies LIMIT 1");
    console.log(`Re-submitting existing company: "${existingCompany.legal_name}" (Domain: ${existingCompany.domain})`);
    const dupResult = await engine.persistCompanyIfUnique({
      legalName: existingCompany.legal_name,
      domain: existingCompany.domain,
      primaryCountry: existingCompany.primary_country,
      primaryIndustry: existingCompany.primary_industry,
      sourceAttribution: 'Deduplication Audit Check'
    }, admin.id);

    console.log(`Deduplication Detected: ${!dupResult.isNew} (Must be true)`);
    console.log(`Returned Existing ID matches: ${dupResult.company.id === existingCompany.id}`);
  }

  console.log('=== REAL DISCOVERY AUDIT END ===');
  process.exit(0);
}

auditDiscovery().catch(err => {
  console.error('Audit Discovery Script Error:', err);
  process.exit(1);
});
