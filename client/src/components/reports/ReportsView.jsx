import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileSpreadsheet, Globe, Building2, Award } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { EmptyState } from '../common/EmptyState';

export function ReportsView() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/reports/analytics');
      setAnalytics(res);
    } catch (err) {
      console.error('[Fetch Analytics Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const downloadCSV = (endpoint, filename) => {
    window.open(`/api/reports/export/${endpoint}`, '_blank');
  };

  const byCountry = analytics?.byCountry || [];
  const byIndustry = analytics?.byIndustry || [];
  const byService = analytics?.byService || [];
  const byTier = analytics?.byTier || [];

  const totalCompanies = byCountry.reduce((acc, c) => acc + parseInt(c.value, 10), 0);

  return (
    <div className="space-y-6">
      {/* Header and Export Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Executive Reporting & Analytics (Real Records Only)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-tabulated distributions computed exclusively from authentic database entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV('companies', 'companies.csv')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Verified Companies (CSV)</span>
          </button>
          <button
            onClick={() => downloadCSV('opportunities', 'opportunities.csv')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Opportunities (CSV)</span>
          </button>
        </div>
      </div>

      {totalCompanies === 0 && !loading && (
        <EmptyState
          title="Reporting Database Contains Zero Records"
          description="In compliance with our Zero-Dummy-Data policy, analytics reports only populate when genuine prospect companies are discovered and logged."
        />
      )}

      {totalCompanies > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Country */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Prospects by Territory ({totalCompanies} Total)</span>
            </h4>
            <div className="space-y-2 text-xs">
              {byCountry.map((c, i) => {
                const pct = Math.round((c.value / totalCompanies) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-700">{c.label}</span>
                      <span className="font-mono text-slate-900 font-bold">{c.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Industry */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Prospects by Core Industry</span>
            </h4>
            <div className="space-y-2 text-xs">
              {byIndustry.map((ind, i) => {
                const pct = Math.round((ind.value / totalCompanies) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-700">{ind.label}</span>
                      <span className="font-mono text-slate-900 font-bold">{ind.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Service Synergy */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>NKB Manufacturing Service Synergy</span>
            </h4>
            <div className="space-y-2 text-xs">
              {byService.map((srv, i) => {
                const pct = Math.round((srv.value / totalCompanies) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-700">{srv.label}</span>
                      <span className="font-mono text-slate-900 font-bold">{srv.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Lead Tier */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Lead Quality Tiers Distribution</span>
            </h4>
            <div className="space-y-2 text-xs">
              {byTier.map((t, i) => {
                const pct = Math.round((t.value / totalCompanies) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-slate-700">Tier {t.label}</span>
                      <span className="font-mono text-slate-900 font-bold">{t.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
