import express from 'express';
import { query, getOne } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { country, industry, service } = req.query;

    let filterSql = 'WHERE 1=1';
    const params = [];
    let pIdx = 1;

    if (country) {
      filterSql += ` AND primary_country = $${pIdx++}`;
      params.push(country);
    }
    if (industry) {
      filterSql += ` AND primary_industry = $${pIdx++}`;
      params.push(industry);
    }
    if (service) {
      filterSql += ` AND nkb_service_fit = $${pIdx++}`;
      params.push(service);
    }

    // Real company totals from actual database records
    const totalCompanies = await getOne(`SELECT COUNT(*) as count FROM companies ${filterSql}`, params);
    const verifiedCompanies = await getOne(`SELECT COUNT(*) as count FROM companies ${filterSql} AND verification_status = 'verified'`, params);
    const awaitingResearch = await getOne(`SELECT COUNT(*) as count FROM companies ${filterSql} AND last_researched_at IS NULL`, params);
    const awaitingVerification = await getOne(`SELECT COUNT(*) as count FROM companies ${filterSql} AND verification_status = 'unverified'`, params);

    // Lead qualification tiers from lead_scores
    const tierACount = await getOne(
      `SELECT COUNT(*) as count FROM lead_scores ls 
       JOIN companies c ON ls.company_id = c.id 
       ${filterSql.replace(/WHERE/g, 'WHERE 1=1 AND')} AND ls.priority_tier = 'A'`,
      params
    );

    const qualifiedCount = await getOne(
      `SELECT COUNT(*) as count FROM lead_scores ls 
       JOIN companies c ON ls.company_id = c.id 
       ${filterSql.replace(/WHERE/g, 'WHERE 1=1 AND')} AND ls.priority_tier IN ('A', 'B')`,
      params
    );

    // Opportunities & Pipeline stages
    const activeOpportunities = await getOne("SELECT COUNT(*) as count FROM opportunities WHERE pipeline_stage NOT IN ('lost', 'disqualified', 'contract_won')");
    const contactedCount = await getOne("SELECT COUNT(*) as count FROM opportunities WHERE pipeline_stage = 'contacted'");
    const interestedCount = await getOne("SELECT COUNT(*) as count FROM opportunities WHERE pipeline_stage = 'interested'");
    const rfqCount = await getOne("SELECT COUNT(*) as count FROM opportunities WHERE pipeline_stage IN ('rfq_received', 'quotation_submitted')");
    const negotiationCount = await getOne("SELECT COUNT(*) as count FROM opportunities WHERE pipeline_stage = 'negotiation'");
    const wonCount = await getOne("SELECT COUNT(*) as count FROM opportunities WHERE pipeline_stage = 'contract_won'");
    const lostCount = await getOne("SELECT COUNT(*) as count FROM opportunities WHERE pipeline_stage = 'lost'");

    // Country Breakdown
    const countryStats = await query(
      `SELECT primary_country, COUNT(*) as count 
       FROM companies 
       GROUP BY primary_country 
       ORDER BY count DESC LIMIT 8`
    );

    // Industry Breakdown
    const industryStats = await query(
      `SELECT primary_industry, COUNT(*) as count 
       FROM companies 
       GROUP BY primary_industry 
       ORDER BY count DESC LIMIT 6`
    );

    // Pipeline Distribution
    const pipelineDistribution = await query(
      `SELECT pipeline_stage, COUNT(*) as count 
       FROM opportunities 
       GROUP BY pipeline_stage`
    );

    res.json({
      metrics: {
        totalCompanies: parseInt(totalCompanies?.count || 0, 10),
        verifiedCompanies: parseInt(verifiedCompanies?.count || 0, 10),
        qualifiedProspects: parseInt(qualifiedCount?.count || 0, 10),
        highPriorityEnterprise: parseInt(tierACount?.count || 0, 10),
        awaitingResearch: parseInt(awaitingResearch?.count || 0, 10),
        awaitingVerification: parseInt(awaitingVerification?.count || 0, 10),
        contactedProspects: parseInt(contactedCount?.count || 0, 10),
        interestedProspects: parseInt(interestedCount?.count || 0, 10),
        activeOpportunities: parseInt(activeOpportunities?.count || 0, 10),
        rfqOpportunities: parseInt(rfqCount?.count || 0, 10),
        negotiations: parseInt(negotiationCount?.count || 0, 10),
        wonContracts: parseInt(wonCount?.count || 0, 10),
        lostOpportunities: parseInt(lostCount?.count || 0, 10)
      },
      countryBreakdown: countryStats || [],
      industryBreakdown: industryStats || [],
      pipelineBreakdown: pipelineDistribution || []
    });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    res.status(500).json({ error: 'Failed to compute dashboard analytics.' });
  }
});

export default router;
