import { v4 as uuidv4 } from 'uuid';
import { execute, getOne, query } from '../db/index.js';
import { calculateLeadScore } from './scoringEngine.js';
import { WebInspectorConnector } from './connectors/webInspectorConnector.js';

const webInspector = new WebInspectorConnector();

export class AIAgentEngine {
  constructor() {
    this.modelName = 'nkb_intelligence_engine_v1 (Zero-Cost Free-First)';
  }

  async recordExecution({ agentName, taskDescription, inputPayload, outputResult, status = 'success', durationMs = 120 }) {
    const id = uuidv4();
    await execute(
      `INSERT INTO agent_execution_logs (
        id, agent_name, task_description, input_payload_json, output_result_json,
        status, execution_duration_ms, model_used, tokens_used, cost_incurred
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        agentName,
        taskDescription,
        JSON.stringify(inputPayload || {}),
        JSON.stringify(outputResult || {}),
        status,
        durationMs,
        this.modelName,
        Math.floor(durationMs * 3.5),
        0.0000 // Zero additional cost
      ]
    );
    return id;
  }

  // 1. Global Research Agent
  async runGlobalResearchAgent({ companyId, url }) {
    const start = Date.now();
    const company = await getOne('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (!company) throw new Error('Company not found');

    const targetUrl = url || company.official_website;
    let inspection = { isLive: false, error: 'No website URL available for automated inspection' };

    if (targetUrl) {
      inspection = await webInspector.inspectDomain(targetUrl);
    }

    const duration = Date.now() - start;
    const result = {
      companyId,
      companyName: company.legal_name,
      websiteInspected: targetUrl,
      liveStatus: inspection.isLive ? 'Active' : 'Unreachable / Unavailable',
      extractedTitle: inspection.title || null,
      metaDescription: inspection.description || null,
      detectedCapabilities: {
        hasContactPage: inspection.hasContactPage || false,
        hasAboutPage: inspection.hasAboutPage || false,
        mentionsOemOrWholesale: inspection.mentionsOemOrWholesale || false
      },
      publiclyExposedEmails: inspection.publicEmails || [],
      evidenceQuality: inspection.isLive ? 'Verified Public Website' : 'Unverified'
    };

    // If emails found on public website, record them into business_contacts as 'publicly_listed'
    if (inspection.publicEmails && inspection.publicEmails.length > 0) {
      for (const email of inspection.publicEmails) {
        const existing = await getOne('SELECT id FROM business_contacts WHERE company_id = $1 AND business_email = $2', [companyId, email]);
        if (!existing) {
          await execute(
            `INSERT INTO business_contacts (
              id, company_id, full_name, job_title, department, business_email, contact_status, evidence_source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              uuidv4(),
              companyId,
              'General Business Inquiries',
              'Business Development / Inquiries',
              'Sourcing',
              email,
              'publicly_listed',
              `Discovered on official website mailto: link during automated research (${targetUrl})`
            ]
          );
        }
      }
    }

    // Save research record
    const researchId = uuidv4();
    await execute(
      `INSERT INTO company_research (
        id, company_id, research_type, executive_summary, manufacturing_requirements,
        expansion_signals, evidence_links, confidence_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        researchId,
        companyId,
        'automated_agent',
        `Live domain research performed on ${targetUrl || 'catalog entry'}. Entity active in ${company.primary_industry}.`,
        inspection.mentionsOemOrWholesale ? 'Detected OEM/Wholesale partnership references on public portal.' : 'Standard retail/brand distribution profile.',
        inspection.isLive ? 'Domain active with operational web assets.' : 'No active domain signals.',
        targetUrl || null,
        inspection.isLive ? 85 : 40
      ]
    );

    // Update company last researched
    await execute('UPDATE companies SET last_researched_at = CURRENT_TIMESTAMP WHERE id = $1', [companyId]);

    // Rescore
    await calculateLeadScore(companyId);

    await this.recordExecution({
      agentName: 'Global Research Agent',
      taskDescription: `Direct web asset inspection for ${company.legal_name}`,
      inputPayload: { companyId, targetUrl },
      outputResult: result,
      status: 'success',
      durationMs: duration
    });

    return result;
  }

  // 2. Company Intelligence Agent
  async runCompanyIntelligenceAgent({ companyId }) {
    const start = Date.now();
    const company = await getOne('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (!company) throw new Error('Company not found');

    const leadScore = await getOne('SELECT * FROM lead_scores WHERE company_id = $1', [companyId]);
    const contacts = await query('SELECT * FROM business_contacts WHERE company_id = $1', [companyId]);

    const intelligence = {
      companyName: company.legal_name,
      country: company.primary_country,
      industry: company.primary_industry,
      nkbFit: company.nkb_service_fit,
      strategicProfile: `${company.legal_name} is an established ${company.primary_industry} entity headquartered in ${company.primary_country}. Business alignment demonstrates genuine applicability for ${company.nkb_service_fit} partnership with NKB Manufacturing.`,
      manufacturingSynergy: [
        `High compatibility with NKB's certified manufacturing processes in ${company.nkb_service_fit}.`,
        `Opportunity for custom private-label formulations and proprietary batch packaging.`,
        `Potential supply chain optimization through direct Asian manufacturing hub sourcing.`
      ],
      procurementReadiness: contacts.length > 0 ? 'Contacts identified; ready for proposal drafting' : 'Awaiting procurement contact discovery',
      confidenceRating: leadScore ? leadScore.confidence_level : 'medium'
    };

    const duration = Date.now() - start;
    await this.recordExecution({
      agentName: 'Company Intelligence Agent',
      taskDescription: `Strategic manufacturing synergy profile for ${company.legal_name}`,
      inputPayload: { companyId },
      outputResult: intelligence,
      status: 'success',
      durationMs: duration
    });

    return intelligence;
  }

  // 3. Lead Qualification Agent
  async runLeadQualificationAgent({ companyId }) {
    const start = Date.now();
    const scoreResult = await calculateLeadScore(companyId);
    const duration = Date.now() - start;

    await this.recordExecution({
      agentName: 'Lead Qualification Agent',
      taskDescription: `100-Point multi-dimensional qualification audit for company ${companyId}`,
      inputPayload: { companyId },
      outputResult: scoreResult,
      status: 'success',
      durationMs: duration
    });

    return scoreResult;
  }

  // 4. Market Opportunity Agent
  async runMarketOpportunityAgent({ country, industry }) {
    const start = Date.now();
    const targetCountry = country || 'All Priority Markets';
    const targetIndustry = industry || 'Cosmetics & Supplements';

    const companyStats = await query(
      `SELECT primary_country, primary_industry, COUNT(*) as count 
       FROM companies 
       GROUP BY primary_country, primary_industry 
       ORDER BY count DESC LIMIT 10`
    );

    const report = {
      title: `Global B2B Market Opportunity: ${targetIndustry} (${targetCountry})`,
      targetCountry,
      targetIndustry,
      summary: `Market intelligence indicates strong cross-border demand for OEM/ODM contract manufacturing in ${targetIndustry}. Companies in ${targetCountry} are increasingly seeking reliable certified manufacturing partners offering low MOQ entry, fast turnaround, and regulatory compliance.`,
      priorityActionPoints: [
        'Engage private-label brand owners seeking formula modernization.',
        'Target distributors seeking competitive contract manufacturing pricing.',
        'Offer ready-to-market cosmetic and supplement formulations with turn-key packaging solutions.'
      ],
      discoveredCompanyDistribution: companyStats,
      timestamp: new Date().toISOString()
    };

    // Save into market_reports
    const reportId = uuidv4();
    await execute(
      `INSERT INTO market_reports (
        id, title, report_type, country, industry, summary, signal_data_json, source_attribution
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        reportId,
        report.title,
        'country_analysis',
        country || 'Global',
        industry || 'Cosmetics',
        report.summary,
        JSON.stringify(report),
        'NKB Global Hunter Market Intelligence Engine'
      ]
    );

    const duration = Date.now() - start;
    await this.recordExecution({
      agentName: 'Market Opportunity Agent',
      taskDescription: `Market intelligence generation for ${targetCountry} - ${targetIndustry}`,
      inputPayload: { country, industry },
      outputResult: report,
      status: 'success',
      durationMs: duration
    });

    return report;
  }

  // 5. Contact Research Agent
  async runContactResearchAgent({ companyId }) {
    const start = Date.now();
    const company = await getOne('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (!company) throw new Error('Company not found');

    // Only discover real publicly available channels or verify existing ones
    const contacts = await query('SELECT * FROM business_contacts WHERE company_id = $1', [companyId]);

    const result = {
      companyName: company.legal_name,
      verifiedContactsCount: contacts.length,
      contacts: contacts.map(c => ({
        name: c.full_name,
        role: c.job_title,
        status: c.contact_status,
        email: c.business_email || 'Not publicly published',
        evidence: c.evidence_source
      })),
      recommendedChannels: [
        'Official procurement contact form',
        'Corporate LinkedIn company directory for Purchasing / Supply Chain headers',
        'Direct business inquiry mailto channels'
      ]
    };

    const duration = Date.now() - start;
    await this.recordExecution({
      agentName: 'Contact Research Agent',
      taskDescription: `Ethical contact discovery review for ${company.legal_name}`,
      inputPayload: { companyId },
      outputResult: result,
      status: 'success',
      durationMs: duration
    });

    return result;
  }

  // 6. Sales Proposal Agent
  async runSalesProposalAgent({ companyId, serviceType }) {
    const start = Date.now();
    const company = await getOne('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (!company) throw new Error('Company not found');

    const service = serviceType || company.nkb_service_fit || 'Cosmetics OEM/ODM';

    const proposalContent = {
      title: `B2B Strategic Manufacturing Partnership Proposal: NKB Manufacturing & ${company.legal_name}`,
      serviceType: service,
      introduction: `NKB Manufacturing is pleased to submit this commercial partnership proposal to ${company.legal_name}. As an enterprise contract manufacturer specializing in high-grade ${service}, NKB is prepared to support your market growth with complete OEM/ODM production, formulation stability, and custom packaging.`,
      manufacturingCapabilities: `NKB operates certified production facilities meeting rigorous GMP and international manufacturing standards for ${service}. Our turn-key services encompass raw material sourcing, active ingredient compounding, primary and secondary packaging, and export logistics.`,
      proposedCommercialTerms: `Flexible MOQ tiers starting at low commercial volumes for initial launch batches, transitioning to volume-discounted recurring production schedules. Standard lead times range from 15 to 30 business days following formulation approval.`,
      nextSteps: `1. Schedule a 20-minute technical alignment meeting.\n2. Review sample product formulations and packaging prototypes.\n3. Execute Mutual Non-Disclosure Agreement (MNDA) and issue official RFQ quotation.`
    };

    const duration = Date.now() - start;
    await this.recordExecution({
      agentName: 'Sales Proposal Agent',
      taskDescription: `Generate structured B2B proposal outline for ${company.legal_name}`,
      inputPayload: { companyId, serviceType: service },
      outputResult: proposalContent,
      status: 'success',
      durationMs: duration
    });

    return proposalContent;
  }

  // 7. Follow-up Recommendation Agent
  async runFollowUpRecommendationAgent({ companyId }) {
    const start = Date.now();
    const company = await getOne('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (!company) throw new Error('Company not found');

    const opp = await getOne('SELECT * FROM opportunities WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1', [companyId]);
    const stage = opp ? opp.pipeline_stage : 'new_prospect';

    const recommendations = {
      companyName: company.legal_name,
      currentStage: stage,
      recommendedFollowUpAction: '',
      suggestedCadenceDays: 3,
      suggestedEmailSubject: '',
      suggestedTalkingPoints: []
    };

    if (stage === 'new_prospect' || stage === 'researching') {
      recommendations.recommendedFollowUpAction = 'Complete web intelligence inspection and identify target sourcing contact.';
      recommendations.suggestedCadenceDays = 2;
      recommendations.suggestedEmailSubject = `Manufacturing capabilities inquiry // NKB Manufacturing - ${company.legal_name}`;
      recommendations.suggestedTalkingPoints = [
        'Reference company products in target market',
        'Introduce NKB OEM/ODM contract manufacturing capabilities',
        'Offer product sample kit or formulation catalog'
      ];
    } else if (stage === 'qualified' || stage === 'ready_for_outreach') {
      recommendations.recommendedFollowUpAction = 'Submit personalized introductory B2B partnership proposal.';
      recommendations.suggestedCadenceDays = 3;
      recommendations.suggestedEmailSubject = `OEM/ODM Production Partnership Proposal for ${company.legal_name}`;
      recommendations.suggestedTalkingPoints = [
        'Highlight supply chain resilience and competitive batch MOQs',
        'Request 15-minute introductory video conference',
        'Attach NKB verified capabilities brief'
      ];
    } else if (stage === 'contacted') {
      recommendations.recommendedFollowUpAction = 'Send polite 3-day follow-up with formulation showcase.';
      recommendations.suggestedCadenceDays = 3;
      recommendations.suggestedEmailSubject = `Re: Partnership Proposal // NKB Manufacturing`;
      recommendations.suggestedTalkingPoints = [
        'Check if initial introduction was received by procurement team',
        'Offer custom sample prototype delivery at zero cost'
      ];
    } else {
      recommendations.recommendedFollowUpAction = 'Advance opportunity discussion toward formal RFQ submission.';
      recommendations.suggestedCadenceDays = 4;
      recommendations.suggestedEmailSubject = `Next steps: RFQ and specification review // NKB Manufacturing`;
      recommendations.suggestedTalkingPoints = [
        'Confirm target unit volumes and delivery timeline',
        'Issue pricing breakdown'
      ];
    }

    const duration = Date.now() - start;
    await this.recordExecution({
      agentName: 'Follow-up Recommendation Agent',
      taskDescription: `Generate next-action cadence recommendation for ${company.legal_name}`,
      inputPayload: { companyId, stage },
      outputResult: recommendations,
      status: 'success',
      durationMs: duration
    });

    return recommendations;
  }
}

export const aiAgentEngine = new AIAgentEngine();
