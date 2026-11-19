import express from 'express';
import { query, getOne } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';

const router = express.Router();

// List email outreach messages
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const { status, companyId } = req.query;
    let sql = `
      SELECT m.*, c.legal_name as company_name, u.full_name as author_name, app.full_name as approver_name
      FROM email_messages m
      JOIN companies c ON m.company_id = c.id
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN users app ON m.approved_by = app.id
      WHERE 1=1
    `;
    const params = [];
    let pIdx = 1;

    if (status) {
      sql += ` AND m.status = $${pIdx++}`;
      params.push(status);
    }
    if (companyId) {
      sql += ` AND m.company_id = $${pIdx++}`;
      params.push(companyId);
    }

    sql += ' ORDER BY m.created_at DESC';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve email messages.' });
  }
});

// Create draft
router.post('/drafts', authenticateToken, async (req, res) => {
  try {
    const message = await emailService.createDraft({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Approve draft (Sales Manager or Admin approval required)
router.post('/messages/:id/approve', authenticateToken, requireRole('role_sales_manager', 'role_admin', 'Sales Manager', 'Administrator'), async (req, res) => {
  try {
    const message = await emailService.approveDraft(req.params.id, req.user.id);
    res.json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Send message (Only if approved)
router.post('/messages/:id/send', authenticateToken, async (req, res) => {
  try {
    const message = await emailService.sendApprovedMessage(req.params.id, req.user.id);
    res.json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Suppression list
router.get('/suppression', authenticateToken, async (req, res) => {
  try {
    const list = await query('SELECT * FROM email_suppression ORDER BY created_at DESC');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load suppression list.' });
  }
});

router.post('/suppression', authenticateToken, async (req, res) => {
  const { emailOrDomain, reason } = req.body;
  if (!emailOrDomain) {
    return res.status(400).json({ error: 'Email or domain is required.' });
  }
  try {
    const result = await emailService.addSuppression(emailOrDomain, reason);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
