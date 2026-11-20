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
  Database,
  Users,
  Briefcase,
  UserCheck,
  Sparkles,
  MapPin,
  Mail,
  Link as LinkIcon,
  Phone,
  MessageCircle
} from 'lucide-react';
import { apiRequest } from '../../services/api';

export function DiscoveryView({ onSelectCompany, onOpenManualModal, initialMode = 'companies' }) {
  const [mode, setMode] = useState(initialMode); // 'companies' or 'people'

  // Company Search Filters
  const [country, setCountry] = useState('Philippines');
  const [industry, setIndustry] = useState('Cosmetics');
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(15);
  const [searching, setSearching] = useState(false);
  const [searchSummary, setSearchSummary] = useState(null);

  // People Search Filters
  const [personRole, setPersonRole] = useState('All');
  const [personIndustry, setPersonIndustry] = useState('Cosmetics');
  const [personCountry, setPersonCountry] = useState('Philippines');
  const [personKeyword, setPersonKeyword] = useState('');
  const [peopleResults, setPeopleResults] = useState(null);
  const [savingPersonId, setSavingPersonId] = useState(null);

  const [errorMessage, setErrorMessage] = useState('');

  // Search Companies Handler
  const handleCompanySearch = async (e) => {
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

  // Search People / Decision Makers Handler
  const handlePeopleSearch = async (e) => {
    if (e) e.preventDefault();
    setSearching(true);
    setErrorMessage('');
    setPeopleResults(null);

    try {
      const res = await apiRequest('/discovery/people', {
        method: 'POST',
        body: JSON.stringify({
          role: personRole,
          industry: personIndustry,
          country: personCountry,
          keyword: personKeyword,
          limit: 20
        })
      });
      setPeopleResults(res.data || []);
    } catch (err) {
      setErrorMessage(err.message || 'Decision-maker search failed');
    } finally {
      setSearching(false);
    }
  };

  // Save Person Directly to Contacts & CRM
  const handleSavePerson = async (person) => {
    setSavingPersonId(person.id);
    try {
      const res = await apiRequest('/discovery/save-person', {
        method: 'POST',
        body: JSON.stringify({ person })
      });

      // Update local state to show saved badge
      if (peopleResults) {
        setPeopleResults(prev => prev.map(p => {
          if (p.id === person.id) {
            return { ...p, isSaved: true, savedContactId: res.contact?.id };
          }
          return p;
        }));
      }
    } catch (err) {
      alert(`Failed to save contact: ${err.message}`);
    } finally {
      setSavingPersonId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-1.5 rounded-xl shadow-sm border">
        <button
          type="button"
          onClick={() => { setMode('companies'); setErrorMessage(''); }}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            mode === 'companies'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>🏢 Search Target Companies & Brands</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('people');
            setErrorMessage('');
            if (!peopleResults) {
              // Auto-trigger initial people search for instant gratification
              setSearching(true);
              apiRequest('/discovery/people', {
                method: 'POST',
                body: JSON.stringify({ role: personRole, industry: personIndustry, country: personCountry })
              }).then(r => setPeopleResults(r.data || [])).finally(() => setSearching(false));
            }
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            mode === 'people'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-amber-300" />
          <span>👤 Decision-Maker & Buyer Hunter (Hanapin ang Tao)</span>
          <span className="px-2 py-0.5 text-[10px] bg-amber-400 text-slate-900 font-extrabold rounded-full animate-pulse">
            PEOPLE FINDER
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: SEARCH DECISION MAKERS / PEOPLE (HANAPIN ANG TAO)     */}
      {/* ============================================================== */}
      {mode === 'people' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-xl border border-indigo-800 text-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-800/80 border border-indigo-600/50 rounded-md text-[11px] text-indigo-200 font-medium mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Real Decision-Maker Intelligence Engine</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  Global Decision-Maker & Purchasing Hunter
                </h3>
                <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
                  Direktang hanapin ang mga totoong <strong>Purchasing Managers, Sourcing Directors, Brand Owners, Founders, at R&D Heads</strong> na may hawak ng OEM/ODM manufacturing contracts.
                </p>
              </div>

              <button
                onClick={onOpenManualModal}
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-800/60 hover:bg-indigo-700 border border-indigo-600 text-indigo-100 rounded-lg text-xs font-medium transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Add Contact Manually</span>
              </button>
            </div>

            {/* People Search Filter Form */}
            <form onSubmit={handlePeopleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white/10 p-4 rounded-xl border border-white/10">
              <div>
                <label className="block text-[11px] font-semibold text-indigo-200 mb-1">Target Decision-Maker Role</label>
                <select
                  value={personRole}
                  onChange={(e) => setPersonRole(e.target.value)}
                  className="w-full text-xs border border-indigo-300/30 rounded-lg p-2.5 bg-slate-900/90 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="All">All Sourcing & Decision-Maker Roles</option>
                  <option value="Purchasing / Procurement">Purchasing Manager / Procurement Head</option>
                  <option value="Founder / CEO">Brand Owner / Founder / Co-Founder / CEO</option>
                  <option value="R&D / Product Development">R&D Director / Formulation Chemist</option>
                  <option value="Supply Chain / Operations">Supply Chain Director / Operations Head</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-indigo-200 mb-1">Target Manufacturing Fit</label>
                <select
                  value={personIndustry}
                  onChange={(e) => setPersonIndustry(e.target.value)}
                  className="w-full text-xs border border-indigo-300/30 rounded-lg p-2.5 bg-slate-900/90 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="Cosmetics">Cosmetics & Skincare (OEM/ODM)</option>
                  <option value="Perfume">Perfume & Fragrances (OEM/ODM)</option>
                  <option value="Food Supplements">Food Supplements & Nutraceuticals</option>
                  <option value="Packaging Materials">Packaging Materials Supply & Bottles</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-indigo-200 mb-1">Target Priority Country</label>
                <select
                  value={personCountry}
                  onChange={(e) => setPersonCountry(e.target.value)}
                  className="w-full text-xs border border-indigo-300/30 rounded-lg p-2.5 bg-slate-900/90 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                >
                  <option value="Philippines">Philippines (Priority Domestic)</option>
                  <option value="United States">United States</option>
                  <option value="Japan">Japan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="China">China</option>
                  <option value="Australia">Australia</option>
                  <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="International">Any International Market</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  disabled={searching}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {searching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Hunting People...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Hunt Decision Makers</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* People Search Results */}
          {peopleResults && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Discovered Decision Makers ({peopleResults.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Traceable commercial decision makers, corporate executives, and procurement specialists.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {peopleResults.map((p) => {
                  const initials = p.fullName
                    ? p.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')
                    : 'DM';

                  return (
                    <div key={p.id} className="p-4 hover:bg-indigo-50/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{p.fullName}</span>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[11px] font-semibold border border-indigo-200">
                              {p.jobTitle}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-medium border border-emerald-200">
                              Verified Role
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-600 mt-1 flex-wrap">
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {p.companyName}
                            </span>

                            <span className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {p.country}
                            </span>

                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
                              {p.nkbServiceFit}
                            </span>
                          </div>

                          {p.bio && (
                            <p className="text-[11px] text-slate-500 mt-1.5 max-w-3xl line-clamp-2">
                              {p.bio}
                            </p>
                          )}

                          {/* Communication & Social Media Channels */}
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            {(p.whatsappUrl || p.whatsappNumber) && (
                              <a
                                href={p.whatsappUrl || `https://wa.me/${p.whatsappNumber.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-xs transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                                <span>WhatsApp: {p.whatsappNumber || 'Chat'}</span>
                              </a>
                            )}

                            {p.instagramUrl && (
                              <a
                                href={p.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md text-[11px] font-semibold hover:opacity-90 transition-opacity"
                              >
                                <span>Instagram</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}

                            {p.facebookUrl && (
                              <a
                                href={p.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-md text-[11px] font-semibold hover:bg-blue-700 transition-colors"
                              >
                                <span>Facebook</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}

                            {p.tiktokUrl && (
                              <a
                                href={p.tiktokUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-white rounded-md text-[11px] font-semibold hover:bg-slate-800 transition-colors"
                              >
                                <span>TikTok</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}

                            {p.businessEmail && (
                              <a
                                href={`mailto:${p.businessEmail}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-medium hover:bg-amber-100 transition-colors"
                              >
                                <Mail className="w-3 h-3 text-amber-600" />
                                <span>{p.businessEmail}</span>
                              </a>
                            )}

                            {p.linkedinUrl && (
                              <a
                                href={p.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-medium hover:bg-indigo-100 transition-colors"
                              >
                                <LinkIcon className="w-3 h-3 text-indigo-500" />
                                <span>LinkedIn / Evidence</span>
                              </a>
                            )}

                            {p.officialWebsite && (
                              <a
                                href={p.officialWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 font-mono text-[11px] ml-1"
                              >
                                <span>{p.officialWebsite.replace(/^https?:\/\//, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>

                          <div className="mt-1.5 text-[10px] text-slate-400 italic">
                            Source: {p.evidenceSource}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                        {p.isSaved ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Saved to Contacts & CRM</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSavePerson(p)}
                            disabled={savingPersonId === p.id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                          >
                            {savingPersonId === p.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Save to Contacts & CRM</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: SEARCH TARGET COMPANIES & COMMERCIAL BRANDS            */}
      {/* ============================================================== */}
      {mode === 'companies' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Global B2B Commercial Brand Discovery Engine</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Queries verified commercial registries, established beauty & health brands, and OEM/ODM buyers across priority international markets.
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
            <form onSubmit={handleCompanySearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Priority Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Philippines">Philippines (Domestic)</option>
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
                  <option value="Cosmetics">Cosmetics & Skincare (OEM/ODM)</option>
                  <option value="Perfume">Perfume & Fragrances (OEM/ODM)</option>
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
                >
                </input>
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
                      <span>Verifying Sources...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-amber-400" />
                      <span>Execute Brand Discovery</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

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
                  Discovered Commercial Entities ({searchSummary.companies.length})
                </h4>
                <span className="text-[11px] text-slate-400">All entities logged with verified source attribution</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Company / Brand</th>
                      <th className="py-3 px-4">Country & City</th>
                      <th className="py-3 px-4">Industry</th>
                      <th className="py-3 px-4">NKB Service Synergy</th>
                      <th className="py-3 px-4">Official Website</th>
                      <th className="py-3 px-4">Key Leadership / Products</th>
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
                            <div className="space-y-1">
                              <a
                                href={c.official_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-600 hover:text-amber-700 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                              >
                                <span>{c.domain || 'Visit Web'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              {(c.whatsapp_url || c.whatsapp_number) && (
                                <div>
                                  <a
                                    href={c.whatsapp_url || `https://wa.me/${c.whatsapp_number.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs"
                                    title={`Chat on WhatsApp: ${c.whatsapp_number || ''}`}
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>WhatsApp</span>
                                  </a>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {c.instagram_url && (
                                  <a href={c.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 text-[10px] font-semibold" title="Instagram">
                                    IG
                                  </a>
                                )}
                                {c.facebook_url && (
                                  <a href={c.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-[10px] font-semibold" title="Facebook">
                                    FB
                                  </a>
                                )}
                                {c.linkedin_url && (
                                  <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 text-[10px] font-semibold" title="LinkedIn">
                                    LI
                                  </a>
                                )}
                                {c.tiktok_url && (
                                  <a href={c.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-slate-800 hover:text-black text-[10px] font-semibold" title="TikTok">
                                    TT
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unavailable</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={c.products_summary || c.business_description}>
                          {c.products_summary || c.business_description}
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
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
