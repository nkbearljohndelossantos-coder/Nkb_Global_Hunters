import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { initDatabase, query } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { DiscoveryEngine } from '../src/services/discoveryEngine.js';

describe('Discovery Engine & Zero-Dummy-Data Policy Acceptance Tests', () => {
  before(async () => {
    await initDatabase();
    await runMigrations();
  });

  test('All companies in database have traceable source attribution', async () => {
    const companiesWithoutSource = await query(
      "SELECT id, legal_name FROM companies WHERE source_attribution IS NULL OR source_attribution = ''"
    );
    assert.strictEqual(
      companiesWithoutSource.length,
      0,
      'Every single stored company must possess traceable source attribution.'
    );
  });

  test('Duplicate company insertion is detected and reconciled', async () => {
    const discoveryEngine = new DiscoveryEngine();
    const uniqueTag = Date.now();
    const item = {
      legalName: `Deduplication Test Enterprise ${uniqueTag}`,
      domain: `deduptest${uniqueTag}.ph`,
      officialWebsite: `https://deduptest${uniqueTag}.ph`,
      primaryCountry: 'Philippines',
      primaryIndustry: 'Cosmetics',
      nkbServiceFit: 'Cosmetics OEM/ODM',
      sourceAttribution: 'Deduplication Acceptance Test'
    };

    // First insertion
    const firstResult = await discoveryEngine.persistCompanyIfUnique(item, 'admin');
    assert.strictEqual(firstResult.isNew, true, 'First insertion must be new');

    // Second insertion (duplicate)
    const secondResult = await discoveryEngine.persistCompanyIfUnique(item, 'admin');
    assert.strictEqual(secondResult.isNew, false, 'Duplicate insertion must be flagged as existing');
    assert.strictEqual(secondResult.company.id, firstResult.company.id, 'Duplicate must return existing record ID');
  });
});
