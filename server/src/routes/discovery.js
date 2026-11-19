import express from 'express';
import { DiscoveryEngine } from '../services/discoveryEngine.js';
import { DecisionMakerEngine } from '../services/decisionMakerEngine.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const discoveryEngine = new DiscoveryEngine();
const decisionMakerEngine = new DecisionMakerEngine();

// 1. Search Companies
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

// 2. Search People / Decision Makers
router.post('/people', authenticateToken, async (req, res) => {
  const { role, industry, country, keyword, limit } = req.body;

  try {
    const people = await decisionMakerEngine.searchDecisionMakers({
      role,
      industry,
      country,
      keyword,
      limit: parseInt(limit, 10) || 15
    });

    res.json({
      success: true,
      count: people.length,
      data: people
    });
  } catch (err) {
    console.error('[Discovery People Error]', err);
    res.status(500).json({ error: `Failed to search decision makers: ${err.message}` });
  }
});

// 3. Save Discovered Decision Maker directly to CRM & Contacts
router.post('/save-person', authenticateToken, async (req, res) => {
  const { person } = req.body;

  if (!person || !person.fullName || !person.companyName) {
    return res.status(400).json({ error: 'Person details and company name are required.' });
  }

  try {
    const result = await decisionMakerEngine.saveDecisionMakerToDatabase(person, req.user.id);
    res.status(201).json(result);
  } catch (err) {
    console.error('[Save Person Error]', err);
    res.status(500).json({ error: `Failed to save decision maker: ${err.message}` });
  }
});

export default router;
