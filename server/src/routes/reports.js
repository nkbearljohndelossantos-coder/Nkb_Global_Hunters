import express from 'express';
import { query } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { exportEngine } from '../services/exportEngine.js';

const router = express.Router();

router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // Prospects by Country
    const byCountry = await query(
      `SELECT primary_country as label, COUNT(*) as value 
       FROM companies 
       GROUP BY primary_country 
       ORDER BY value DESC`
    );

    // Prospects by Industry
    const byIndustry = await query(
      `SELECT primary_industry as label, COUNT(*) as value 
       FROM companies 
       GROUP BY primary_industry 
       ORDER BY value DESC`
    );

    // Prospects by NKB Service Synergy
    const byService = await query(
      `SELECT nkb_service_fit as label, COUNT(*) as value 
       FROM companies 
       GROUP BY nkb_service_fit 
       ORDER BY value DESC`
    );

    // Lead Quality Distribution (Tiers A, B, C, D)
    const byTier = await query(
      `SELECT priority_tier as label, COUNT(*) as value 
       FROM lead_scores 
       GROUP BY priority_tier 
       ORDER BY priority_tier ASC`
    );

    // Pipeline Funnel
    const pipelineFunnel = await query(
      `SELECT pipeline_stage as label, COUNT(*) as value 
       FROM opportunities 
       GROUP BY pipeline_stage`
    );

    res.json({
      byCountry: byCountry || [],
      byIndustry: byIndustry || [],
      byService: byService || [],
      byTier: byTier || [],
      pipelineFunnel: pipelineFunnel || []
    });
  } catch (err) {
    console.error('[Analytics Error]', err);
    res.status(500).json({ error: 'Failed to generate analytics report.' });
  }
});

// CSV Export for Companies
router.get('/export/companies', authenticateToken, async (req, res) => {
  try {
    const companies = await query(
      `SELECT c.*, ls.total_score, ls.priority_tier, ls.confidence_level
       FROM companies c
       LEFT JOIN lead_scores ls ON c.id = ls.company_id
       WHERE c.is_archived = 0
       ORDER BY c.first_discovered_at DESC`
    );

    const csvData = exportEngine.exportCompaniesCSV(companies);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="nkb_companies_export.csv"');
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// CSV Export for Opportunities
router.get('/export/opportunities', authenticateToken, async (req, res) => {
  try {
    const opps = await query(
      `SELECT o.*, c.legal_name as company_name, u.full_name as assigned_name
       FROM opportunities o
       JOIN companies c ON o.company_id = c.id
       LEFT JOIN users u ON o.assigned_to = u.id
       ORDER BY o.created_at DESC`
    );

    const csvData = exportEngine.exportOpportunitiesCSV(opps);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="nkb_opportunities_export.csv"');
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
