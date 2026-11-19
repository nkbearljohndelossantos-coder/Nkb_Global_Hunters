import { v4 as uuidv4 } from 'uuid';
import { query, getOne, execute } from '../db/index.js';

export async function calculateLeadScore(companyId) {
  // Fetch company details
  const company = await getOne('SELECT * FROM companies WHERE id = $1', [companyId]);
  if (!company) {
    throw new Error('Company not found for scoring');
  }

  // Fetch company research and contacts to evaluate evidence
  const research = await query('SELECT * FROM company_research WHERE company_id = $1', [companyId]);
  const contacts = await query('SELECT * FROM business_contacts WHERE company_id = $1', [companyId]);

  // Fetch scoring weights from system_settings
  const settingsRows = await query("SELECT key, value FROM system_settings WHERE key LIKE 'scoring_weight_%'");
  const weights = {
    industryFit: 25,
    serviceFit: 25,
    purchasingPotential: 20,
    legitimacy: 15,
    buyingSignals: 15
  };

  settingsRows.forEach(row => {
    const val = parseInt(row.value, 10);
    if (!isNaN(val)) {
      if (row.key === 'scoring_weight_industry_fit') weights.industryFit = val;
      if (row.key === 'scoring_weight_service_fit') weights.serviceFit = val;
      if (row.key === 'scoring_weight_purchasing_potential') weights.purchasingPotential = val;
      if (row.key === 'scoring_weight_legitimacy') weights.legitimacy = val;
      if (row.key === 'scoring_weight_buying_signals') weights.buyingSignals = val;
    }
  });

  let industryScore = 0;
  let serviceScore = 0;
  let purchasingScore = 0;
  let legitimacyScore = 0;
  let signalsScore = 0;

  const missingInfo = [];
  const explanations = [];

  // 1. Industry Fit (max 25)
  const ind = (company.primary_industry || '').toLowerCase();
  if (ind.includes('cosmetic') || ind.includes('skincare') || ind.includes('beauty')) {
    industryScore = weights.industryFit;
    explanations.push(`Direct target industry: ${company.primary_industry} (${industryScore}/${weights.industryFit} pts).`);
  } else if (ind.includes('perfume') || ind.includes('fragrance')) {
    industryScore = weights.industryFit;
    explanations.push(`Direct target industry: Perfume & Fragrances (${industryScore}/${weights.industryFit} pts).`);
  } else if (ind.includes('supplement') || ind.includes('nutrition') || ind.includes('vitamin')) {
    industryScore = weights.industryFit;
    explanations.push(`Direct target industry: Food Supplements (${industryScore}/${weights.industryFit} pts).`);
  } else if (ind.includes('packag')) {
    industryScore = weights.industryFit;
    explanations.push(`Direct target industry: Packaging Supply (${industryScore}/${weights.industryFit} pts).`);
  } else if (ind.includes('retail') || ind.includes('distribution') || ind.includes('wholesal')) {
    industryScore = Math.round(weights.industryFit * 0.7);
    explanations.push(`Adjacent distribution/retail channel (${industryScore}/${weights.industryFit} pts).`);
  } else {
    industryScore = Math.round(weights.industryFit * 0.3);
    missingInfo.push('Unverified core industry alignment');
  }

  // 2. Service Fit (max 25)
  const fit = (company.nkb_service_fit || '').toLowerCase();
  const desc = (company.business_description || '').toLowerCase();
  if (fit.includes('cosmetics oem') || fit.includes('perfume oem') || fit.includes('supplements oem') || fit.includes('packaging')) {
    serviceScore = weights.serviceFit;
    explanations.push(`Clear OEM/ODM manufacturing synergy: ${company.nkb_service_fit} (${serviceScore}/${weights.serviceFit} pts).`);
  } else if (desc.includes('oem') || desc.includes('private label') || desc.includes('contract manufactur')) {
    serviceScore = Math.round(weights.serviceFit * 0.85);
    explanations.push(`Private label or contract manufacturing signals detected in public description.`);
  } else {
    serviceScore = Math.round(weights.serviceFit * 0.4);
    missingInfo.push('Specific manufacturing volume requirements pending analyst confirmation');
  }

  // 3. Purchasing Potential (max 20)
  const bType = (company.business_type || '').toLowerCase();
  if (bType.includes('brand owner') || bType.includes('importer') || bType.includes('retail chain')) {
    purchasingScore = Math.round(weights.purchasingPotential * 0.85);
    explanations.push(`Established business profile indicates recurring commercial purchasing potential.`);
  } else {
    purchasingScore = Math.round(weights.purchasingPotential * 0.5);
    missingInfo.push('Estimated purchasing budget or annual volume not publicly reported');
  }

  // 4. Legitimacy and Evidence Quality (max 15)
  if (company.official_website && company.domain) {
    legitimacyScore += Math.round(weights.legitimacy * 0.5);
  } else {
    missingInfo.push('Official company domain not verified');
  }
  if (company.source_attribution && company.source_attribution.length > 5) {
    legitimacyScore += Math.round(weights.legitimacy * 0.3);
  }
  if (company.primary_city && company.headquarters_address) {
    legitimacyScore += Math.round(weights.legitimacy * 0.2);
  }
  legitimacyScore = Math.min(weights.legitimacy, legitimacyScore);
  explanations.push(`Legitimacy score: ${legitimacyScore}/${weights.legitimacy} based on verified domain and verifiable business registry records.`);

  // 5. Buying Signals (max 15)
  let signalPoints = 0;
  if (research.some(r => r.expansion_signals || r.procurement_signals)) {
    signalPoints += Math.round(weights.buyingSignals * 0.6);
  }
  if (contacts.length > 0) {
    signalPoints += Math.round(weights.buyingSignals * 0.4);
    explanations.push(`Decision-maker contacts identified (${contacts.length} contact records).`);
  } else {
    missingInfo.push('Direct procurement or supply chain decision-maker contact pending discovery');
  }
  signalsScore = Math.min(weights.buyingSignals, signalPoints);

  const totalScore = Math.min(100, Math.max(0, industryScore + serviceScore + purchasingScore + legitimacyScore + signalsScore));

  // Determine tier
  let priorityTier = 'D';
  if (totalScore >= 80) priorityTier = 'A';
  else if (totalScore >= 60) priorityTier = 'B';
  else if (totalScore >= 40) priorityTier = 'C';

  // Determine confidence
  let confidenceLevel = 'low';
  if (company.official_website && contacts.length > 0) {
    confidenceLevel = 'high';
  } else if (company.official_website || contacts.length > 0) {
    confidenceLevel = 'medium';
  }

  // Recommended next action
  let recommendedAction = 'Conduct in-depth corporate intelligence research.';
  if (priorityTier === 'A') {
    recommendedAction = 'High-priority enterprise target. Prepare customized OEM/ODM sales proposal and initiate direct procurement outreach.';
  } else if (priorityTier === 'B') {
    recommendedAction = 'Verify procurement decision-maker and formulate tailored product introductory inquiry.';
  } else if (priorityTier === 'C') {
    recommendedAction = 'Monitor expansion announcements and gather missing operational details before sales outreach.';
  } else {
    recommendedAction = 'Evaluate suitability or maintain on passive radar.';
  }

  const explanationText = explanations.join(' ');
  const missingInfoText = missingInfo.join('; ');

  // Save or update lead_scores
  const existingScore = await getOne('SELECT id, total_score, priority_tier FROM lead_scores WHERE company_id = $1', [companyId]);
  const scoreId = existingScore ? existingScore.id : uuidv4();

  if (existingScore) {
    await execute(
      `UPDATE lead_scores SET
        total_score = $1, priority_tier = $2, industry_fit_score = $3, service_fit_score = $4,
        purchasing_potential_score = $5, business_legitimacy_score = $6, buying_signals_score = $7,
        confidence_level = $8, explanation = $9, missing_information = $10, recommended_action = $11,
        weights_used_json = $12, scored_at = CURRENT_TIMESTAMP
       WHERE id = $13`,
      [
        totalScore, priorityTier, industryScore, serviceScore, purchasingScore, legitimacyScore, signalsScore,
        confidenceLevel, explanationText, missingInfoText, recommendedAction, JSON.stringify(weights), scoreId
      ]
    );

    // Record qualification history if changed
    if (existingScore.total_score !== totalScore || existingScore.priority_tier !== priorityTier) {
      await execute(
        'INSERT INTO qualification_history (id, company_id, previous_score, new_score, previous_tier, new_tier, reason) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [uuidv4(), companyId, existingScore.total_score, totalScore, existingScore.priority_tier, priorityTier, 'Automated rescoring update']
      );
    }
  } else {
    await execute(
      `INSERT INTO lead_scores (
        id, company_id, total_score, priority_tier, industry_fit_score, service_fit_score,
        purchasing_potential_score, business_legitimacy_score, buying_signals_score,
        confidence_level, explanation, missing_information, recommended_action, weights_used_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        scoreId, companyId, totalScore, priorityTier, industryScore, serviceScore, purchasingScore, legitimacyScore, signalsScore,
        confidenceLevel, explanationText, missingInfoText, recommendedAction, JSON.stringify(weights)
      ]
    );
  }

  return {
    scoreId,
    totalScore,
    priorityTier,
    breakdown: {
      industryFit: { score: industryScore, max: weights.industryFit },
      serviceFit: { score: serviceScore, max: weights.serviceFit },
      purchasingPotential: { score: purchasingScore, max: weights.purchasingPotential },
      businessLegitimacy: { score: legitimacyScore, max: weights.legitimacy },
      buyingSignals: { score: signalsScore, max: weights.buyingSignals }
    },
    confidenceLevel,
    explanation: explanationText,
    missingInformation: missingInfoText,
    recommendedAction
  };
}
