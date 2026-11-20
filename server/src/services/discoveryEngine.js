import { v4 as uuidv4 } from 'uuid';
import { query, getOne, execute } from '../db/index.js';
import { WikidataConnector } from './connectors/wikidataConnector.js';
import { WebInspectorConnector } from './connectors/webInspectorConnector.js';
import { CustomApiConnector } from './connectors/customApiConnector.js';
import { calculateLeadScore } from './scoringEngine.js';
import { logAudit } from './auditService.js';

export class DiscoveryEngine {
  constructor() {
    this.wikidataConnector = new WikidataConnector();
    this.webInspectorConnector = new WebInspectorConnector();
    this.customApiConnector = new CustomApiConnector();
  }

  async runDiscovery({ country, industry, keyword, limit = 20, userId }) {
    console.log(`[Discovery Engine] Initiating live discovery: country=${country || 'All'}, industry=${industry || 'All'}, keyword=${keyword || ''}`);
    const discovered = [];
    const duplicates = [];

    // 1. Query Wikidata SPARQL Knowledge Graph
    try {
      const wikidataResults = await this.wikidataConnector.search({ country, industry, keyword, limit });
      for (const item of wikidataResults) {
        const result = await this.persistCompanyIfUnique(item, userId);
        if (result.isNew) {
          discovered.push(result.company);
        } else {
          duplicates.push(result.company);
        }
      }
    } catch (err) {
      console.error('[Discovery Engine] Wikidata query error:', err.message);
    }

    // 2. Query configured custom API if active
    try {
      const customResults = await this.customApiConnector.search({ country, industry, keyword, limit });
      for (const item of customResults) {
        const result = await this.persistCompanyIfUnique(item, userId);
        if (result.isNew) {
          discovered.push(result.company);
        } else {
          duplicates.push(result.company);
        }
      }
    } catch (err) {
      console.warn('[Discovery Engine] Custom API query skipped:', err.message);
    }

    if (userId) {
      await logAudit({
        userId,
        action: 'COMPANY_DISCOVERY_RUN',
        entityType: 'discovery',
        details: {
          country,
          industry,
          keyword,
          newlyDiscoveredCount: discovered.length,
          duplicatesCount: duplicates.length
        }
      });
    }

    return {
      totalFound: discovered.length + duplicates.length,
      newlyDiscovered: discovered.length,
      duplicatesDetected: duplicates.length,
      companies: [...discovered, ...duplicates]
    };
  }

  async persistCompanyIfUnique(item, userId) {
    // Duplicate detection rules:
    // 1. Exact or cleaned domain match
    // 2. Case-insensitive legal name match
    let existing = null;
    if (item.domain) {
      existing = await getOne('SELECT id, legal_name, official_website, primary_country FROM companies WHERE domain = $1', [item.domain.toLowerCase()]);
    }
    if (!existing && item.legalName) {
      existing = await getOne('SELECT id, legal_name, official_website, primary_country FROM companies WHERE LOWER(legal_name) = $1', [item.legalName.trim().toLowerCase()]);
    }

    if (existing) {
      // Update last research date and enrich any newly available WhatsApp / social channels
      await execute(
        `UPDATE companies 
         SET last_researched_at = CURRENT_TIMESTAMP,
             whatsapp_number = COALESCE($1, whatsapp_number),
             whatsapp_url = COALESCE($2, whatsapp_url),
             instagram_url = COALESCE($3, instagram_url),
             facebook_url = COALESCE($4, facebook_url),
             linkedin_url = COALESCE($5, linkedin_url),
             tiktok_url = COALESCE($6, tiktok_url),
             youtube_url = COALESCE($7, youtube_url)
         WHERE id = $8`,
        [
          item.whatsappNumber || null,
          item.whatsappUrl || null,
          item.instagramUrl || null,
          item.facebookUrl || null,
          item.linkedinUrl || null,
          item.tiktokUrl || null,
          item.youtubeUrl || null,
          existing.id
        ]
      );
      const updated = await getOne('SELECT * FROM companies WHERE id = $1', [existing.id]);
      return { isNew: false, company: updated || existing };
    }

    // Insert new verified record
    const companyId = uuidv4();
    const cleanDomain = item.domain ? item.domain.toLowerCase() : null;

    await execute(
      `INSERT INTO companies (
        id, legal_name, trading_name, official_website, domain, primary_country, primary_city,
        headquarters_address, primary_industry, business_type, business_description, products_summary,
        nkb_service_fit, verification_status, confidence_level, source_attribution,
        whatsapp_number, whatsapp_url, instagram_url, facebook_url, linkedin_url, tiktok_url, youtube_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [
        companyId,
        item.legalName.trim(),
        item.tradingName ? item.tradingName.trim() : item.legalName.trim(),
        item.officialWebsite || null,
        cleanDomain,
        item.primaryCountry || 'International',
        item.primaryCity || null,
        item.headquartersAddress || null,
        item.primaryIndustry || 'Cosmetics',
        item.businessType || 'Brand Owner',
        item.businessDescription || null,
        item.productsSummary || null,
        item.nkbServiceFit || 'Cosmetics OEM/ODM',
        'unverified',
        item.confidenceLevel || 'medium',
        item.sourceAttribution,
        item.whatsappNumber || null,
        item.whatsappUrl || null,
        item.instagramUrl || null,
        item.facebookUrl || null,
        item.linkedinUrl || null,
        item.tiktokUrl || null,
        item.youtubeUrl || null
      ]
    );

    // Record source traceability
    const sourceRecordId = uuidv4();
    await execute(
      'INSERT INTO company_sources (id, company_id, source_code, source_name, source_url) VALUES ($1, $2, $3, $4, $5)',
      [sourceRecordId, companyId, 'wikidata', item.sourceAttribution, item.rawSourceUrl || null]
    );

    // Automatically create initial CRM opportunity in 'new_prospect' stage
    const opportunityId = uuidv4();
    await execute(
      `INSERT INTO opportunities (
        id, company_id, title, pipeline_stage, service_category, win_probability
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        opportunityId,
        companyId,
        `OEM/ODM Partnership Opportunity: ${item.legalName.trim()}`,
        'new_prospect',
        item.nkbServiceFit || 'Cosmetics OEM/ODM',
        10
      ]
    );

    // Run qualification scoring engine
    try {
      await calculateLeadScore(companyId);
    } catch (e) {
      console.warn(`[Discovery Engine] Scoring error for ${companyId}: ${e.message}`);
    }

    const createdCompany = await getOne('SELECT * FROM companies WHERE id = $1', [companyId]);
    return { isNew: true, company: createdCompany };
  }
}
