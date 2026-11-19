import React, { useState } from 'react';
import { Building2, ShieldCheck, X } from 'lucide-react';
import { apiRequest } from '../../services/api';

export function ManualCompanyModal({ isOpen, onClose, onSuccess }) {
  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [officialWebsite, setOfficialWebsite] = useState('');
  const [primaryCountry, setPrimaryCountry] = useState('Philippines');
  const [primaryCity, setPrimaryCity] = useState('');
  const [primaryIndustry, setPrimaryIndustry] = useState('Cosmetics');
  const [businessType, setBusinessType] = useState('Brand Owner');
  const [businessDescription, setBusinessDescription] = useState('');
  const [nkbServiceFit, setNkbServiceFit] = useState('Cosmetics OEM/ODM');
  const [sourceAttribution, setSourceAttribution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!legalName || !primaryCountry || !primaryIndustry || !sourceAttribution) {
      alert('Company Name, Country, Industry, and Source Attribution are mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/companies', {
        method: 'POST',
        body: JSON.stringify({
          legalName,
          tradingName,
          officialWebsite,
          primaryCountry,
          primaryCity,
          primaryIndustry,
          businessType,
          businessDescription,
          nkbServiceFit,
          sourceAttribution
        })
      });
      onSuccess();
      onClose();
      alert('Verified company successfully recorded and scored.');
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <h4 className="font-bold text-slate-900 text-sm">Add Verified Company Manually</h4>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Zero-Dummy-Data Requirement: Only authentic, verifiable companies with traceable sources may be entered.</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Legal Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Skincare Laboratories Corp."
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Trading Name (DBA)</label>
              <input
                type="text"
                placeholder="e.g. Apex Beauty"
                value={tradingName}
                onChange={(e) => setTradingName(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Official Website</label>
              <input
                type="text"
                placeholder="e.g. https://apexbeauty.com"
                value={officialWebsite}
                onChange={(e) => setOfficialWebsite(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Priority Country *</label>
              <select
                value={primaryCountry}
                onChange={(e) => setPrimaryCountry(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
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
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">City / Location</label>
              <input
                type="text"
                placeholder="e.g. Manila, Tokyo, Los Angeles"
                value={primaryCity}
                onChange={(e) => setPrimaryCity(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Manufacturing Industry *</label>
              <select
                value={primaryIndustry}
                onChange={(e) => setPrimaryIndustry(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="Cosmetics">Cosmetics & Beauty</option>
                <option value="Perfume">Perfume & Fragrance</option>
                <option value="Food Supplements">Food Supplements</option>
                <option value="Packaging Materials">Packaging Supply</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Business Classification</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="Brand Owner">Brand Owner</option>
                <option value="Distributor">Distributor / Importer</option>
                <option value="Retail Chain">Retail Chain</option>
                <option value="OEM Buyer">OEM/ODM Buyer</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">NKB Manufacturing Synergy</label>
              <select
                value={nkbServiceFit}
                onChange={(e) => setNkbServiceFit(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="Cosmetics OEM/ODM">Cosmetics OEM/ODM</option>
                <option value="Perfume OEM/ODM">Perfume OEM/ODM</option>
                <option value="Food Supplements OEM/ODM">Food Supplements OEM/ODM</option>
                <option value="Packaging Supply">Packaging Supply</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Business & Product Summary</label>
            <textarea
              rows={2}
              placeholder="Description of existing product line and manufacturing needs..."
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Source Attribution (Traceability Mandatory) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cosmoprof Asia 2026 Directory, DTI Registered Brand, Verified Customer Inquiry"
              value={sourceAttribution}
              onChange={(e) => setSourceAttribution(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 font-mono"
            />
          </div>
        </div>

        <div className="pt-3 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border rounded text-slate-700 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded text-xs font-semibold shadow-sm"
          >
            Save & Score Prospect
          </button>
        </div>
      </form>
    </div>
  );
}
