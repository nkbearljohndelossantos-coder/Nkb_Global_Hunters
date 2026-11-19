-- =============================================================================
-- NKB GLOBAL HUNTER - PRODUCTION SCHEMA MIGRATION 001
-- Target: PostgreSQL 14+ / Compatible Relational Engines
-- =============================================================================

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  module VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(64) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR(64) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 2. USERS & SESSIONS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role_id VARCHAR(64) NOT NULL REFERENCES roles(id),
  is_active INTEGER DEFAULT 1,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. RESEARCH SOURCES & SOURCE CONNECTORS
CREATE TABLE IF NOT EXISTS research_sources (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'public_directory', 'registry', 'wikidata', 'search_engine', 'association', 'manual'
  is_active INTEGER DEFAULT 1,
  requires_auth INTEGER DEFAULT 0,
  rate_limit_per_minute INTEGER DEFAULT 30,
  documentation_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_connectors (
  id VARCHAR(64) PRIMARY KEY,
  source_id VARCHAR(64) NOT NULL REFERENCES research_sources(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'unconfigured', 'rate_limited', 'error'
  auth_config_json TEXT, -- Encrypted/secure stored credentials when provided by admin
  last_synced_at TIMESTAMP,
  requests_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. COMPANIES (ZERO FABRICATED DATA POLICY - ONLY DISCOVERED OR ENTERED ENTITIES)
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(64) PRIMARY KEY,
  legal_name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255),
  official_website VARCHAR(255),
  domain VARCHAR(150),
  primary_country VARCHAR(100) NOT NULL,
  primary_city VARCHAR(100),
  headquarters_address TEXT,
  primary_industry VARCHAR(100) NOT NULL, -- Cosmetics, Perfume, Supplements, Packaging, Distribution
  business_type VARCHAR(100), -- Brand Owner, Wholesaler, Importer, Retail Chain, OEM Buyer, Distributor
  business_description TEXT,
  products_summary TEXT,
  nkb_service_fit VARCHAR(100), -- Cosmetics OEM/ODM, Perfume OEM/ODM, Supplements OEM/ODM, Packaging Supply
  verification_status VARCHAR(50) DEFAULT 'unverified', -- 'unverified', 'pending_research', 'verified', 'disqualified'
  confidence_level VARCHAR(30) DEFAULT 'medium', -- 'high', 'medium', 'low'
  source_attribution TEXT NOT NULL,
  first_discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_researched_at TIMESTAMP,
  is_archived INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(primary_country);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(primary_industry);
CREATE INDEX IF NOT EXISTS idx_companies_fit ON companies(nkb_service_fit);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);

-- 5. COMPANY RELATIONS (LOCATIONS, INDUSTRIES, SERVICES, SOURCES)
CREATE TABLE IF NOT EXISTS company_locations (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  location_type VARCHAR(50) DEFAULT 'branch', -- 'headquarters', 'branch', 'warehouse', 'manufacturing_site'
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  address TEXT,
  evidence_source TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_industries (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  industry_name VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_services (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  service_category VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_sources (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_code VARCHAR(50) NOT NULL,
  source_name VARCHAR(150) NOT NULL,
  source_url TEXT,
  retrieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  raw_payload_snippet TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. COMPANY RESEARCH & INTELLIGENCE
CREATE TABLE IF NOT EXISTS company_research (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  research_type VARCHAR(50) NOT NULL, -- 'automated_agent', 'analyst_review', 'web_extraction'
  analyst_user_id VARCHAR(64) REFERENCES users(id),
  executive_summary TEXT,
  manufacturing_requirements TEXT,
  procurement_signals TEXT,
  expansion_signals TEXT,
  distribution_channels TEXT,
  estimated_scale TEXT, -- Explicitly recorded as estimate or verified with evidence
  evidence_links TEXT,
  confidence_rating INTEGER DEFAULT 50, -- 0-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. BUSINESS CONTACTS (DECISION-MAKERS - STRICT EVIDENCE & ACCURACY)
CREATE TABLE IF NOT EXISTS business_contacts (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  job_title VARCHAR(150) NOT NULL,
  department VARCHAR(100), -- 'Procurement', 'Sourcing', 'Supply Chain', 'Executive', 'Product Dev'
  business_email VARCHAR(255),
  phone_number VARCHAR(100),
  linkedin_url TEXT,
  contact_status VARCHAR(50) DEFAULT 'unverified', -- 'verified', 'publicly_listed', 'unverified', 'invalid', 'not_available'
  evidence_source TEXT NOT NULL,
  verification_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON business_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON business_contacts(contact_status);

CREATE TABLE IF NOT EXISTS contact_sources (
  id VARCHAR(64) PRIMARY KEY,
  contact_id VARCHAR(64) NOT NULL REFERENCES business_contacts(id) ON DELETE CASCADE,
  source_title VARCHAR(150) NOT NULL,
  source_url TEXT,
  verification_method VARCHAR(100),
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. LEAD QUALIFICATION & SCORING (100-POINT ENGINE)
CREATE TABLE IF NOT EXISTS lead_scores (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL, -- 0-100
  priority_tier VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D'
  industry_fit_score INTEGER NOT NULL, -- max 25
  service_fit_score INTEGER NOT NULL, -- max 25
  purchasing_potential_score INTEGER NOT NULL, -- max 20
  business_legitimacy_score INTEGER NOT NULL, -- max 15
  buying_signals_score INTEGER NOT NULL, -- max 15
  confidence_level VARCHAR(30) NOT NULL, -- 'high', 'medium', 'low'
  explanation TEXT NOT NULL,
  missing_information TEXT,
  recommended_action TEXT,
  weights_used_json TEXT,
  scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_total ON lead_scores(total_score);
CREATE INDEX IF NOT EXISTS idx_lead_scores_tier ON lead_scores(priority_tier);

CREATE TABLE IF NOT EXISTS qualification_history (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  previous_score INTEGER,
  new_score INTEGER NOT NULL,
  previous_tier VARCHAR(10),
  new_tier VARCHAR(10) NOT NULL,
  reason TEXT,
  changed_by VARCHAR(64) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. CRM PIPELINE & OPPORTUNITIES
CREATE TABLE IF NOT EXISTS opportunities (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  pipeline_stage VARCHAR(50) NOT NULL DEFAULT 'new_prospect',
  -- Stages: 'new_prospect', 'researching', 'qualified', 'contact_identified', 'ready_for_outreach',
  -- 'contacted', 'interested', 'meeting_scheduled', 'rfq_received', 'quotation_submitted',
  -- 'negotiation', 'contract_won', 'lost', 'disqualified'
  estimated_value DECIMAL(12, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  service_category VARCHAR(100),
  assigned_to VARCHAR(64) REFERENCES users(id),
  target_close_date TIMESTAMP,
  win_probability INTEGER DEFAULT 10,
  disqualification_reason TEXT,
  loss_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_opp_stage ON opportunities(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_opp_assigned ON opportunities(assigned_to);

CREATE TABLE IF NOT EXISTS pipeline_history (
  id VARCHAR(64) PRIMARY KEY,
  opportunity_id VARCHAR(64) NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  from_stage VARCHAR(50),
  to_stage VARCHAR(50) NOT NULL,
  note TEXT,
  changed_by VARCHAR(64) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_activities (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'note', 'email_sent', 'call', 'meeting', 'rfq', 'status_change'
  summary VARCHAR(255) NOT NULL,
  details TEXT,
  performed_by VARCHAR(64) REFERENCES users(id),
  activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
  due_date TIMESTAMP,
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  assigned_to VARCHAR(64) REFERENCES users(id),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. SALES PROPOSALS
CREATE TABLE IF NOT EXISTS proposals (
  id VARCHAR(64) PRIMARY KEY,
  proposal_number VARCHAR(50) NOT NULL UNIQUE,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL, -- 'Cosmetics OEM/ODM', 'Perfume OEM/ODM', 'Supplements OEM/ODM', 'Packaging Supply'
  status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'sent', 'rejected'
  introduction TEXT,
  manufacturing_specs TEXT,
  proposed_solutions TEXT,
  commercial_terms TEXT,
  next_steps TEXT,
  approved_by VARCHAR(64) REFERENCES users(id),
  approved_at TIMESTAMP,
  created_by VARCHAR(64) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposal_items (
  id VARCHAR(64) PRIMARY KEY,
  proposal_id VARCHAR(64) NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  specification TEXT,
  moq_units INTEGER,
  lead_time_days INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. OUTREACH & EMAIL MANAGEMENT (ZERO-SEND BY DEFAULT, STRICT HUMAN APPROVAL)
CREATE TABLE IF NOT EXISTS email_accounts (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email_address VARCHAR(255) NOT NULL UNIQUE,
  smtp_host VARCHAR(255),
  smtp_port INTEGER DEFAULT 587,
  is_active INTEGER DEFAULT 1,
  daily_send_limit INTEGER DEFAULT 50,
  sent_today INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_messages (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id VARCHAR(64) REFERENCES business_contacts(id) ON DELETE SET NULL,
  opportunity_id VARCHAR(64) REFERENCES opportunities(id) ON DELETE SET NULL,
  sender_account_id VARCHAR(64) REFERENCES email_accounts(id),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_text TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'ready_for_approval', 'approved', 'sent', 'failed', 'cancelled'
  approved_by VARCHAR(64) REFERENCES users(id),
  approved_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivery_status TEXT,
  error_message TEXT,
  created_by VARCHAR(64) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_suppression (
  id VARCHAR(64) PRIMARY KEY,
  email_or_domain VARCHAR(255) NOT NULL UNIQUE,
  reason VARCHAR(100) NOT NULL, -- 'unsubscribed', 'bounced', 'do_not_contact', 'invalid'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. RESEARCH JOBS & BACKGROUND PROCESSING
CREATE TABLE IF NOT EXISTS research_jobs (
  id VARCHAR(64) PRIMARY KEY,
  job_type VARCHAR(50) NOT NULL, -- 'global_discovery', 'company_enrichment', 'contact_discovery', 'batch_qualification'
  source_id VARCHAR(64) REFERENCES research_sources(id),
  query_params_json TEXT,
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  results_count INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
  error_message TEXT,
  initiated_by VARCHAR(64) REFERENCES users(id),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. AI AGENTS & EXECUTION LOGS
CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id VARCHAR(64) PRIMARY KEY,
  agent_name VARCHAR(100) NOT NULL,
  -- 'Global Research Agent', 'Company Intelligence Agent', 'Lead Qualification Agent',
  -- 'Market Opportunity Agent', 'Contact Research Agent', 'Sales Proposal Agent', 'Follow-up Recommendation Agent'
  task_description TEXT NOT NULL,
  input_payload_json TEXT,
  output_result_json TEXT,
  status VARCHAR(30) NOT NULL, -- 'success', 'warning', 'failed'
  execution_duration_ms INTEGER,
  model_used VARCHAR(100),
  tokens_used INTEGER DEFAULT 0,
  cost_incurred DECIMAL(6, 4) DEFAULT 0.0000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. MARKET INTELLIGENCE & BUSINESS SIGNALS
CREATE TABLE IF NOT EXISTS market_reports (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'country_analysis', 'industry_radar', 'buyer_signals', 'competitor_observation'
  country VARCHAR(100),
  industry VARCHAR(100),
  summary TEXT NOT NULL,
  signal_data_json TEXT,
  source_attribution TEXT NOT NULL,
  research_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(64) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. ATTACHMENTS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS attachments (
  id VARCHAR(64) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'company', 'proposal', 'opportunity'
  entity_id VARCHAR(64) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'alert'
  is_read INTEGER DEFAULT 0,
  link_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. AUDIT LOGS & SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(64),
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  description TEXT,
  updated_by VARCHAR(64) REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
