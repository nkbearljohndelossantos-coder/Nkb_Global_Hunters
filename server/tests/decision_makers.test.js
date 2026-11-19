import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { DecisionMakerEngine } from '../src/services/decisionMakerEngine.js';
import { initDatabase, query } from '../src/db/index.js';

describe('Decision Maker & People Hunter Acceptance Tests', () => {
  let engine;

  before(async () => {
    await initDatabase();
    engine = new DecisionMakerEngine();
  });

  test('searchDecisionMakers finds real decision makers by country and industry', async () => {
    const results = await engine.searchDecisionMakers({
      country: 'Philippines',
      industry: 'Cosmetics',
      role: 'All'
    });

    assert.ok(Array.isArray(results), 'Results should be an array');
    assert.ok(results.length >= 5, `Expected at least 5 results, got ${results.length}`);

    // Verify properties of results
    const first = results[0];
    assert.ok(first.fullName, 'Person must have a full name');
    assert.ok(first.jobTitle, 'Person must have a job title');
    assert.ok(first.companyName, 'Person must be linked to a company');
    assert.ok(first.officialWebsite, 'Company must have an official website');
    assert.ok(first.evidenceSource, 'Evidence source must be traceable');
    assert.strictEqual(first.country, 'Philippines');
  });

  test('searchDecisionMakers filters by specific roles', async () => {
    const ceoResults = await engine.searchDecisionMakers({
      country: 'Philippines',
      industry: 'Cosmetics',
      role: 'Founder / CEO'
    });

    assert.ok(ceoResults.length > 0, 'Should find founders/CEOs');
    for (const r of ceoResults) {
      assert.ok(
        /founder|ceo|owner|president|director/i.test(r.jobTitle + ' ' + r.department),
        `Role ${r.jobTitle} should match founder/ceo filter`
      );
    }
  });

  test('saveDecisionMakerToDatabase links person to company and creates CRM opportunity', async () => {
    const testPerson = {
      fullName: 'Dioceldo Sy',
      jobTitle: 'Chief Executive Officer & Founder',
      department: 'Executive / Sourcing',
      companyName: 'Ever Bilena Cosmetics, Inc.',
      country: 'Philippines',
      industry: 'Cosmetics',
      officialWebsite: 'https://everbilena.com.ph',
      nkbServiceFit: 'Cosmetics OEM/ODM',
      evidenceSource: 'Corporate Leadership Directory',
      status: 'verified'
    };

    const res = await engine.saveDecisionMakerToDatabase(testPerson, 'usr_admin_001');
    assert.strictEqual(res.success, true);
    assert.ok(res.companyId, 'Company must be created or linked');
    assert.ok(res.contact?.id, 'Contact must be created');
    assert.strictEqual(res.contact.full_name, 'Dioceldo Sy');

    // Verify database record
    const contacts = await query('SELECT * FROM business_contacts WHERE id = $1', [res.contact.id]);
    assert.strictEqual(contacts.length, 1);
    assert.strictEqual(contacts[0].full_name, 'Dioceldo Sy');
  });
});
