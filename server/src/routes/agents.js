import express from 'express';
import { query, getOne } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiAgentEngine } from '../services/aiAgentEngine.js';

const router = express.Router();

// List execution logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { agentName, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = 'SELECT * FROM agent_execution_logs WHERE 1=1';
    const params = [];
    let pIdx = 1;

    if (agentName) {
      sql += ` AND agent_name = $${pIdx++}`;
      params.push(agentName);
    }
    if (status) {
      sql += ` AND status = $${pIdx++}`;
      params.push(status);
    }

    const countRow = await getOne(`SELECT COUNT(*) as count FROM (${sql}) sub`, params);
    const totalCount = parseInt(countRow?.count || 0, 10);

    sql += ` ORDER BY created_at DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;
    params.push(parseInt(limit, 10), offset);

    const logs = await query(sql, params);

    res.json({
      data: logs.map(l => ({
        ...l,
        inputPayload: l.input_payload_json ? JSON.parse(l.input_payload_json) : null,
        outputResult: l.output_result_json ? JSON.parse(l.output_result_json) : null
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('[Agent Logs Error]', err);
    res.status(500).json({ error: 'Failed to retrieve agent logs.' });
  }
});

// Trigger an agent
router.post('/run', authenticateToken, async (req, res) => {
  const { agentType, companyId, url, country, industry, serviceType } = req.body;

  try {
    let result;
    switch (agentType) {
      case 'global_research':
        result = await aiAgentEngine.runGlobalResearchAgent({ companyId, url });
        break;
      case 'company_intelligence':
        result = await aiAgentEngine.runCompanyIntelligenceAgent({ companyId });
        break;
      case 'lead_qualification':
        result = await aiAgentEngine.runLeadQualificationAgent({ companyId });
        break;
      case 'market_opportunity':
        result = await aiAgentEngine.runMarketOpportunityAgent({ country, industry });
        break;
      case 'contact_research':
        result = await aiAgentEngine.runContactResearchAgent({ companyId });
        break;
      case 'sales_proposal':
        result = await aiAgentEngine.runSalesProposalAgent({ companyId, serviceType });
        break;
      case 'follow_up':
        result = await aiAgentEngine.runFollowUpRecommendationAgent({ companyId });
        break;
      default:
        return res.status(400).json({ error: `Unknown agent type: ${agentType}` });
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error('[Agent Execution Error]', err);
    res.status(500).json({ error: `Agent failed: ${err.message}` });
  }
});

export default router;
