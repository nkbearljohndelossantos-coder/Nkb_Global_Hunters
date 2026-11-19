import { initDatabase, query, getOne } from '../src/db/index.js';
import { aiAgentEngine } from '../src/services/aiAgentEngine.js';
import { WebInspectorConnector } from '../src/services/connectors/webInspectorConnector.js';

async function auditContacts() {
  console.log('=== CONTACT DISCOVERY AUDIT START ===');
  await initDatabase();

  const webInspector = new WebInspectorConnector();

  // Test domains of genuine companies
  const targetCompanies = await query(
    "SELECT id, legal_name, official_website, domain FROM companies WHERE legal_name IN ('Splash Corporation', 'Ever Bilena', 'Amcor', 'Armani') LIMIT 4"
  );

  console.log(`Auditing Contact Channels for ${targetCompanies.length} Genuine Entities...`);

  for (const c of targetCompanies) {
    console.log(`\n--- Inspecting Public Contact Endpoints for: ${c.legal_name} ---`);
    console.log(`Website URL: ${c.official_website || 'None'}`);

    // Execute Contact Research Agent
    const agentStart = Date.now();
    const result = await aiAgentEngine.runContactResearchAgent({ companyId: c.id });
    console.log(`Contact Research Agent Duration: ${Date.now() - agentStart}ms`);
    console.log(`Contacts currently recorded: ${result.verifiedContactsCount}`);

    // If website exists, run live domain inspection to discover public mailto / contact pages
    if (c.official_website) {
      console.log(`Running live WebInspector inspection on: ${c.official_website}...`);
      const inspection = await webInspector.inspectDomain(c.official_website);
      console.log(`Domain Live: ${inspection.isLive}`);
      console.log(`Has Contact Page Link: ${inspection.hasContactPage}`);
      console.log(`Publicly Listed Mailto Emails: ${inspection.publicEmails?.join(', ') || 'None exposed in HTML'}`);
      console.log(`Inspection Status: ${inspection.isLive ? 'Online Asset' : (inspection.error || 'Unavailable')}`);
    }
  }

  // Audit existing contacts in database
  const contacts = await query("SELECT * FROM business_contacts");
  console.log(`\nTotal Decision-Maker Contacts in Database: ${contacts.length}`);
  contacts.forEach((ct, i) => {
    console.log(`  [Contact ${i + 1}]`);
    console.log(`    Name: ${ct.full_name}`);
    console.log(`    Role: ${ct.job_title}`);
    console.log(`    Status: ${ct.contact_status}`);
    console.log(`    Email: ${ct.business_email || 'Not available'}`);
    console.log(`    Evidence: ${ct.evidence_source}`);
  });

  console.log('=== CONTACT DISCOVERY AUDIT END ===');
  process.exit(0);
}

auditContacts().catch(console.error);
