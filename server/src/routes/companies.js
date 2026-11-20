import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, getOne, execute } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateLeadScore } from '../services/scoringEngine.js';
import { logAudit } from '../services/auditService.js';
import { WebInspectorConnector } from '../services/connectors/webInspectorConnector.js';

const router = express.Router();
const webInspector = new WebInspectorConnector();

// List companies with filtering, sorting, and server-side pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      country,
      industry,
      tier,
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'first_discovered_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const validSortCols = ['legal_name', 'primary_country', 'primary_industry', 'first_discovered_at', 'total_score'];
    const sortCol = validSortCols.includes(sortBy) ? sortBy : 'first_discovered_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let sql = `
      SELECT c.*, ls.total_score, ls.priority_tier, ls.confidence_level as score_confidence,
             (SELECT COUNT(*) FROM business_contacts bc WHERE bc.company_id = c.id) as contact_count,
             o.pipeline_stage, o.id as opportunity_id
      FROM companies c
      LEFT JOIN lead_scores ls ON c.id = ls.company_id
      LEFT JOIN opportunities o ON c.id = o.company_id
      WHERE c.is_archived = 0
    `;

    const params = [];
    let pIdx = 1;

    if (country) {
      sql += ` AND c.primary_country = $${pIdx++}`;
      params.push(country);
    }
    if (industry) {
      sql += ` AND c.primary_industry = $${pIdx++}`;
      params.push(industry);
    }
    if (status) {
      sql += ` AND c.verification_status = $${pIdx++}`;
      params.push(status);
    }
    if (tier) {
      sql += ` AND ls.priority_tier = $${pIdx++}`;
      params.push(tier);
    }
    if (search) {
      sql += ` AND (LOWER(c.legal_name) LIKE $${pIdx} OR LOWER(c.trading_name) LIKE $${pIdx} OR LOWER(c.domain) LIKE $${pIdx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      pIdx++;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM (${sql}) sub`;
    const totalCountRow = await getOne(countSql, params);
    const totalCount = parseInt(totalCountRow?.count || 0, 10);

    // Order & Pagination
    sql += ` ORDER BY ${sortCol === 'total_score' ? 'ls.total_score' : 'c.' + sortCol} ${order} LIMIT $${pIdx++} OFFSET $${pIdx++}`;
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
    console.error('[Companies List Error]', err);
    res.status(500).json({ error: 'Failed to retrieve company directory.' });
  }
});

// Get single company full profile with all relations
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const company = await getOne(
      `SELECT c.*, ls.total_score, ls.priority_tier, ls.industry_fit_score, ls.service_fit_score,
              ls.purchasing_potential_score, ls.business_legitimacy_score, ls.buying_signals_score,
              ls.confidence_level as score_confidence, ls.explanation as score_explanation,
              ls.missing_information, ls.recommended_action, ls.scored_at
       FROM companies c
       LEFT JOIN lead_scores ls ON c.id = ls.company_id
       WHERE c.id = $1`,
      [id]
    );

    if (!company) {
      return res.status(404).json({ error: 'Company profile not found.' });
    }

    const contacts = await query('SELECT * FROM business_contacts WHERE company_id = $1 ORDER BY created_at DESC', [id]);
    const research = await query('SELECT * FROM company_research WHERE company_id = $1 ORDER BY created_at DESC', [id]);
    const sources = await query('SELECT * FROM company_sources WHERE company_id = $1 ORDER BY created_at DESC', [id]);
    const opportunities = await query('SELECT * FROM opportunities WHERE company_id = $1 ORDER BY created_at DESC', [id]);
    const activities = await query('SELECT * FROM sales_activities WHERE company_id = $1 ORDER BY activity_date DESC', [id]);

    res.json({
      company,
      contacts: contacts || [],
      research: research || [],
      sources: sources || [],
      opportunities: opportunities || [],
      activities: activities || []
    });
  } catch (err) {
    console.error('[Company Profile Error]', err);
    res.status(500).json({ error: 'Failed to load company profile.' });
  }
});

// Update verification status
router.patch('/:id/verification', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const validStatuses = ['unverified', 'pending_research', 'verified', 'disqualified'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    await execute('UPDATE companies SET verification_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, id]);

    await logAudit({
      userId: req.user.id,
      action: 'COMPANY_VERIFICATION_CHANGE',
      entityType: 'company',
      entityId: id,
      details: { newStatus: status, reason }
    });

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update verification status.' });
  }
});

// Create company manually (e.g. from trade show or verified inquiry)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      legalName,
      tradingName,
      officialWebsite,
      primaryCountry,
      primaryCity,
      primaryIndustry,
      businessType,
      businessDescription,
      nkbServiceFit,
      sourceAttribution
    } = req.body;

    if (!legalName || !primaryCountry || !primaryIndustry || !sourceAttribution) {
      return res.status(400).json({
        error: 'Missing required fields: Legal Name, Country, Industry, and Source Attribution are mandatory.'
      });
    }

    let domain = null;
    if (officialWebsite) {
      try {
        domain = new URL(officialWebsite.startsWith('http') ? officialWebsite : `https://${officialWebsite}`).hostname.replace(/^www\./, '');
      } catch (e) {
        domain = null;
      }
    }

    const companyId = uuidv4();
    await execute(
      `INSERT INTO companies (
        id, legal_name, trading_name, official_website, domain, primary_country, primary_city,
        primary_industry, business_type, business_description, nkb_service_fit,
        verification_status, confidence_level, source_attribution
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        companyId,
        legalName.trim(),
        tradingName ? tradingName.trim() : legalName.trim(),
        officialWebsite || null,
        domain,
        primaryCountry,
        primaryCity || null,
        primaryIndustry,
        businessType || 'Brand Owner',
        businessDescription || null,
        nkbServiceFit || 'Cosmetics OEM/ODM',
        'unverified',
        officialWebsite ? 'high' : 'medium',
        sourceAttribution.trim()
      ]
    );

    // Initial score
    await calculateLeadScore(companyId);

    // Opportunity
    await execute(
      'INSERT INTO opportunities (id, company_id, title, pipeline_stage, service_category) VALUES ($1, $2, $3, $4, $5)',
      [uuidv4(), companyId, `Manufacturing Partnership: ${legalName.trim()}`, 'new_prospect', nkbServiceFit || 'Cosmetics OEM/ODM']
    );

    await logAudit({
      userId: req.user.id,
      action: 'COMPANY_MANUAL_ENTRY',
      entityType: 'company',
      entityId: companyId,
      details: { legalName, country: primaryCountry, sourceAttribution }
    });

    const created = await getOne('SELECT * FROM companies WHERE id = $1', [companyId]);
    res.status(201).json(created);
  } catch (err) {
    console.error('[Company Create Error]', err);
    res.status(500).json({ error: 'Failed to create company record.' });
  }
});

// Live inspect website for WhatsApp, social channels & verified contact metadata
router.post('/:id/inspect-channels', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const company = await getOne('SELECT * FROM companies WHERE id = $1', [id]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const targetUrl = req.body.website || company.official_website;
    if (!targetUrl) {
      return res.status(400).json({ error: 'No official website available to inspect.' });
    }

    const inspection = await webInspector.inspectDomain(targetUrl);
    if (!inspection.isLive) {
      return res.status(422).json({
        error: `Could not reach website: ${inspection.error || 'Host unreachable'}`,
        inspection
      });
    }

    // Update channels
    await execute(
      `UPDATE companies
       SET whatsapp_number = COALESCE($1, whatsapp_number),
           whatsapp_url = COALESCE($2, whatsapp_url),
           instagram_url = COALESCE($3, instagram_url),
           facebook_url = COALESCE($4, facebook_url),
           linkedin_url = COALESCE($5, linkedin_url),
           tiktok_url = COALESCE($6, tiktok_url),
           youtube_url = COALESCE($7, youtube_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        inspection.whatsappNumber || null,
        inspection.whatsappUrl || null,
        inspection.instagramUrl || null,
        inspection.facebookUrl || null,
        inspection.linkedinUrl || null,
        inspection.tiktokUrl || null,
        inspection.youtubeUrl || null,
        id
      ]
    );

    // If emails were discovered, add general contact if no contact exists yet
    if (inspection.publicEmails && inspection.publicEmails.length > 0) {
      const email = inspection.publicEmails[0];
      const existing = await getOne(
        'SELECT id FROM business_contacts WHERE company_id = $1 AND LOWER(business_email) = LOWER($2)',
        [id, email]
      );
      if (!existing) {
        await execute(
          `INSERT INTO business_contacts (
            id, company_id, full_name, job_title, department, business_email,
            phone_number, whatsapp_number, whatsapp_url, contact_status, evidence_source, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            uuidv4(),
            id,
            'General Inquiries / Sales Sourcing',
            'Sourcing & Procurement Inquiries',
            'Procurement',
            email,
            inspection.phoneNumber || null,
            inspection.whatsappNumber || null,
            inspection.whatsappUrl || null,
            'publicly_listed',
            `Public Website Inspection: ${targetUrl}`,
            `Extracted directly from public website on ${new Date().toLocaleDateString()}`
          ]
        );
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'WEBSITE_CHANNELS_INSPECTED',
      entityType: 'company',
      entityId: id,
      details: {
        website: targetUrl,
        whatsappFound: !!inspection.whatsappUrl,
        socialsFound: {
          instagram: !!inspection.instagramUrl,
          facebook: !!inspection.facebookUrl,
          linkedin: !!inspection.linkedinUrl,
          tiktok: !!inspection.tiktokUrl,
          youtube: !!inspection.youtubeUrl
        }
      }
    });

    const updated = await getOne('SELECT * FROM companies WHERE id = $1', [id]);
    res.json({
      success: true,
      company: updated,
      inspection
    });
  } catch (err) {
    console.error('[Inspect Channels Error]', err);
    res.status(500).json({ error: 'Failed to inspect website channels.' });
  }
});

export default router;
