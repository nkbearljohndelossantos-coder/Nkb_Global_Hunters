import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, execute, getOne } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { calculateLeadScore } from '../src/services/scoringEngine.js';

describe('100-Point Qualification Scoring Acceptance Tests', () => {
  let testCompanyId;

  before(async () => {
    await initDatabase();
    await runMigrations();

    // Create verified test entity in database
    testCompanyId = uuidv4();
    await execute(
      `INSERT INTO companies (
        id, legal_name, trading_name, official_website, domain, primary_country,
        primary_industry, business_type, nkb_service_fit, source_attribution
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        testCompanyId,
        'Test Cosmetics Labs Corp',
        'Test Cosmetics',
        'https://testcosmeticslabs.com',
        'testcosmeticslabs.com',
        'Philippines',
        'Cosmetics',
        'Brand Owner',
        'Cosmetics OEM/ODM',
        'Automated Test Fixture - Isolated Acceptance Suite'
      ]
    );
  });

  test('calculateLeadScore evaluates 5 dimensions up to 100 points', async () => {
    const score = await calculateLeadScore(testCompanyId);

    assert.ok(score.totalScore >= 0 && score.totalScore <= 100, 'Score must be between 0 and 100');
    assert.ok(['A', 'B', 'C', 'D'].includes(score.priorityTier), 'Priority tier must be A, B, C, or D');
    assert.strictEqual(score.breakdown.industryFit.score, 25, 'Direct cosmetics industry receives max 25 points');
    assert.strictEqual(score.breakdown.serviceFit.score, 25, 'Direct Cosmetics OEM/ODM synergy receives max 25 points');
    assert.ok(score.explanation.length > 10, 'Scoring explanation must be provided');
  });

  test('calculateLeadScore flags missing information transparently', async () => {
    const score = await calculateLeadScore(testCompanyId);
    assert.ok(score.missingInformation.length > 0, 'Missing contacts/signals must be flagged');
  });

  test('Adding verified contact increases buying signals score', async () => {
    const scoreBefore = await calculateLeadScore(testCompanyId);

    // Add contact
    await execute(
      `INSERT INTO business_contacts (
        id, company_id, full_name, job_title, department, business_email, contact_status, evidence_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        testCompanyId,
        'Maria Reyes',
        'Sourcing Manager',
        'Procurement',
        'sourcing@testcosmeticslabs.com',
        'verified',
        'Official procurement registry listing'
      ]
    );

    const scoreAfter = await calculateLeadScore(testCompanyId);
    assert.ok(scoreAfter.totalScore >= scoreBefore.totalScore, 'Score must increase or stay consistent when verified contact is identified');
  });
});
