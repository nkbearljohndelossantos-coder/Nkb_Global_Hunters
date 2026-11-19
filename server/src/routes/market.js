import express from 'express';
import { query, getOne } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const { country, industry } = req.query;
    let sql = 'SELECT * FROM market_reports WHERE 1=1';
    const params = [];
    let pIdx = 1;

    if (country) {
      sql += ` AND country = $${pIdx++}`;
      params.push(country);
    }
    if (industry) {
      sql += ` AND industry = $${pIdx++}`;
      params.push(industry);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load market intelligence reports.' });
  }
});

router.get('/signals', authenticateToken, async (req, res) => {
  try {
    // Collect verifiable business signals from registered research records
    const signals = await query(
      `SELECT cr.id, cr.company_id, c.legal_name as company_name, c.primary_country, c.primary_industry,
              cr.expansion_signals, cr.procurement_signals, cr.confidence_rating, cr.created_at
       FROM company_research cr
       JOIN companies c ON cr.company_id = c.id
       WHERE cr.expansion_signals IS NOT NULL OR cr.procurement_signals IS NOT NULL
       ORDER BY cr.created_at DESC LIMIT 30`
    );
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve market signals.' });
  }
});

export default router;
