import express from 'express';
import { query, getOne, execute } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { calculateLeadScore } from '../services/scoringEngine.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// Get scoring weights
router.get('/weights', authenticateToken, async (req, res) => {
  try {
    const rows = await query("SELECT key, value, description FROM system_settings WHERE key LIKE 'scoring_weight_%'");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load scoring weights.' });
  }
});

// Update scoring weights (Admin only)
router.post('/weights', authenticateToken, requireRole('role_admin', 'Administrator'), async (req, res) => {
  const { weights } = req.body; // { industryFit: 25, serviceFit: 25, ... }

  try {
    if (weights.industryFit !== undefined) {
      await execute("UPDATE system_settings SET value = $1 WHERE key = 'scoring_weight_industry_fit'", [String(weights.industryFit)]);
    }
    if (weights.serviceFit !== undefined) {
      await execute("UPDATE system_settings SET value = $1 WHERE key = 'scoring_weight_service_fit'", [String(weights.serviceFit)]);
    }
    if (weights.purchasingPotential !== undefined) {
      await execute("UPDATE system_settings SET value = $1 WHERE key = 'scoring_weight_purchasing_potential'", [String(weights.purchasingPotential)]);
    }
    if (weights.legitimacy !== undefined) {
      await execute("UPDATE system_settings SET value = $1 WHERE key = 'scoring_weight_legitimacy'", [String(weights.legitimacy)]);
    }
    if (weights.buyingSignals !== undefined) {
      await execute("UPDATE system_settings SET value = $1 WHERE key = 'scoring_weight_buying_signals'", [String(weights.buyingSignals)]);
    }

    await logAudit({
      userId: req.user.id,
      action: 'SCORING_WEIGHTS_UPDATED',
      entityType: 'settings',
      details: weights
    });

    res.json({ success: true, message: 'Scoring weights updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update scoring weights.' });
  }
});

// Rescore specific company
router.post('/rescore/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const scoreResult = await calculateLeadScore(companyId);

    await logAudit({
      userId: req.user.id,
      action: 'COMPANY_RESCORED',
      entityType: 'company',
      entityId: companyId,
      details: { totalScore: scoreResult.totalScore, priorityTier: scoreResult.priorityTier }
    });

    res.json(scoreResult);
  } catch (err) {
    res.status(500).json({ error: `Rescoring failed: ${err.message}` });
  }
});

export default router;
