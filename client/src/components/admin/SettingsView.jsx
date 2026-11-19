import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldAlert, Award, Sliders } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function SettingsView() {
  const { user } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scoring Weights State
  const [industryFit, setIndustryFit] = useState(25);
  const [serviceFit, setServiceFit] = useState(25);
  const [purchasingPotential, setPurchasingPotential] = useState(20);
  const [legitimacy, setLegitimacy] = useState(15);
  const [buyingSignals, setBuyingSignals] = useState(15);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/settings');
      setSettings(res || []);

      res.forEach(s => {
        const v = parseInt(s.value, 10);
        if (!isNaN(v)) {
          if (s.key === 'scoring_weight_industry_fit') setIndustryFit(v);
          if (s.key === 'scoring_weight_service_fit') setServiceFit(v);
          if (s.key === 'scoring_weight_purchasing_potential') setPurchasingPotential(v);
          if (s.key === 'scoring_weight_legitimacy') setLegitimacy(v);
          if (s.key === 'scoring_weight_buying_signals') setBuyingSignals(v);
        }
      });
    } catch (err) {
      console.error('[Fetch Settings Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const totalPoints = industryFit + serviceFit + purchasingPotential + legitimacy + buyingSignals;

  const handleSaveWeights = async (e) => {
    e.preventDefault();
    if (totalPoints !== 100) {
      alert(`Scoring weights must sum exactly to 100 points. Current sum: ${totalPoints} points.`);
      return;
    }
    try {
      await apiRequest('/qualification/weights', {
        method: 'POST',
        body: JSON.stringify({
          weights: { industryFit, serviceFit, purchasingPotential, legitimacy, buyingSignals }
        })
      });
      await fetchSettings();
      alert('100-Point Scoring Model weights successfully updated.');
    } catch (err) {
      alert(`Failed to save weights: ${err.message}`);
    }
  };

  const isAdmin = user?.roleId === 'role_admin' || user?.roleName === 'Administrator';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500" />
          <span>System Settings & Configurable Scoring Engine</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Tune the multi-dimensional B2B qualification weights and verify enterprise operational parameters.
        </p>
      </div>

      {/* 100-Point Scoring Weights Card */}
      <form onSubmit={handleSaveWeights} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-800">100-Point Lead Qualification Model Weights</h4>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              totalPoints === 100
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            Total: {totalPoints} / 100 pts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              1. Industry Alignment Fit (Cosmetics, Perfume, Supplements, Packaging)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="40"
                value={industryFit}
                onChange={(e) => setIndustryFit(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-500"
                disabled={!isAdmin}
              />
              <span className="w-12 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-center">
                {industryFit} pts
              </span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              2. NKB Manufacturing Service Synergy (OEM/ODM Capability Fit)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="40"
                value={serviceFit}
                onChange={(e) => setServiceFit(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-500"
                disabled={!isAdmin}
              />
              <span className="w-12 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-center">
                {serviceFit} pts
              </span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              3. Purchasing Potential & Commercial Scale (Recurring Batch Demand)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="35"
                value={purchasingPotential}
                onChange={(e) => setPurchasingPotential(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-500"
                disabled={!isAdmin}
              />
              <span className="w-12 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-center">
                {purchasingPotential} pts
              </span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              4. Business Legitimacy & Evidence Quality (Domain & Registry Verification)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="25"
                value={legitimacy}
                onChange={(e) => setLegitimacy(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-500"
                disabled={!isAdmin}
              />
              <span className="w-12 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-center">
                {legitimacy} pts
              </span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              5. Relevant Buying Signals & Sourcing Needs (Contact Discovery & Signals)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="25"
                value={buyingSignals}
                onChange={(e) => setBuyingSignals(parseInt(e.target.value, 10))}
                className="flex-1 accent-amber-500"
                disabled={!isAdmin}
              />
              <span className="w-12 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-center">
                {buyingSignals} pts
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={totalPoints !== 100}
              className="inline-flex items-center gap-2 px-4 py-2 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Save Scoring Configuration</span>
            </button>
          </div>
        )}
      </form>

      {/* General Settings List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
          Enterprise Parameters & Policies
        </h4>

        <div className="divide-y divide-slate-100 text-xs">
          {settings.filter(s => !s.key.startsWith('scoring_weight_')).map((s) => (
            <div key={s.key} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block font-mono text-[11px]">{s.key}</span>
                <span className="text-slate-500 text-[11px]">{s.description}</span>
              </div>
              <span className="font-mono text-slate-800 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
