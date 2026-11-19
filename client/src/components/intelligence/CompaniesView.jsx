import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Building2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { TierBadge, VerificationBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

export function CompaniesView({ onSelectCompany, onOpenManualModal, onNavigate }) {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');

  const fetchCompanies = async (page = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.append('page', page);
      q.append('limit', 20);
      if (search) q.append('search', search);
      if (country) q.append('country', country);
      if (industry) q.append('industry', industry);
      if (tier) q.append('tier', tier);
      if (status) q.append('status', status);

      const res = await apiRequest(`/companies?${q.toString()}`);
      setCompanies(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 20, totalCount: 0, totalPages: 1 });
    } catch (err) {
      console.error('[Fetch Companies Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(1);
  }, [country, industry, tier, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompanies(1);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies by name or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-none"
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

          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="">All Industries</option>
            <option value="Cosmetics">Cosmetics</option>
            <option value="Perfume">Perfume</option>
            <option value="Food Supplements">Food Supplements</option>
            <option value="Packaging Materials">Packaging Supply</option>
          </select>

          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="">All Tiers</option>
            <option value="A">Tier A (80-100)</option>
            <option value="B">Tier B (60-79)</option>
            <option value="C">Tier C (40-59)</option>
            <option value="D">Tier D (&lt;40)</option>
          </select>

          <button
            onClick={onOpenManualModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Zero Dummy Data Empty State */}
      {companies.length === 0 && !loading && (
        <EmptyState
          title="Company Directory is Currently Empty"
          description="In compliance with our Zero-Dummy-Data policy, no sample records or fictional clients are seeded. Start by running Global Company Finder to query live verified public registries."
          actionLabel="Run Company Discovery"
          onAction={() => onNavigate('finder')}
        />
      )}

      {/* Companies Data Table */}
      {companies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Company Legal / Trading Name</th>
                  <th className="py-3 px-4">Country & City</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">NKB Service Synergy</th>
                  <th className="py-3 px-4">Lead Score</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Contacts</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.legal_name}</div>
                      {c.official_website && (
                        <a
                          href={c.official_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 hover:text-amber-700 text-[11px] inline-flex items-center gap-1 font-mono"
                        >
                          <span>{c.domain || 'Website'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.primary_country}
                      {c.primary_city && <span className="block text-slate-400 text-[11px]">{c.primary_city}</span>}
                    </td>
                    <td className="py-3 px-4">{c.primary_industry}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-200">
                        {c.nkb_service_fit}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {c.total_score !== null ? `${c.total_score}/100` : '--'}
                        </span>
                        <TierBadge tier={c.priority_tier} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <VerificationBadge status={c.verification_status} />
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {c.contact_count > 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                          {c.contact_count} identified
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectCompany(c.id)}
                        className="px-3 py-1 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded text-xs font-medium transition-colors shadow-sm"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {companies.length} of {pagination.totalCount} verified companies
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchCompanies(pagination.page - 1)}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCompanies(pagination.page + 1)}
                className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
