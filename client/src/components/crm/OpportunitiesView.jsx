import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Filter, Download, ExternalLink } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { StageBadge, TierBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

export function OpportunitiesView({ onSelectCompany, onNavigate }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('');

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/crm/pipeline');
      const all = [];
      if (res.board) {
        Object.values(res.board).forEach(arr => all.push(...arr));
      }
      setOpportunities(all);
    } catch (err) {
      console.error('[Opportunities Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleExportCSV = () => {
    window.open('/api/reports/export/opportunities', '_blank');
  };

  const filtered = stageFilter
    ? opportunities.filter(o => o.pipeline_stage === stageFilter)
    : opportunities;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Manufacturing Business Opportunities</h3>
          <p className="text-xs text-slate-500">Track deal progression, service specifications, and deal values.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="">All Pipeline Stages</option>
            <option value="new_prospect">New Prospect</option>
            <option value="qualified">Qualified</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="rfq_received">RFQ Received</option>
            <option value="negotiation">Negotiation</option>
            <option value="contract_won">Contract Won</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 && !loading && (
        <EmptyState
          title="No Opportunities Found"
          description="Opportunities correspond to real company engagements in our CRM. Discover target companies to begin qualification."
          actionLabel="Discover Target Companies"
          onAction={() => onNavigate('finder')}
        />
      )}

      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Opportunity Title</th>
                  <th className="py-3 px-4">Target Company</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Lead Score</th>
                  <th className="py-3 px-4">Win Probability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{opp.title}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{opp.company_name}</span>
                      <span className="text-[11px] text-slate-400 block">{opp.primary_country}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StageBadge stage={opp.pipeline_stage} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-200">
                        {opp.service_category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <TierBadge tier={opp.priority_tier} />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">{opp.win_probability}%</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectCompany(opp.company_id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded font-medium text-xs transition-colors"
                      >
                        Company Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
