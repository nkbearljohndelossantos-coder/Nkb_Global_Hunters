import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, ExternalLink, ShieldCheck, Mail, Building2, UserPlus, Sparkles, Link as LinkIcon, Phone } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ContactStatusBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

export function ContactsView({ onSelectCompany, onNavigate }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.append('status', statusFilter);
      if (search) q.append('search', search);

      const res = await apiRequest(`/contacts?${q.toString()}`);
      setContacts(res.data || []);
    } catch (err) {
      console.error('[Fetch Contacts Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchContacts();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Hunt Action */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl border border-indigo-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Verified Decision-Maker Directory (Mga Tao & Purchasing Contacts)
            </h3>
          </div>
          <p className="text-xs text-indigo-200">
            Naka-record dito ang mga totoong <strong>Purchasing Managers, Sourcing Directors, Brand Owners, at Founders</strong> na na-save sa inyong CRM pipeline.
          </p>
        </div>

        <button
          onClick={() => onNavigate('finder', { mode: 'people' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md self-start md:self-center"
        >
          <Sparkles className="w-4 h-4" />
          <span>🎯 Hunt New Decision Makers (Maghanap ng Tao)</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts by name, role, email, or company..."
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

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="">All Verification Statuses</option>
            <option value="verified">Verified Contact</option>
            <option value="publicly_listed">Publicly Listed</option>
            <option value="unverified">Unverified</option>
            <option value="invalid">Invalid / Bounced</option>
            <option value="not_available">Not Available</option>
          </select>
        </div>
      </div>

      {contacts.length === 0 && !loading && (
        <EmptyState
          title="No Decision-Maker Contacts Discovered Yet"
          description="Sa ilalim ng ating Zero-Dummy-Data Policy, hindi tayo gumagawa ng pekeng contacts. Gamitin ang Decision-Maker Hunter para maghanap ng totoong Purchasing Managers, Brand Owners, at Buyers."
          actionLabel="🎯 Launch Decision-Maker Hunter Now"
          onAction={() => onNavigate('finder', { mode: 'people' })}
        />
      )}

      {contacts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Role / Department</th>
                  <th className="py-3 px-4">Company & Country</th>
                  <th className="py-3 px-4">Public Email / Profile</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Evidence Reference</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{c.full_name}</div>
                      {c.notes && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{c.notes}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{c.job_title}</div>
                      <span className="text-[11px] text-indigo-600 font-medium">{c.department || 'Procurement'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.company_name}</div>
                      <span className="text-[11px] text-slate-500">{c.primary_country} • {c.primary_industry}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        {(c.whatsapp_url || c.whatsapp_number) && (
                          <a
                            href={c.whatsapp_url || `https://wa.me/${c.whatsapp_number.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                            <span>WhatsApp: {c.whatsapp_number || 'Chat'}</span>
                          </a>
                        )}

                        {c.business_email ? (
                          <a href={`mailto:${c.business_email}`} className="text-amber-700 hover:underline flex items-center gap-1 font-mono text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{c.business_email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px] block">No direct email</span>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {c.linkedin_url && (
                            <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]">
                              <LinkIcon className="w-3 h-3" />
                              <span>LinkedIn</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}

                          {c.instagram_url && (
                            <a href={c.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline flex items-center gap-1 text-[11px]">
                              <span>Instagram</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}

                          {c.facebook_url && (
                            <a href={c.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]">
                              <span>Facebook</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}

                          {c.tiktok_url && (
                            <a href={c.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-slate-800 hover:underline flex items-center gap-1 text-[11px]">
                              <span>TikTok</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <ContactStatusBadge status={c.contact_status} />
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate" title={c.evidence_source}>
                      {c.evidence_source}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectCompany(c.company_id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded font-medium text-xs transition-colors"
                      >
                        Company
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
