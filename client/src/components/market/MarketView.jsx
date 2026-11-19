import React, { useState, useEffect } from 'react';
import { TrendingUp, Globe, FileText, ExternalLink, ShieldCheck, Filter } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { EmptyState } from '../common/EmptyState';

export function MarketView({ onNavigate }) {
  const [reports, setReports] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        apiRequest('/market/reports'),
        apiRequest('/market/signals')
      ]);
      setReports(rRes || []);
      setSignals(sRes || []);
    } catch (err) {
      console.error('[Market Data Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span>Market Intelligence & Public Buying Signals</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Synthesized cross-border market intelligence and genuine corporate procurement signals. Every report cites verifiable sources.
          </p>
        </div>
        <button
          onClick={() => onNavigate('agents')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <span>Run Market Intelligence Agent</span>
        </button>
      </div>

      {/* Reports Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
          Market Intelligence Reports ({reports.length})
        </h4>

        {reports.length === 0 && !loading ? (
          <EmptyState
            title="No Market Reports Synthesized Yet"
            description="Market reports are generated using verified cross-border industry data. Launch the Market Opportunity Agent to generate your first strategic territory report."
            actionLabel="Generate Market Report"
            onAction={() => onNavigate('agents')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((rep) => (
              <div key={rep.id} className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {rep.country || 'Global'} • {rep.industry || 'Manufacturing'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(rep.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h5 className="font-bold text-sm text-slate-900">{rep.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed">{rep.summary}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium text-slate-600">Source: {rep.source_attribution}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buying Signals Section */}
      {signals.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
            Verified Procurement & Expansion Signals ({signals.length})
          </h4>
          <div className="space-y-3">
            {signals.map((sig) => (
              <div key={sig.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{sig.company_name}</span>
                  <span className="text-slate-400 font-normal text-[11px]">{sig.primary_country}</span>
                </div>
                {sig.expansion_signals && (
                  <p className="text-slate-600">
                    <strong className="text-emerald-700">Expansion Signal: </strong>
                    {sig.expansion_signals}
                  </p>
                )}
                {sig.procurement_signals && (
                  <p className="text-slate-600">
                    <strong className="text-blue-700">Procurement Requirement: </strong>
                    {sig.procurement_signals}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
