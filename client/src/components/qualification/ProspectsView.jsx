import React, { useState, useEffect } from 'react';
import { Award, Search, Filter, ExternalLink, RefreshCw, ArrowUpRight } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { TierBadge, VerificationBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

export function ProspectsView({ onSelectCompany, onNavigate }) {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState('A'); // Default to Tier A
  const [countryFilter, setCountryFilter] = useState('');

  const fetchProspects = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (tierFilter) q.append('tier', tierFilter);
      if (countryFilter) q.append('country', countryFilter);
      q.append('sortBy', 'total_score');
      q.append('sortOrder', 'DESC');

      const res = await apiRequest(`/companies?${q.toString()}`);
      setProspects(res.data || []);
    } catch (err) {
      console.error('[Fetch Prospects Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [tierFilter, countryFilter]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-800">Enterprise High-Value Prospects</h3>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 font-semibold focus:outline-none"
          >
            <option value="A">Priority Tier A (Score 80–100)</option>
            <option value="B">Priority Tier B (Score 60–79)</option>
            <option value="C">Priority Tier C (Score 40–59)</option>
            <option value="">All Scored Companies</option>
          </select>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="">All Countries</option>
            <option value="Philippines">Philippines</option>
            <option value="United States">United States</option>
            <option value="Japan">Japan</option>
            <option value="South Korea">South Korea</option>
            <option value="China">China</option>
            <option value="Australia">Australia</option>
            <option value="United Arab Emirates">United Arab Emirates</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
          </select>
        </div>
      </div>

      {prospects.length === 0 && !loading && (
        <EmptyState
          title={`No Qualified Tier ${tierFilter} Prospects Found`}
          description="Qualified prospects are determined by our 100-point multi-dimensional scoring model based on industry fit, NKB manufacturing synergy, purchasing scale, legitimacy, and buying signals."
          actionLabel="Discover More Companies"
          onAction={() => onNavigate('finder')}
        />
      )}

      {prospects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prospects.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectCompany(p.id)}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-400 shadow-sm transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <TierBadge tier={p.priority_tier} />
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    Score: {p.total_score}/100
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  {p.legal_name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {p.primary_country} • {p.primary_industry}
                </p>
                <div className="mt-3">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-200">
                    Synergy: {p.nkb_service_fit}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <VerificationBadge status={p.verification_status} />
                <span className="flex items-center gap-1 text-amber-700 font-semibold group-hover:underline">
                  <span>Inspect Prospect</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
