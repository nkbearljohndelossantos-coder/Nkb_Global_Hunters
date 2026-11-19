import express from 'express';
import { query, getOne } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { proposalEngine } from '../services/proposalEngine.js';

const router = express.Router();

// List proposals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, companyId, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT p.*, c.legal_name as company_name, c.primary_country,
             u.full_name as creator_name, app.full_name as approver_name
      FROM proposals p
      JOIN companies c ON p.company_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN users app ON p.approved_by = app.id
      WHERE 1=1
    `;
    const params = [];
    let pIdx = 1;

    if (status) {
      sql += ` AND p.status = $${pIdx++}`;
      params.push(status);
    }
    if (companyId) {
      sql += ` AND p.company_id = $${pIdx++}`;
      params.push(companyId);
    }
    if (search) {
      sql += ` AND (LOWER(p.title) LIKE $${pIdx} OR LOWER(p.proposal_number) LIKE $${pIdx} OR LOWER(c.legal_name) LIKE $${pIdx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }

    const countRow = await getOne(`SELECT COUNT(*) as count FROM (${sql}) sub`, params);
    const totalCount = parseInt(countRow?.count || 0, 10);

    sql += ` ORDER BY p.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
    params.push(parseInt(limit, 10), offset);

    const rows = await query(sql, params);

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('[Proposals List Error]', err);
    res.status(500).json({ error: 'Failed to retrieve proposals.' });
  }
});

// Get proposal detail
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const proposal = await proposalEngine.getProposalById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found.' });
    }
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch proposal details.' });
  }
});

// Create proposal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const proposal = await proposalEngine.createProposal({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(proposal);
  } catch (err) {
    console.error('[Proposal Create Error]', err);
    res.status(500).json({ error: `Failed to create proposal: ${err.message}` });
  }
});

// Update proposal status (Approval workflow requires Manager or Admin)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  if (status === 'approved' && req.user.role_id === 'role_sales_staff') {
    return res.status(403).json({ error: 'Sales Staff cannot self-approve proposals. Sales Manager or Administrator approval required.' });
  }

  try {
    const updated = await proposalEngine.updateStatus(req.params.id, status, req.user.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
