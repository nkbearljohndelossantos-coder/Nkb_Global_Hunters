import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Clock } from 'lucide-react';
import { apiRequest } from '../../services/api';

export function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/audit?limit=50');
      setLogs(res.data || []);
    } catch (err) {
      console.error('[Fetch Audit Logs Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <span>Immutable System Audit Trail</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Every critical business action, qualification rescore, stage progression, user authorization, and proposal change is logged with cryptographic timestamps.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 capitalize">{log.entity_type}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {log.full_name || log.username || 'System Engine'}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.ip_address || 'Internal'}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {log.details && (
                      <button
                        onClick={() => setSelectedDetails(log.details)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-mono text-slate-700"
                      >
                        Inspect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-slate-900 text-sm">Audit Payload Details</h4>
              <button onClick={() => setSelectedDetails(null)} className="text-slate-400">✕</button>
            </div>
            <pre className="p-3 bg-slate-900 text-amber-300 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(selectedDetails), null, 2);
                } catch (e) {
                  return selectedDetails;
                }
              })()}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDetails(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
