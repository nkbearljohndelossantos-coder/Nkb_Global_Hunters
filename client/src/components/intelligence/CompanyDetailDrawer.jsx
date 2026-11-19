import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Building2,
  Users,
  Award,
  Bot,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Globe,
  MapPin,
  Briefcase
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { TierBadge, VerificationBadge, ContactStatusBadge, StageBadge } from '../common/Badge';

export function CompanyDetailDrawer({ companyId, onClose, onRefreshList, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'qualification', 'contacts', 'agents', 'proposals', 'crm'
  const [agentRunning, setAgentRunning] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // New Contact Form State
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Procurement Manager');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEvidence, setContactEvidence] = useState('');
  const [contactStatus, setContactStatus] = useState('publicly_listed');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/companies/${companyId}`);
      setData(res);
    } catch (err) {
      console.error('[Fetch Detail Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchDetail();
    }
  }, [companyId]);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await apiRequest(`/companies/${companyId}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      await fetchDetail();
      if (onRefreshList) onRefreshList();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRescore = async () => {
    try {
      await apiRequest(`/qualification/rescore/${companyId}`, { method: 'POST' });
      await fetchDetail();
      if (onRefreshList) onRefreshList();
    } catch (err) {
      alert(`Rescoring failed: ${err.message}`);
    }
  };

  const handleRunAgent = async (agentType) => {
    setAgentRunning(true);
    try {
      await apiRequest('/agents/run', {
        method: 'POST',
        body: JSON.stringify({ agentType, companyId })
      });
      await fetchDetail();
      if (onRefreshList) onRefreshList();
      alert('AI Research Agent executed successfully. Insights updated.');
    } catch (err) {
      alert(`Agent execution failed: ${err.message}`);
    } finally {
      setAgentRunning(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!contactName || !contactRole || !contactEvidence) {
      alert('Name, Role, and Evidence Source are required.');
      return;
    }
    try {
      await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify({
          companyId,
          fullName: contactName,
          jobTitle: contactRole,
          businessEmail: contactEmail,
          phoneNumber: contactPhone,
          contactStatus,
          evidenceSource: contactEvidence
        })
      });
      setShowAddContact(false);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactEvidence('');
      await fetchDetail();
      if (onRefreshList) onRefreshList();
    } catch (err) {
      alert(`Failed to add contact: ${err.message}`);
    }
  };

  if (!companyId) return null;

  const c = data?.company;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-slate-900">{c?.legal_name || 'Loading Company...'}</h3>
              {c && <TierBadge tier={c.priority_tier} />}
              {c && <VerificationBadge status={c.verification_status} />}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {c?.primary_country} {c?.primary_city ? `• ${c.primary_city}` : ''}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {c?.primary_industry}
              </span>
              {c?.official_website && (
                <>
                  <span>•</span>
                  <a
                    href={c.official_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    <span>{c.domain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white text-xs font-semibold text-slate-600 overflow-x-auto">
          {[
            { id: 'overview', label: 'Company Intelligence', icon: Building2 },
            { id: 'qualification', label: '100-Pt Qualification', icon: Award },
            { id: 'contacts', label: `Contacts (${data?.contacts?.length || 0})`, icon: Users },
            { id: 'agents', label: 'AI Agents', icon: Bot },
            { id: 'crm', label: 'CRM & Deals', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-amber-500 text-nkb-navy font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mr-2" />
              <span className="text-xs">Loading verified records...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Verification Status Switcher */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Verification Status
                      </span>
                      <span className="text-xs text-slate-500">
                        Human analyst verification policy ensures no fabricated prospects proceed.
                      </span>
                    </div>
                    <select
                      value={c?.verification_status || 'unverified'}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={statusUpdating}
                      className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="unverified">Unverified Entity</option>
                      <option value="pending_research">Pending Research</option>
                      <option value="verified">Verified Authentic</option>
                      <option value="disqualified">Disqualified</option>
                    </select>
                  </div>

                  {/* Manufacturing Synergy Details */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Manufacturing Synergy & Business Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">NKB Manufacturing Fit</span>
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {c?.nkb_service_fit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Business Classification</span>
                        <span className="font-semibold text-slate-800">{c?.business_type || 'Brand Owner'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block mb-1">Business Description</span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {c?.business_description || 'No public narrative provided in registry.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block mb-1">Products & Operations</span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {c?.products_summary || 'Awaiting analyst product catalog review.'}
                      </p>
                    </div>
                  </div>

                  {/* Traceable Source Information (Mandatory Non-Negotiable) */}
                  <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <h4 className="text-xs font-bold uppercase text-amber-900 tracking-wider">
                        Traceable Source Information
                      </h4>
                    </div>
                    <div className="text-xs text-slate-700 space-y-1.5 font-mono">
                      <div>
                        <span className="font-semibold text-slate-500">Source: </span>
                        <span>{c?.source_attribution}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">First Discovered: </span>
                        <span>{new Date(c?.first_discovered_at).toLocaleString()}</span>
                      </div>
                      {c?.last_researched_at && (
                        <div>
                          <span className="font-semibold text-slate-500">Last Researched: </span>
                          <span>{new Date(c?.last_researched_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: QUALIFICATION */}
              {activeTab === 'qualification' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-extrabold font-mono text-slate-900">
                          {c?.total_score !== null ? `${c?.total_score}/100` : '--'}
                        </span>
                        <TierBadge tier={c?.priority_tier} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Confidence: <strong className="capitalize">{c?.score_confidence || 'Medium'}</strong>
                      </p>
                    </div>
                    <button
                      onClick={handleRescore}
                      className="px-3 py-2 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Recalculate Score</span>
                    </button>
                  </div>

                  {/* Score Breakdown (5 Dimensions) */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Multi-Dimensional Scoring Breakdown
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span className="text-slate-700">1. Industry Fit (Cosmetics/Perfume/Supplements/Packaging)</span>
                          <span className="font-mono font-bold text-slate-900">{c?.industry_fit_score || 0} / 25 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${((c?.industry_fit_score || 0) / 25) * 100}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span className="text-slate-700">2. NKB Service Fit (OEM/ODM Manufacturing Synergy)</span>
                          <span className="font-mono font-bold text-slate-900">{c?.service_fit_score || 0} / 25 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${((c?.service_fit_score || 0) / 25) * 100}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span className="text-slate-700">3. Purchasing Potential & Commercial Scale</span>
                          <span className="font-mono font-bold text-slate-900">{c?.purchasing_potential_score || 0} / 20 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${((c?.purchasing_potential_score || 0) / 20) * 100}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span className="text-slate-700">4. Business Legitimacy & Evidence Quality</span>
                          <span className="font-mono font-bold text-slate-900">{c?.business_legitimacy_score || 0} / 15 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-600 h-full rounded-full" style={{ width: `${((c?.business_legitimacy_score || 0) / 15) * 100}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-medium mb-1">
                          <span className="text-slate-700">5. Relevant Buying Signals & Expansion</span>
                          <span className="font-mono font-bold text-slate-900">{c?.buying_signals_score || 0} / 15 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-cyan-600 h-full rounded-full" style={{ width: `${((c?.buying_signals_score || 0) / 15) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transparent Explanation & Recommended Next Action */}
                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Scoring Explanation</span>
                      <p className="text-slate-600 leading-relaxed">{c?.score_explanation || 'Awaiting initial scoring evaluation.'}</p>
                    </div>

                    {c?.missing_information && (
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <span className="font-bold text-amber-800 uppercase tracking-wider block mb-1">Missing Evidence Penalties</span>
                        <p className="text-amber-900 leading-relaxed">{c?.missing_information}</p>
                      </div>
                    )}

                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                      <span className="font-bold text-emerald-800 uppercase tracking-wider block mb-1">Recommended Next Action</span>
                      <p className="text-emerald-900 leading-relaxed font-semibold">{c?.recommended_action || 'Conduct discovery research.'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Discovered Decision-Makers ({data?.contacts?.length || 0})
                    </span>
                    <button
                      onClick={() => setShowAddContact(!showAddContact)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{showAddContact ? 'Cancel' : 'Add Contact Record'}</span>
                    </button>
                  </div>

                  {/* Add Contact Form */}
                  {showAddContact && (
                    <form onSubmit={handleAddContact} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div className="font-semibold text-slate-800">New Business Contact (Strict Evidence Policy)</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full border border-slate-300 rounded p-2 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Job Role / Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Procurement Director"
                            value={contactRole}
                            onChange={(e) => setContactRole(e.target.value)}
                            className="w-full border border-slate-300 rounded p-2 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Public Business Email</label>
                          <input
                            type="email"
                            placeholder="e.g. procurement@company.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full border border-slate-300 rounded p-2 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-medium mb-1">Verification Status</label>
                          <select
                            value={contactStatus}
                            onChange={(e) => setContactStatus(e.target.value)}
                            className="w-full border border-slate-300 rounded p-2 bg-white"
                          >
                            <option value="publicly_listed">Publicly Listed</option>
                            <option value="verified">Verified Direct</option>
                            <option value="unverified">Unverified</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Evidence Source (Mandatory) *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Official website contact page, company annual report, public directory"
                          value={contactEvidence}
                          onChange={(e) => setContactEvidence(e.target.value)}
                          className="w-full border border-slate-300 rounded p-2 bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium shadow-sm"
                      >
                        Save Contact
                      </button>
                    </form>
                  )}

                  {/* Contacts List */}
                  {data?.contacts?.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                      No decision-makers recorded yet. Run the Contact Research Agent or add public channels directly.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data?.contacts?.map((contact) => (
                        <div key={contact.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 text-sm block">{contact.full_name}</span>
                              <span className="text-slate-500">{contact.job_title}</span>
                            </div>
                            <ContactStatusBadge status={contact.contact_status} />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-slate-400">Email: </span>
                              <span className="font-mono text-slate-700">{contact.business_email || 'Not published'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Discovered Date: </span>
                              <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-600">Evidence: </span>
                            <span>{contact.evidence_source}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AGENTS */}
              {activeTab === 'agents' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                        Specialized AI Research Agents
                      </h4>
                      <p className="text-xs text-slate-500">
                        Zero-cost heuristic and registry intelligence workflows.
                      </p>
                    </div>
                    {agentRunning && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Running Agent...</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <button
                      onClick={() => handleRunAgent('global_research')}
                      disabled={agentRunning}
                      className="p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-xl text-left space-y-1 transition-all disabled:opacity-50"
                    >
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <span>Global Research Agent</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Inspect live official website, meta tags, and detect OEM/wholesale terms.
                      </p>
                    </button>

                    <button
                      onClick={() => handleRunAgent('company_intelligence')}
                      disabled={agentRunning}
                      className="p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-xl text-left space-y-1 transition-all disabled:opacity-50"
                    >
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-600" />
                        <span>Company Intelligence Agent</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Synthesize corporate manufacturing requirements and NKB partnership fit.
                      </p>
                    </button>

                    <button
                      onClick={() => handleRunAgent('contact_research')}
                      disabled={agentRunning}
                      className="p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-xl text-left space-y-1 transition-all disabled:opacity-50"
                    >
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-600" />
                        <span>Contact Research Agent</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Review public inquiry mailto channels and procurement contact endpoints.
                      </p>
                    </button>

                    <button
                      onClick={() => handleRunAgent('follow_up')}
                      disabled={agentRunning}
                      className="p-4 bg-white border border-slate-200 hover:border-amber-400 rounded-xl text-left space-y-1 transition-all disabled:opacity-50"
                    >
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-amber-600" />
                        <span>Follow-up Recommendation Agent</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Formulate next-action sales outreach cadence based on CRM stage.
                      </p>
                    </button>
                  </div>

                  {/* Research Logs History */}
                  {data?.research?.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Intelligence Notes ({data.research.length})
                      </h5>
                      {data.research.map((r) => (
                        <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span className="font-semibold text-slate-700 capitalize">{r.research_type}</span>
                            <span>{new Date(r.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-800">{r.executive_summary}</p>
                          {r.manufacturing_requirements && (
                            <p className="text-slate-600 text-[11px]">
                              <strong className="text-slate-700">Requirements: </strong>
                              {r.manufacturing_requirements}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CRM */}
              {activeTab === 'crm' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold uppercase text-slate-700 tracking-wider">
                        Sales Opportunities ({data?.opportunities?.length || 0})
                      </h4>
                      <p className="text-slate-500 text-[11px]">
                        Track pipeline milestones, quotations, and contract negotiations.
                      </p>
                    </div>
                  </div>

                  {data?.opportunities?.map((opp) => (
                    <div key={opp.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{opp.title}</span>
                        <StageBadge stage={opp.pipeline_stage} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                        <div>
                          <span className="text-slate-400">Category: </span>
                          <span>{opp.service_category}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Win Probability: </span>
                          <span className="font-semibold">{opp.win_probability}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
