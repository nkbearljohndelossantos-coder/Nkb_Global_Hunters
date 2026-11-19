import express from 'express';
import { query, getOne, execute } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// Get all system settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await query('SELECT key, value, category, description, updated_at FROM system_settings ORDER BY category, key');
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve system settings.' });
  }
});

// Update setting (Admin only)
router.put('/:key', authenticateToken, requireRole('role_admin', 'Administrator'), async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    return res.status(400).json({ error: 'Value is required.' });
  }

  try {
    await execute(
      'UPDATE system_settings SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP WHERE key = $3',
      [String(value), req.user.id, key]
    );

    await logAudit({
      userId: req.user.id,
      action: 'SYSTEM_SETTING_UPDATED',
      entityType: 'settings',
      entityId: key,
      details: { key, newValue: value }
    });

    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update system setting.' });
  }
});

export default router;
