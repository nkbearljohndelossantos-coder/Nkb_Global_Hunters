import express from 'express';
import { DiscoveryEngine } from '../services/discoveryEngine.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const discoveryEngine = new DiscoveryEngine();

router.post('/search', authenticateToken, async (req, res) => {
  const { country, industry, keyword, limit } = req.body;

  try {
    const result = await discoveryEngine.runDiscovery({
      country,
      industry,
      keyword,
      limit: parseInt(limit, 10) || 15,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: `Discovery complete. Found ${result.totalFound} matching companies (${result.newlyDiscovered} new, ${result.duplicatesDetected} existing).`,
      summary: result
    });
  } catch (err) {
    console.error('[Discovery Route Error]', err);
    res.status(500).json({ error: `Discovery failed: ${err.message}` });
  }
});

export default router;
