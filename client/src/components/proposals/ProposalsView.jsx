import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../common/EmptyState';

export function ProposalsView({ onNavigate }) {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [companies, setCompanies] = useState([]);
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formService, setFormService] = useState('Cosmetics OEM/ODM');
  const [formIntro, setFormIntro] = useState('');
  const [formSpecs, setFormSpecs] = useState('');
  const [formTerms, setFormTerms] = useState('');
  const [formNextSteps, setFormNextSteps] = useState('');

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/proposals');
      setProposals(res.data || []);
    } catch (err) {
      console.error('[Fetch Proposals Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const openCreateModal = async () => {
    try {
      const res = await apiRequest('/companies?limit=50');
      setCompanies(res.data || []);
      if (res.data?.length > 0) {
        setFormCompanyId(res.data[0].id);
      }
      setShowCreateModal(true);
    } catch (err) {
      alert('Failed to load companies for proposal creation.');
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/proposals', {
        method: 'POST',
        body: JSON.stringify({
          companyId: formCompanyId,
          title: formTitle,
          serviceType: formService,
          introduction: formIntro,
          manufacturingSpecs: formSpecs,
          commercialTerms: formTerms,
          nextSteps: formNextSteps
        })
      });
      setShowCreateModal(false);
      await fetchProposals();
      alert('Proposal created in Draft status.');
    } catch (err) {
      alert(`Creation failed: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (proposalId, newStatus) => {
    try {
      await apiRequest(`/proposals/${proposalId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      await fetchProposals();
      if (selectedProposal && selectedProposal.id === proposalId) {
        const updated = await apiRequest(`/proposals/${proposalId}`);
        setSelectedProposal(updated);
      }
      alert(`Proposal status updated to ${newStatus}.`);
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const canApprove = ['role_admin', 'role_sales_manager', 'Administrator', 'Sales Manager'].includes(user?.roleId) ||
                     ['Administrator', 'Sales Manager'].includes(user?.roleName);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>AI Sales Proposal Generator & Management</span>
          </h3>
          <p className="text-xs text-slate-500">
            Formulate customized B2B proposals for OEM/ODM cosmetics, perfume, food supplements, and packaging.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>New Proposal Draft</span>
        </button>
      </div>

      {proposals.length === 0 && !loading && (
        <EmptyState
          title="No Sales Proposals Created Yet"
          description="Sales proposals must be linked to genuine target companies and approved by a Sales Manager or Administrator prior to outreach."
          actionLabel="Create Proposal Draft"
          onAction={openCreateModal}
        />
      )}

      {proposals.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Proposal Number</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {proposals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.proposal_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.title}</td>
                    <td className="py-3 px-4">
                      {p.company_name}
                      <span className="text-[11px] text-slate-400 block">{p.primary_country}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-200">
                        {p.service_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          p.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : p.status === 'sent'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.creator_name || 'System Admin'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={async () => {
                          const detailed = await apiRequest(`/proposals/${p.id}`);
                          setSelectedProposal(detailed);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proposal Viewer / Print Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-sm text-slate-900">
                  {selectedProposal.proposal_number} - {selectedProposal.company_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 border rounded hover:bg-white text-slate-600 text-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button onClick={() => setSelectedProposal(null)} className="p-1.5 text-slate-400 hover:text-slate-700">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs text-slate-800 print:p-0">
              {/* Proposal Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 uppercase font-mono tracking-wider">
                    NKB MANUFACTURING
                  </h2>
                  <p className="text-xs text-slate-500">Enterprise Contract Manufacturing Services</p>
                  <p className="text-[11px] text-slate-500 font-mono">GMP & ISO Compliant Production Hub</p>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-600">
                  <div className="font-bold text-slate-900">{selectedProposal.proposal_number}</div>
                  <div>Date: {new Date(selectedProposal.created_at).toLocaleDateString()}</div>
                  <div className="text-amber-700 font-bold uppercase mt-1">Status: {selectedProposal.status}</div>
                </div>
              </div>

              {/* Recipient */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                  PREPARED FOR:
                </span>
                <div className="text-sm font-bold text-slate-900">{selectedProposal.company_name}</div>
                <div className="text-slate-600">{selectedProposal.primary_country}</div>
              </div>

              {/* Proposal Sections */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">1. Executive Introduction</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded border border-slate-100">
                  {selectedProposal.introduction}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">2. Manufacturing & Quality Specifications</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded border border-slate-100">
                  {selectedProposal.manufacturing_specs}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">3. Proposed Commercial & MOQ Terms</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded border border-slate-100">
                  {selectedProposal.commercial_terms}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">4. Proposed Next Steps & Timeline</h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded border border-slate-100">
                  {selectedProposal.next_steps}
                </p>
              </div>

              {/* Approval Signature Block */}
              <div className="pt-4 border-t flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  <span className="font-semibold text-slate-700">Created By: </span>
                  <span>{selectedProposal.creator_name || 'System Admin'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Manager Approval: </span>
                  <span className={selectedProposal.approved_at ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {selectedProposal.approver_name ? `Approved by ${selectedProposal.approver_name}` : 'Awaiting Approval'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Human approval policy: Proposals cannot be dispatched until signed off by Sales Manager.
              </div>
              <div className="flex items-center gap-2">
                {selectedProposal.status === 'draft' && canApprove && (
                  <button
                    onClick={() => handleUpdateStatus(selectedProposal.id, 'approved')}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shadow-sm"
                  >
                    Approve Proposal
                  </button>
                )}
                {selectedProposal.status === 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedProposal.id, 'sent')}
                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-sm"
                  >
                    Mark as Sent
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateProposal} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-slate-900 text-sm">Create Manufacturing Proposal Draft</h4>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Target Discovered Company *</label>
                <select
                  required
                  value={formCompanyId}
                  onChange={(e) => setFormCompanyId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 bg-white"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.legal_name} ({c.primary_country} - {c.primary_industry})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Proposal Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Strategic OEM Manufacturing Partnership"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Service Type *</label>
                  <select
                    value={formService}
                    onChange={(e) => setFormService(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 bg-white"
                  >
                    <option value="Cosmetics OEM/ODM">Cosmetics OEM/ODM</option>
                    <option value="Perfume OEM/ODM">Perfume OEM/ODM</option>
                    <option value="Food Supplements OEM/ODM">Food Supplements OEM/ODM</option>
                    <option value="Packaging Supply">Packaging Supply</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Introduction</label>
                <textarea
                  rows={2}
                  placeholder="Company introduction and mutual value proposition..."
                  value={formIntro}
                  onChange={(e) => setFormIntro(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Manufacturing Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Certifications, batch sizing, cleanroom standards..."
                  value={formSpecs}
                  onChange={(e) => setFormSpecs(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Commercial & MOQ Terms</label>
                <textarea
                  rows={2}
                  placeholder="Low MOQ entry, payment terms, delivery schedules..."
                  value={formTerms}
                  onChange={(e) => setFormTerms(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 border rounded text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded font-semibold"
              >
                Save Draft
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
