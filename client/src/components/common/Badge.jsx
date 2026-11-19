import React from 'react';

export function TierBadge({ tier }) {
  const styles = {
    A: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    B: 'bg-blue-100 text-blue-800 border-blue-300 font-semibold',
    C: 'bg-amber-100 text-amber-800 border-amber-300',
    D: 'bg-slate-100 text-slate-700 border-slate-300'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${styles[tier] || styles.D}`}>
      Tier {tier || 'D'}
    </span>
  );
}

export function VerificationBadge({ status }) {
  const map = {
    verified: { label: 'Verified Entity', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pending_research: { label: 'Researching', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    unverified: { label: 'Unverified', style: 'bg-slate-100 text-slate-700 border-slate-200' },
    disqualified: { label: 'Disqualified', style: 'bg-rose-50 text-rose-700 border-rose-200' }
  };

  const item = map[status] || map.unverified;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${item.style}`}>
      {item.label}
    </span>
  );
}

export function ContactStatusBadge({ status }) {
  const map = {
    verified: { label: 'Verified Contact', style: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    publicly_listed: { label: 'Publicly Listed', style: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    unverified: { label: 'Unverified', style: 'bg-slate-100 text-slate-700 border-slate-300' },
    invalid: { label: 'Invalid / Bounced', style: 'bg-rose-100 text-rose-800 border-rose-300' },
    not_available: { label: 'Not Available', style: 'bg-slate-100 text-slate-500 border-slate-200' }
  };

  const item = map[status] || map.unverified;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${item.style}`}>
      {item.label}
    </span>
  );
}

export function StageBadge({ stage }) {
  const friendlyNames = {
    new_prospect: 'New Prospect',
    researching: 'Researching',
    qualified: 'Qualified',
    contact_identified: 'Contact Identified',
    ready_for_outreach: 'Ready For Outreach',
    contacted: 'Contacted',
    interested: 'Interested',
    meeting_scheduled: 'Meeting Scheduled',
    rfq_received: 'RFQ Received',
    quotation_submitted: 'Quotation Submitted',
    negotiation: 'Negotiation',
    contract_won: 'Contract Won',
    lost: 'Lost',
    disqualified: 'Disqualified'
  };

  const isWon = stage === 'contract_won';
  const isLost = stage === 'lost' || stage === 'disqualified';
  const isHot = ['negotiation', 'rfq_received', 'meeting_scheduled'].includes(stage);

  let style = 'bg-slate-100 text-slate-800 border-slate-200';
  if (isWon) style = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
  else if (isLost) style = 'bg-rose-100 text-rose-800 border-rose-300';
  else if (isHot) style = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
  else if (stage === 'qualified') style = 'bg-blue-100 text-blue-800 border-blue-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${style}`}>
      {friendlyNames[stage] || stage}
    </span>
  );
}
