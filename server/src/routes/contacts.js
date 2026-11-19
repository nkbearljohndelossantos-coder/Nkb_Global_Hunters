import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, getOne, execute } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateLeadScore } from '../services/scoringEngine.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// List contacts with company info
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, companyId, search, page = 1, limit = 25 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT bc.*, c.legal_name as company_name, c.primary_country, c.primary_industry, c.official_website
      FROM business_contacts bc
      JOIN companies c ON bc.company_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let pIdx = 1;

    if (status) {
      sql += ` AND bc.contact_status = $${pIdx++}`;
      params.push(status);
    }
    if (companyId) {
      sql += ` AND bc.company_id = $${pIdx++}`;
      params.push(companyId);
    }
    if (search) {
      sql += ` AND (LOWER(bc.full_name) LIKE $${pIdx} OR LOWER(bc.job_title) LIKE $${pIdx} OR LOWER(bc.business_email) LIKE $${pIdx} OR LOWER(c.legal_name) LIKE $${pIdx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }

    const countSql = `SELECT COUNT(*) as count FROM (${sql}) sub`;
    const totalCountRow = await getOne(countSql, params);
    const totalCount = parseInt(totalCountRow?.count || 0, 10);

    sql += ` ORDER BY bc.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
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
    console.error('[Contacts List Error]', err);
    res.status(500).json({ error: 'Failed to retrieve contacts.' });
  }
});

// Add verified/publicly listed business contact
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      companyId,
      fullName,
      jobTitle,
      department,
      businessEmail,
      phoneNumber,
      linkedinUrl,
      contactStatus,
      evidenceSource,
      notes
    } = req.body;

    if (!companyId || !fullName || !jobTitle || !evidenceSource) {
      return res.status(400).json({
        error: 'Missing required contact fields: Company, Full Name, Job Title, and Evidence Source are mandatory.'
      });
    }

    const validStatuses = ['verified', 'publicly_listed', 'unverified', 'invalid', 'not_available'];
    const finalStatus = validStatuses.includes(contactStatus) ? contactStatus : 'unverified';

    const contactId = uuidv4();
    await execute(
      `INSERT INTO business_contacts (
        id, company_id, full_name, job_title, department, business_email,
        phone_number, linkedin_url, contact_status, evidence_source, verification_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11)`,
      [
        contactId,
        companyId,
        fullName.trim(),
        jobTitle.trim(),
        department || 'Procurement',
        businessEmail ? businessEmail.trim().toLowerCase() : null,
        phoneNumber ? phoneNumber.trim() : null,
        linkedinUrl ? linkedinUrl.trim() : null,
        finalStatus,
        evidenceSource.trim(),
        notes || null
      ]
    );

    // Re-score company with new contact evidence
    await calculateLeadScore(companyId);

    await logAudit({
      userId: req.user.id,
      action: 'CONTACT_CREATED',
      entityType: 'contact',
      entityId: contactId,
      details: { fullName, jobTitle, companyId, evidenceSource }
    });

    const created = await getOne('SELECT * FROM business_contacts WHERE id = $1', [contactId]);
    res.status(201).json(created);
  } catch (err) {
    console.error('[Contact Create Error]', err);
    res.status(500).json({ error: 'Failed to record contact.' });
  }
});

// Update contact status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const validStatuses = ['verified', 'publicly_listed', 'unverified', 'invalid', 'not_available'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid contact verification status.' });
    }

    await execute(
      'UPDATE business_contacts SET contact_status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [status, notes || null, id]
    );

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact status.' });
  }
});

export default router;
