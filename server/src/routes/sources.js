import express from 'express';
import { query, getOne, execute } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const sources = await query(
      `SELECT rs.*, sc.id as connector_id, sc.status as connector_status,
              sc.last_synced_at, sc.requests_count, sc.error_count, sc.last_error
       FROM research_sources rs
       LEFT JOIN source_connectors sc ON rs.id = sc.source_id
       ORDER BY rs.created_at ASC`
    );
    res.json(sources);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve data sources.' });
  }
});

// Configure connector
router.post('/connectors/:id', authenticateToken, requireRole('role_admin', 'Administrator'), async (req, res) => {
  const { id } = req.params;
  const { authConfig, status } = req.body;

  try {
    const connector = await getOne('SELECT * FROM source_connectors WHERE id = $1', [id]);
    if (!connector) return res.status(404).json({ error: 'Connector not found' });

    let finalStatus = status || connector.status;
    let authConfigJson = connector.auth_config_json;

    if (authConfig) {
      authConfigJson = JSON.stringify(authConfig);
      finalStatus = 'active';
    }

    await execute(
      'UPDATE source_connectors SET auth_config_json = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [authConfigJson, finalStatus, id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'DATA_CONNECTOR_UPDATED',
      entityType: 'source_connector',
      entityId: id,
      details: { status: finalStatus }
    });

    res.json({ success: true, message: 'Connector configuration saved.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update connector configuration.' });
  }
});

export default router;
