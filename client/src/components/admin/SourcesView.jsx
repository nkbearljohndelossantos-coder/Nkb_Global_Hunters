import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, Key, ExternalLink, Settings } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function SourcesView() {
  const { user } = useAuth();
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configuringSource, setConfiguringSource] = useState(null);
  const [apiKey, setApiKey] = useState('');

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/sources');
      setSources(res || []);
    } catch (err) {
      console.error('[Fetch Sources Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!configuringSource?.connector_id) return;
    try {
      await apiRequest(`/sources/connectors/${configuringSource.connector_id}`, {
        method: 'POST',
        body: JSON.stringify({
          authConfig: { apiKey },
          status: 'active'
        })
      });
      setConfiguringSource(null);
      setApiKey('');
      await fetchSources();
      alert('Data source connector configured successfully.');
    } catch (err) {
      alert(`Configuration error: ${err.message}`);
    }
  };

  const isAdmin = user?.roleId === 'role_admin' || user?.roleName === 'Administrator';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-500" />
          <span>Research Data Sources & Connector Architecture</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Each external data connector enforces rate limits, error logging, and source attribution. Free public sources are prioritized by default.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => {
          const isActive = src.connector_status === 'active';
          return (
            <div key={src.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-sm text-slate-900 block">{src.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">Code: {src.code}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  <span className="capitalize">{src.connector_status || 'Inactive'}</span>
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>Category: <span className="font-medium capitalize text-slate-800">{src.category.replace('_', ' ')}</span></div>
                <div>Rate Limit: <span className="font-mono text-slate-800">{src.rate_limit_per_minute} req/min</span></div>
                {src.documentation_url && (
                  <div>
                    <a
                      href={src.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>Documentation / Registry Reference</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Requests logged: {src.requests_count || 0}
                </span>
                {src.requires_auth === 1 && isAdmin && (
                  <button
                    onClick={() => {
                      setConfiguringSource(src);
                      setApiKey('');
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Key className="w-3 h-3 text-slate-500" />
                    <span>Configure Credentials</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Credential Modal */}
      {configuringSource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveConfig} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">
              Configure {configuringSource.name}
            </h4>
            <p className="text-xs text-slate-500">
              Credentials are securely stored in the database. Never hardcoded into application source files.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Provider API Key / Bearer Token *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter API Key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfiguringSource(null)}
                className="px-3 py-1.5 border rounded text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded text-xs font-semibold"
              >
                Save & Activate Connector
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
