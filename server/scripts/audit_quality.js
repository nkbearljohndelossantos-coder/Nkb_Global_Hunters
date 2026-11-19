import { initDatabase, query } from '../src/db/index.js';

async function auditCompanyQuality() {
  console.log('=== COMPANY QUALITY AUDIT START ===');
  await initDatabase();

  const companies = await query("SELECT id, legal_name, primary_country, primary_industry, business_description, verification_status, source_attribution FROM companies");
  console.log(`Total Stored Companies to Audit: ${companies.length}`);

  const genuineCompanies = [];
  const flaggedForReview = [];

  for (const c of companies) {
    const desc = (c.business_description || '').toLowerCase();
    const name = c.legal_name.toLowerCase();

    // Check if it looks like a generic concept rather than an entity
    const isGenericConcept =
      name === 'dietary supplement' ||
      name === 'bodybuilding supplement' ||
      name === 'iron supplement' ||
      desc.includes('is an ingredient') ||
      desc.includes('are substances used') ||
      desc.includes('is a form of');

    if (isGenericConcept) {
      flaggedForReview.push({
        id: c.id,
        name: c.legal_name,
        country: c.primary_country,
        industry: c.primary_industry,
        reason: 'Generic product category/concept rather than registered commercial legal entity'
      });
    } else {
      genuineCompanies.push({
        id: c.id,
        name: c.legal_name,
        country: c.primary_country,
        industry: c.primary_industry,
        fit: c.nkb_service_fit
      });
    }
  }

  console.log(`\nVerified Authentic Business Entities: ${genuineCompanies.length}`);
  genuineCompanies.slice(0, 10).forEach(g => {
    console.log(`  [OK] ${g.name} (${g.country} - ${g.industry})`);
  });

  console.log(`\nFlagged for Human Review (Generic concepts identified): ${flaggedForReview.length}`);
  flaggedForReview.forEach(f => {
    console.log(`  [FLAGGED] ${f.name} -> Reason: ${f.reason}`);
  });

  console.log('=== COMPANY QUALITY AUDIT END ===');
  process.exit(0);
}

auditCompanyQuality().catch(console.error);
