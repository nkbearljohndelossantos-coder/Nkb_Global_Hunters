import React, { useState } from 'react';
import {
  Search,
  Globe,
  Filter,
  RefreshCw,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Database
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { TierBadge, VerificationBadge } from '../common/Badge';

export function DiscoveryView({ onSelectCompany, onOpenManualModal }) {
  const [country, setCountry] = useState('Philippines');
  const [industry, setIndustry] = useState('Cosmetics');
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(15);
  const [searching, setSearching] = useState(false);
  const [searchSummary, setSearchSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    setErrorMessage('');
    setSearchSummary(null);

    try {
      const res = await apiRequest('/discovery/search', {
        method: 'POST',
        body: JSON.stringify({ country, industry, keyword, limit })
      });
      setSearchSummary(res.summary);
    } catch (err) {
      setErrorMessage(err.message || 'Discovery search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Source Badges */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">Global B2B Company Discovery Engine</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Queries live open global registries, knowledge graphs, and corporate directories. Zero artificial records.
            </p>
          </div>
          <button
            onClick={onOpenManualModal}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Add Verified Company Manually</span>
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Target Priority Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
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
              <option value="">Any International</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Manufacturing Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="Cosmetics">Cosmetics & Skincare</option>
              <option value="Perfume">Perfume & Fragrances</option>
              <option value="Food Supplements">Food Supplements & Nutraceuticals</option>
              <option value="Packaging Materials">Packaging Supply & Bottles</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Specific Keyword / Brand (Optional)</label>
            <input
              type="text"
              placeholder="e.g. serum, organics, labs..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={searching}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {searching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Connecting to Sources...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>Execute Discovery</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Active Connector Sources */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Active Connectors:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Wikidata SPARQL Knowledge Graph (Live & Free)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Direct Public Website & Metadata Inspector</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>Commercial API (Unconfigured - requires key in Settings)</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Result Summary Banner */}
      {searchSummary && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">
              Discovery run completed: {searchSummary.totalFound} matching companies verified from live sources.
            </span>
            <span className="text-emerald-700">
              ({searchSummary.newlyDiscovered} new entities stored, {searchSummary.duplicatesDetected} existing duplicates reconciled).
            </span>
          </div>
        </div>
      )}

      {/* Discovered Items Table */}
      {searchSummary && searchSummary.companies && searchSummary.companies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Discovered Entities ({searchSummary.companies.length})
            </h4>
            <span className="text-[11px] text-slate-400">All entities logged with verified source attribution</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Country & City</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">NKB Service Synergy</th>
                  <th className="py-3 px-4">Official Website</th>
                  <th className="py-3 px-4">Source Reference</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {searchSummary.companies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {c.legal_name}
                      {c.trading_name && c.trading_name !== c.legal_name && (
                        <span className="block text-[11px] text-slate-400 font-normal">dba {c.trading_name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.primary_country}
                      {c.primary_city && <span className="text-slate-400 block text-[11px]">{c.primary_city}</span>}
                    </td>
                    <td className="py-3 px-4">{c.primary_industry}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-200">
                        {c.nkb_service_fit}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.official_website ? (
                        <a
                          href={c.official_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 hover:text-amber-700 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>{c.domain || 'Visit Web'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Unavailable</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={c.source_attribution}>
                      {c.source_attribution}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectCompany(c.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded font-medium text-xs transition-colors"
                      >
                        Profile
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
