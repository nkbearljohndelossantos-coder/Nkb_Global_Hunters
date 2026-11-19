import React from 'react';
import { Database, Search, PlusCircle, ShieldCheck } from 'lucide-react';

export function EmptyState({
  title = 'No verified records found',
  description = 'In compliance with our Zero-Dummy-Data policy, production records only populate from verified registry sources or authentic market discoveries.',
  actionLabel,
  onAction,
  icon: Icon = Database
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-300 rounded-xl my-6 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
        <Icon className="w-7 h-7 text-nkb-navy" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Search className="w-4 h-4 text-amber-400" />
          {actionLabel}
        </button>
      )}
      <div className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Zero-Dummy-Data Policy Active & Verified</span>
      </div>
    </div>
  );
}
