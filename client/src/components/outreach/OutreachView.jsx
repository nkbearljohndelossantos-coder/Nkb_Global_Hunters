import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertTriangle, ShieldCheck, PlusCircle, Ban, Send } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../common/EmptyState';

export function OutreachView({ onNavigate }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [suppressionList, setSuppressionList] = useState([]);
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'suppression'
  const [loading, setLoading] = useState(true);
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Form State
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/outreach/messages');
      setMessages(res || []);
    } catch (err) {
      console.error('[Outreach Messages Error]', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppression = async () => {
    try {
      const res = await apiRequest('/outreach/suppression');
      setSuppressionList(res || []);
    } catch (err) {
      console.error('[Suppression Fetch Error]', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchSuppression();
  }, []);

  const openDraftModal = async () => {
    try {
      const res = await apiRequest('/companies?limit=50');
      setCompanies(res.data || []);
      if (res.data?.length > 0) setCompanyId(res.data[0].id);
      setShowDraftModal(true);
    } catch (err) {
      alert('Failed to load companies for drafting.');
    }
  };

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/outreach/drafts', {
        method: 'POST',
        body: JSON.stringify({ companyId, recipientEmail, subject, bodyText })
      });
      setShowDraftModal(false);
      setSubject('');
      setBodyText('');
      setRecipientEmail('');
      await fetchMessages();
      alert('Email draft created. Awaiting Sales Manager human approval.');
    } catch (err) {
      alert(`Draft error: ${err.message}`);
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiRequest(`/outreach/messages/${id}/approve`, { method: 'POST' });
      await fetchMessages();
      alert('Draft approved by authorized manager.');
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleSend = async (id) => {
    try {
      await apiRequest(`/outreach/messages/${id}/send`, { method: 'POST' });
      await fetchMessages();
      alert('Email sent successfully via configured SMTP.');
    } catch (err) {
      alert(`Sending failed: ${err.message}`);
    }
  };

  const canApprove = ['role_admin', 'role_sales_manager', 'Administrator', 'Sales Manager'].includes(user?.roleId) ||
                     ['Administrator', 'Sales Manager'].includes(user?.roleName);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-500" />
            <span>Email & Outreach Center (Zero Automated Bulk Send)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict human approval required before any business communication is dispatched. Full suppression list enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'messages' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Outreach Messages ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('suppression')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'suppression' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Suppression List ({suppressionList.length})
            </button>
          </div>

          <button
            onClick={openDraftModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Compose Draft</span>
          </button>
        </div>
      </div>

      {activeTab === 'messages' && (
        <>
          {messages.length === 0 && !loading && (
            <EmptyState
              title="No Outreach Messages Created"
              description="In compliance with anti-spam and verified B2B protocols, outreach messages must be manually drafted or generated through our approved templates."
              actionLabel="Compose Outreach Draft"
              onAction={openDraftModal}
            />
          )}

          {messages.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Recipient Email</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4">Approver</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {messages.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.subject}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{m.company_name}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">{m.recipient_email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              m.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : m.status === 'sent'
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{m.author_name || 'System'}</td>
                        <td className="py-3 px-4 text-slate-500">{m.approver_name || 'Pending'}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {m.status === 'draft' && canApprove && (
                            <button
                              onClick={() => handleApprove(m.id)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {m.status === 'approved' && (
                            <button
                              onClick={() => handleSend(m.id)}
                              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold inline-flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Suppression List Tab */}
      {activeTab === 'suppression' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                Active Suppression & Do-Not-Contact Registry
              </h4>
              <p className="text-xs text-slate-500">
                Any domain or email on this list is permanently blocked from message generation or dispatch.
              </p>
            </div>
          </div>

          {suppressionList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No suppressed domains or emails recorded.</div>
          ) : (
            <div className="space-y-2">
              {suppressionList.map((sup) => (
                <div key={sup.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-800">{sup.email_or_domain}</span>
                  <span className="text-rose-700 font-semibold">{sup.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compose Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateDraft} className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm">Compose B2B Introduction Draft</h4>
              <button type="button" onClick={() => setShowDraftModal(false)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Target Company *</label>
                <select
                  required
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 bg-white"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.legal_name} ({c.primary_country})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Recipient Business Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sourcing@company.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contract Manufacturing Inquiry // NKB Manufacturing"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Message Body *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Draft introductory partnership inquiry..."
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDraftModal(false)}
                className="px-3 py-1.5 border rounded text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded text-xs font-semibold"
              >
                Save Draft For Approval
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
