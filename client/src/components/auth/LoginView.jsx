import React, { useState } from 'react';
import { Globe, Lock, Mail, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@nkb-hunter.local');
  const [password, setPassword] = useState('Admin@NKB2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nkb-dark flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-white">
      <div className="max-w-md w-full space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-nkb-navyLight to-nkb-navy border border-amber-500/40 items-center justify-center shadow-2xl mb-2">
            <Globe className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white uppercase font-mono">
            NKB GLOBAL HUNTER
          </h1>
          <p className="text-xs text-amber-400 font-semibold tracking-wide uppercase">
            AI-Powered Global B2B Client Acquisition & Sales Intelligence
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Enterprise Sign In</span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Dummy-Data Staging</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Corporate Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@nkb-hunter.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Account Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Access Enterprise Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Credentials Helper Note */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-amber-400 block">Initial Staging Credentials:</span>
            <div className="font-mono text-slate-300">Email: admin@nkb-hunter.local</div>
            <div className="font-mono text-slate-300">Password: Admin@NKB2026!</div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 font-medium">
          NKB Manufacturing Enterprise Intelligence &bull; Strictly Confidential
        </p>
      </div>
    </div>
  );
}
