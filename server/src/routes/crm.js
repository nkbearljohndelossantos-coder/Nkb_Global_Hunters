import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, getOne, execute } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

export const PIPELINE_STAGES = [
  'new_prospect',
  'researching',
  'qualified',
  'contact_identified',
  'ready_for_outreach',
  'contacted',
  'interested',
  'meeting_scheduled',
  'rfq_received',
  'quotation_submitted',
  'negotiation',
  'contract_won',
  'lost',
  'disqualified'
];

// Get Kanban board columns or pipeline list
router.get('/pipeline', authenticateToken, async (req, res) => {
  try {
    const opportunities = await query(
      `SELECT o.*, c.legal_name as company_name, c.primary_country, c.primary_industry, c.official_website,
              u.full_name as assigned_name, ls.total_score, ls.priority_tier
       FROM opportunities o
       JOIN companies c ON o.company_id = c.id
       LEFT JOIN users u ON o.assigned_to = u.id
       LEFT JOIN lead_scores ls ON c.id = ls.company_id
       ORDER BY o.updated_at DESC`
    );

    // Group by stage for Kanban visualization
    const grouped = {};
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage] = [];
    });

    opportunities.forEach(opp => {
      if (grouped[opp.pipeline_stage]) {
        grouped[opp.pipeline_stage].push(opp);
      } else {
        grouped['new_prospect'].push(opp);
      }
    });

    res.json({ stages: PIPELINE_STAGES, board: grouped, total: opportunities.length });
  } catch (err) {
    console.error('[CRM Pipeline Error]', err);
    res.status(500).json({ error: 'Failed to retrieve pipeline.' });
  }
});

// Update opportunity stage (Drag & Drop or dropdown change with audit trail)
router.patch('/opportunities/:id/stage', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { stage, note, disqualificationReason, lossReason } = req.body;

  if (!PIPELINE_STAGES.includes(stage)) {
    return res.status(400).json({ error: `Invalid pipeline stage: ${stage}` });
  }

  try {
    const opp = await getOne('SELECT * FROM opportunities WHERE id = $1', [id]);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    const fromStage = opp.pipeline_stage;

    // Update opportunity
    await execute(
      `UPDATE opportunities SET
        pipeline_stage = $1,
        disqualification_reason = COALESCE($2, disqualification_reason),
        loss_reason = COALESCE($3, loss_reason),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [stage, disqualificationReason || null, lossReason || null, id]
    );

    // Record stage history
    const historyId = uuidv4();
    await execute(
      'INSERT INTO pipeline_history (id, opportunity_id, from_stage, to_stage, note, changed_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [historyId, id, fromStage, stage, note || `Stage updated from ${fromStage} to ${stage}`, req.user.id]
    );

    // Record sales activity
    await execute(
      `INSERT INTO sales_activities (id, company_id, opportunity_id, activity_type, summary, details, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        opp.company_id,
        id,
        'status_change',
        `Pipeline stage transitioned to ${stage}`,
        note || null,
        req.user.id
      ]
    );

    await logAudit({
      userId: req.user.id,
      action: 'OPPORTUNITY_STAGE_CHANGED',
      entityType: 'opportunity',
      entityId: id,
      details: { fromStage, toStage: stage, note }
    });

    const updated = await getOne('SELECT * FROM opportunities WHERE id = $1', [id]);
    res.json(updated);
  } catch (err) {
    console.error('[Stage Update Error]', err);
    res.status(500).json({ error: 'Failed to update pipeline stage.' });
  }
});

// Add sales activity / note
router.post('/activities', authenticateToken, async (req, res) => {
  const { companyId, opportunityId, activityType, summary, details } = req.body;

  if (!companyId || !activityType || !summary) {
    return res.status(400).json({ error: 'Company ID, activity type, and summary are required.' });
  }

  try {
    const id = uuidv4();
    await execute(
      `INSERT INTO sales_activities (id, company_id, opportunity_id, activity_type, summary, details, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, companyId, opportunityId || null, activityType, summary.trim(), details || null, req.user.id]
    );

    const created = await getOne('SELECT * FROM sales_activities WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log sales activity.' });
  }
});

// Tasks management
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await query(
      `SELECT t.*, c.legal_name as company_name, u.full_name as assigned_name
       FROM tasks t
       LEFT JOIN companies c ON t.company_id = c.id
       LEFT JOIN users u ON t.assigned_to = u.id
       ORDER BY t.created_at DESC`
    );
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

router.post('/tasks', authenticateToken, async (req, res) => {
  const { companyId, opportunityId, title, description, priority, dueDate, assignedTo } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  try {
    const id = uuidv4();
    await execute(
      `INSERT INTO tasks (id, company_id, opportunity_id, title, description, priority, due_date, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        companyId || null,
        opportunityId || null,
        title.trim(),
        description || null,
        priority || 'medium',
        dueDate || null,
        assignedTo || req.user.id
      ]
    );

    const created = await getOne('SELECT * FROM tasks WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

router.patch('/tasks/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  try {
    await execute(
      `UPDATE tasks SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = $2`,
      [status, req.params.id]
    );
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status.' });
  }
});

export default router;
