import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, execute, getOne, query } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { proposalEngine } from '../src/services/proposalEngine.js';
import { emailService } from '../src/services/emailService.js';

describe('CRM Pipeline & Proposal Governance Acceptance Tests', () => {
  let testCompanyId;
  let testOppId;

  before(async () => {
    await initDatabase();
    await runMigrations();

    testCompanyId = uuidv4();
    await execute(
      `INSERT INTO companies (id, legal_name, primary_country, primary_industry, source_attribution)
       VALUES ($1, $2, $3, $4, $5)`,
      [testCompanyId, 'Verified Contract Client Ltd', 'Japan', 'Perfume', 'Acceptance Suite Reference']
    );

    testOppId = uuidv4();
    await execute(
      `INSERT INTO opportunities (id, company_id, title, pipeline_stage, service_category)
       VALUES ($1, $2, $3, $4, $5)`,
      [testOppId, testCompanyId, 'Perfume OEM Partnership', 'new_prospect', 'Perfume OEM/ODM']
    );
  });

  test('Creating proposal sets status to draft', async () => {
    const proposal = await proposalEngine.createProposal({
      companyId: testCompanyId,
      opportunityId: testOppId,
      title: 'Perfume OEM Production Proposal',
      serviceType: 'Perfume OEM/ODM',
      introduction: 'Introduction to contract manufacturing.',
      manufacturingSpecs: 'ISO 22716 Certified fragrance bottling.'
    });

    assert.ok(proposal.id);
    assert.ok(proposal.proposal_number.startsWith('NKB-PROP-'));
    assert.strictEqual(proposal.status, 'draft');
  });

  test('Sales Manager approval advances proposal status to approved', async () => {
    const admin = await getOne('SELECT id FROM users LIMIT 1');
    const proposal = await proposalEngine.createProposal({
      companyId: testCompanyId,
      title: 'Fragrance Proposal',
      serviceType: 'Perfume OEM/ODM',
      userId: admin.id
    });

    const approved = await proposalEngine.updateStatus(proposal.id, 'approved', admin.id);
    assert.strictEqual(approved.status, 'approved');
    assert.ok(approved.approved_at);
  });

  test('Email outreach strictly enforces suppression list', async () => {
    const suppressedEmail = 'blocked.procurement@example.com';
    await emailService.addSuppression(suppressedEmail, 'unsubscribed');

    await assert.rejects(
      async () => {
        await emailService.createDraft({
          companyId: testCompanyId,
          recipientEmail: suppressedEmail,
          subject: 'Partnership Inquiry',
          bodyText: 'Hello from NKB'
        });
      },
      /suppression list/i,
      'System must reject drafting emails to suppressed recipients'
    );
  });
});
