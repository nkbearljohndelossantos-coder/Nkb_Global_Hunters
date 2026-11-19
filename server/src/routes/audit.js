import express from 'express';
import { query, getOne } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List audit logs (Admin only)
router.get('/', authenticateToken, requireRole('role_admin', 'Administrator'), async (req, res) => {
  try {
    const { action, entityType, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `
      SELECT a.*, u.username, u.full_name, u.email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let pIdx = 1;

    if (action) {
      sql += ` AND a.action = $${pIdx++}`;
      params.push(action);
    }
    if (entityType) {
      sql += ` AND a.entity_type = $${pIdx++}`;
      params.push(entityType);
    }

    const countRow = await getOne(`SELECT COUNT(*) as count FROM (${sql}) sub`, params);
    const totalCount = parseInt(countRow?.count || 0, 10);

    sql += ` ORDER BY a.created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
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
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

export default router;
