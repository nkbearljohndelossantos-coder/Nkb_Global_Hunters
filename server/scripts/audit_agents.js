import { initDatabase, query, getOne } from '../src/db/index.js';
import { aiAgentEngine } from '../src/services/aiAgentEngine.js';

async function auditAgents() {
  console.log('=== AI AGENTS AUDIT START ===');
  await initDatabase();

  const realCompany = await getOne("SELECT * FROM companies WHERE legal_name = 'Armani' OR legal_name = 'Amcor' LIMIT 1");
  console.log(`Executing 7 Agents using Genuine Entity: "${realCompany.legal_name}" (Country: ${realCompany.primary_country}, Industry: ${realCompany.primary_industry})`);

  // 1. Global Research Agent
  console.log('\n[1/7] Testing Global Research Agent...');
  const t1 = Date.now();
  const res1 = await aiAgentEngine.runGlobalResearchAgent({ companyId: realCompany.id });
  console.log(`  Duration: ${Date.now() - t1}ms`);
  console.log(`  Inspected Asset: ${res1.websiteInspected}`);
  console.log(`  Live Status: ${res1.liveStatus}`);
  console.log(`  Extracted Capabilities:`, res1.detectedCapabilities);

  // 2. Company Intelligence Agent
  console.log('\n[2/7] Testing Company Intelligence Agent...');
  const t2 = Date.now();
  const res2 = await aiAgentEngine.runCompanyIntelligenceAgent({ companyId: realCompany.id });
  console.log(`  Duration: ${Date.now() - t2}ms`);
  console.log(`  Strategic Profile: ${res2.strategicProfile}`);
  console.log(`  Manufacturing Synergy: ${res2.manufacturingSynergy?.[0]}`);

  // 3. Lead Qualification Agent
  console.log('\n[3/7] Testing Lead Qualification Agent...');
  const t3 = Date.now();
  const res3 = await aiAgentEngine.runLeadQualificationAgent({ companyId: realCompany.id });
  console.log(`  Duration: ${Date.now() - t3}ms`);
  console.log(`  Calculated Score: ${res3.totalScore}/100 (Tier ${res3.priorityTier})`);
  console.log(`  Confidence Level: ${res3.confidenceLevel}`);
  console.log(`  Missing Info Flagged: ${res3.missingInformation || 'None'}`);

  // 4. Market Opportunity Agent
  console.log('\n[4/7] Testing Market Opportunity Agent...');
  const t4 = Date.now();
  const res4 = await aiAgentEngine.runMarketOpportunityAgent({ country: realCompany.primary_country, industry: realCompany.primary_industry });
  console.log(`  Duration: ${Date.now() - t4}ms`);
  console.log(`  Title: ${res4.title}`);
  console.log(`  Summary: ${res4.summary.slice(0, 120)}...`);

  // 5. Contact Research Agent
  console.log('\n[5/7] Testing Contact Research Agent...');
  const t5 = Date.now();
  const res5 = await aiAgentEngine.runContactResearchAgent({ companyId: realCompany.id });
  console.log(`  Duration: ${Date.now() - t5}ms`);
  console.log(`  Verified Contacts: ${res5.verifiedContactsCount}`);
  console.log(`  Recommended Channels: ${res5.recommendedChannels.join(', ')}`);

  // 6. Sales Proposal Agent
  console.log('\n[6/7] Testing Sales Proposal Agent...');
  const t6 = Date.now();
  const res6 = await aiAgentEngine.runSalesProposalAgent({ companyId: realCompany.id, serviceType: realCompany.nkb_service_fit });
  console.log(`  Duration: ${Date.now() - t6}ms`);
  console.log(`  Generated Title: ${res6.title}`);
  console.log(`  NKB Capabilities: ${res6.manufacturingCapabilities.slice(0, 100)}...`);

  // 7. Follow-up Recommendation Agent
  console.log('\n[7/7] Testing Follow-up Recommendation Agent...');
  const t7 = Date.now();
  const res7 = await aiAgentEngine.runFollowUpRecommendationAgent({ companyId: realCompany.id });
  console.log(`  Duration: ${Date.now() - t7}ms`);
  console.log(`  Action: ${res7.recommendedFollowUpAction}`);
  console.log(`  Subject: ${res7.suggestedEmailSubject}`);
  console.log(`  Cadence: ${res7.suggestedCadenceDays} business days`);

  // Verify Execution Logs in database
  const executionLogs = await query("SELECT agent_name, status, model_used, execution_duration_ms, cost_incurred FROM agent_execution_logs ORDER BY created_at DESC LIMIT 7");
  console.log(`\nVerified Execution Logs in Database (Last 7 entries):`);
  executionLogs.forEach((log, idx) => {
    console.log(`  ${idx + 1}. ${log.agent_name} -> Status: ${log.status}, Engine: ${log.model_used}, Cost: $${log.cost_incurred}`);
  });

  console.log('=== AI AGENTS AUDIT END ===');
  process.exit(0);
}

auditAgents().catch(console.error);
