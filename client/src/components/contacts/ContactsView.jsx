import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, ExternalLink, ShieldCheck, Mail, Building2 } from 'lucide-react';
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
          description="In strict adherence to our anti-fabrication policy, contacts are never guessed or generated synthetically. They are discovered through official public channels, website mailto endpoints, or verified business records."
          actionLabel="Discover Target Companies"
          onAction={() => onNavigate('finder')}
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
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Public Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Evidence Reference</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.full_name}</td>
                    <td className="py-3 px-4">
                      <div>{c.job_title}</div>
                      <span className="text-[11px] text-slate-400">{c.department || 'Procurement'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{c.company_name}</div>
                      <span className="text-[11px] text-slate-400">{c.primary_country}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {c.business_email ? (
                        <a href={`mailto:${c.business_email}`} className="text-amber-700 hover:underline">
                          {c.business_email}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Not publicly listed</span>
                      )}
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
