import { v4 as uuidv4 } from 'uuid';
import { execute, getOne, query } from '../db/index.js';
import { logAudit } from './auditService.js';

export class ProposalEngine {
  async createProposal({
    companyId,
    opportunityId,
    title,
    serviceType,
    introduction,
    manufacturingSpecs,
    proposedSolutions,
    commercialTerms,
    nextSteps,
    items = [],
    userId
  }) {
    const company = await getOne('SELECT legal_name, nkb_service_fit FROM companies WHERE id = $1', [companyId]);
    if (!company) throw new Error('Company not found');

    const proposalId = uuidv4();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const proposalNumber = `NKB-PROP-${dateStr}-${randomSuffix}`;

    const finalTitle = title || `Commercial Manufacturing Proposal: ${company.legal_name}`;
    const finalService = serviceType || company.nkb_service_fit || 'Cosmetics OEM/ODM';

    await execute(
      `INSERT INTO proposals (
        id, proposal_number, company_id, opportunity_id, title, service_type, status,
        introduction, manufacturing_specs, proposed_solutions, commercial_terms, next_steps,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        proposalId,
        proposalNumber,
        companyId,
        opportunityId || null,
        finalTitle,
        finalService,
        'draft',
        introduction || `NKB Manufacturing presents this strategic OEM/ODM proposal to ${company.legal_name}.`,
        manufacturingSpecs || 'GMP-certified cleanroom production, automated filling lines, batch quality assurance.',
        proposedSolutions || 'Turn-key formulation compounding, regulatory documentation, primary & secondary packaging.',
        commercialTerms || 'FOB / EXW terms. Standard payment 50% deposit upon order confirmation, 50% prior to dispatch.',
        nextSteps || '1. Technical review meeting.\n2. Formulation sample approval.\n3. Purchase Order issuance.',
        userId || null
      ]
    );

    // Insert items if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.name) {
          await execute(
            `INSERT INTO proposal_items (id, proposal_id, item_name, specification, moq_units, lead_time_days)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [uuidv4(), proposalId, item.name, item.specification || '', item.moq || 1000, item.leadTime || 21]
          );
        }
      }
    }

    if (userId) {
      await logAudit({
        userId,
        action: 'PROPOSAL_CREATED',
        entityType: 'proposal',
        entityId: proposalId,
        details: { proposalNumber, companyName: company.legal_name }
      });
    }

    return await this.getProposalById(proposalId);
  }

  async getProposalById(id) {
    const proposal = await getOne(
      `SELECT p.*, c.legal_name as company_name, c.official_website, c.primary_country,
              u.full_name as creator_name, app.full_name as approver_name
       FROM proposals p
       JOIN companies c ON p.company_id = c.id
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN users app ON p.approved_by = app.id
       WHERE p.id = $1`,
      [id]
    );

    if (!proposal) return null;

    const items = await query('SELECT * FROM proposal_items WHERE proposal_id = $1', [id]);
    proposal.items = items;
    return proposal;
  }

  async updateStatus(id, newStatus, userId) {
    const validStatuses = ['draft', 'pending_approval', 'approved', 'sent', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid proposal status: ${newStatus}`);
    }

    let approvedBy = null;
    let approvedAt = null;
    if (newStatus === 'approved') {
      approvedBy = userId;
      approvedAt = new Date().toISOString();
    }

    await execute(
      `UPDATE proposals 
       SET status = $1, 
           approved_by = COALESCE($2, approved_by), 
           approved_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newStatus, approvedBy, id]
    );

    if (userId) {
      await logAudit({
        userId,
        action: `PROPOSAL_STATUS_${newStatus.toUpperCase()}`,
        entityType: 'proposal',
        entityId: id,
        details: { newStatus }
      });
    }

    return await this.getProposalById(id);
  }
}

export const proposalEngine = new ProposalEngine();
