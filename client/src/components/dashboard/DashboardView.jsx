import React, { useState, useEffect } from 'react';
import {
  Building2,
  Award,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { EmptyState } from '../common/EmptyState';
import { StageBadge } from '../common/Badge';

export function DashboardView({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (countryFilter) query.append('country', countryFilter);
      if (industryFilter) query.append('industry', industryFilter);

      const res = await apiRequest(`/dashboard/metrics?${query.toString()}`);
      setMetrics(res);
    } catch (err) {
      console.error('[Dashboard Metrics Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [countryFilter, industryFilter]);

  const m = metrics?.metrics || {
    totalCompanies: 0,
    verifiedCompanies: 0,
    qualifiedProspects: 0,
    highPriorityEnterprise: 0,
    awaitingResearch: 0,
    awaitingVerification: 0,
    contactedProspects: 0,
    interestedProspects: 0,
    activeOpportunities: 0,
    rfqOpportunities: 0,
    negotiations: 0,
    wonContracts: 0,
    lostOpportunities: 0
  };

  const statCards = [
    { title: 'Total Discovered Companies', value: m.totalCompanies, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', link: 'intelligence' },
    { title: 'Verified Companies', value: m.verifiedCompanies, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', link: 'intelligence' },
    { title: 'Qualified Prospects (Tier A & B)', value: m.qualifiedProspects, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', link: 'prospects' },
    { title: 'High-Priority Enterprise (Tier A)', value: m.highPriorityEnterprise, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50', link: 'prospects' },
    { title: 'Awaiting Deep Research', value: m.awaitingResearch, icon: FileQuestion, color: 'text-indigo-600', bg: 'bg-indigo-50', link: 'intelligence' },
    { title: 'Awaiting Verification', value: m.awaitingVerification, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', link: 'intelligence' },
    { title: 'Contacted Prospects', value: m.contactedProspects, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50', link: 'pipeline' },
    { title: 'Interested Prospects', value: m.interestedProspects, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', link: 'pipeline' },
    { title: 'Active CRM Opportunities', value: m.activeOpportunities, icon: Briefcase, color: 'text-blue-700', bg: 'bg-blue-50', link: 'opportunities' },
    { title: 'Requests for Quotation (RFQ)', value: m.rfqOpportunities, icon: FileText, color: 'text-amber-700', bg: 'bg-amber-50', link: 'opportunities' },
    { title: 'Commercial Negotiations', value: m.negotiations, icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-50', link: 'opportunities' },
    { title: 'Won Manufacturing Contracts', value: m.wonContracts, icon: CheckCircle2, color: 'text-emerald-800', bg: 'bg-emerald-100', link: 'opportunities' }
  ];

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Filters:</span>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="">All Industries</option>
            <option value="Cosmetics">Cosmetics & Beauty</option>
            <option value="Perfume">Perfume & Fragrance</option>
            <option value="Food Supplements">Food Supplements</option>
            <option value="Packaging Materials">Packaging Materials</option>
          </select>

          {(countryFilter || industryFilter) && (
            <button
              onClick={() => { setCountryFilter(''); setIndustryFilter(''); }}
              className="text-xs text-rose-600 hover:text-rose-700 underline font-medium"
            >
              Reset
            </button>
          )}
        </div>

        <button
          onClick={() => onNavigate('finder')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-amber-400" />
          <span>Launch Company Finder</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(card.link)}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-400/80 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium leading-tight">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-slate-800 tracking-tight font-mono">{card.value}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State Banner if 0 records */}
      {m.totalCompanies === 0 && !loading && (
        <EmptyState
          title="Executive Pipeline is Empty (Zero Dummy Data Enforced)"
          description="NKB Global Hunter strictly prohibits artificial placeholder companies. Search and discover genuine cosmetics, perfume, supplement, and packaging businesses using our verified registry connectors."
          actionLabel="Discover Target B2B Companies"
          onAction={() => onNavigate('finder')}
        />
      )}

      {/* Breakdowns & Pipeline Distribution */}
      {m.totalCompanies > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Country Distribution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-4">
              Prospects by Priority Country
            </h3>
            <div className="space-y-2.5">
              {(metrics?.countryBreakdown || []).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{c.primary_country || 'International'}</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Distribution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-4">
              Target Manufacturing Industries
            </h3>
            <div className="space-y-2.5">
              {(metrics?.industryBreakdown || []).map((ind, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{ind.primary_industry}</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {ind.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Funnel Distribution */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-4">
              Sales Pipeline Status
            </h3>
            <div className="space-y-2.5">
              {(metrics?.pipelineBreakdown || []).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <StageBadge stage={p.pipeline_stage} />
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
