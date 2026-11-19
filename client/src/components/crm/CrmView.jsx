import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Kanban,
  List,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { StageBadge, TierBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

const PIPELINE_COLUMNS = [
  { id: 'new_prospect', label: 'New Prospect' },
  { id: 'researching', label: 'Researching' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'contact_identified', label: 'Contact Identified' },
  { id: 'ready_for_outreach', label: 'Ready for Outreach' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'interested', label: 'Interested' },
  { id: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { id: 'rfq_received', label: 'RFQ Received' },
  { id: 'quotation_submitted', label: 'Quotation Submitted' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'contract_won', label: 'Contract Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'disqualified', label: 'Disqualified' }
];

export function CrmView({ onSelectCompany, onNavigate }) {
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [movingOpp, setMovingOpp] = useState(null);
  const [targetStage, setTargetStage] = useState('');
  const [transitionNote, setTransitionNote] = useState('');

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/crm/pipeline');
      setPipelineData(res);
    } catch (err) {
      console.error('[CRM Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleStageTransition = async () => {
    if (!movingOpp || !targetStage) return;
    try {
      await apiRequest(`/crm/opportunities/${movingOpp.id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({
          stage: targetStage,
          note: transitionNote || `Transitioned to ${targetStage}`
        })
      });
      setMovingOpp(null);
      setTargetStage('');
      setTransitionNote('');
      await fetchPipeline();
    } catch (err) {
      alert(`Stage transition failed: ${err.message}`);
    }
  };

  const board = pipelineData?.board || {};
  const totalOpps = pipelineData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header and Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-amber-500" />
            <span>Enterprise B2B Sales Pipeline ({totalOpps} Deals)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            14-Stage manufacturing acquisition pipeline with immutable transition audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List Table</span>
          </button>
        </div>
      </div>

      {totalOpps === 0 && !loading && (
        <EmptyState
          title="No Active Sales Pipeline Opportunities"
          description="Opportunities are automatically generated when genuine companies are discovered and qualified. Launch company discovery to populate your sales pipeline."
          actionLabel="Run Company Discovery"
          onAction={() => onNavigate('finder')}
        />
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && totalOpps > 0 && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {PIPELINE_COLUMNS.map((col) => {
              const items = board[col.id] || [];
              const isWon = col.id === 'contract_won';
              const isLost = col.id === 'lost' || col.id === 'disqualified';

              return (
                <div
                  key={col.id}
                  className={`w-72 flex flex-col rounded-xl border p-3 flex-shrink-0 ${
                    isWon
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : isLost
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-slate-100/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {items.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                    {items.map((opp) => (
                      <div
                        key={opp.id}
                        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm hover:border-amber-400 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <span
                            onClick={() => onSelectCompany(opp.company_id)}
                            className="font-bold text-xs text-slate-900 hover:text-amber-700 cursor-pointer"
                          >
                            {opp.company_name}
                          </span>
                          {opp.priority_tier && <TierBadge tier={opp.priority_tier} />}
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium">
                          {opp.primary_country} • {opp.primary_industry}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setMovingOpp(opp);
                              setTargetStage(opp.pipeline_stage);
                            }}
                            className="text-[11px] font-semibold text-amber-700 hover:underline flex items-center gap-0.5"
                          >
                            <span>Move Stage</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Win: {opp.win_probability}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STAGE TRANSITION MODAL */}
      {movingOpp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">
              Advance Stage: {movingOpp.company_name}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Pipeline Stage</label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
              >
                {PIPELINE_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Transition Note / Justification (Audit Trail)
              </label>
              <textarea
                rows={3}
                placeholder="Document meeting notes, RFQ submission details, or decision reason..."
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setMovingOpp(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStageTransition}
                className="px-4 py-1.5 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-semibold"
              >
                Confirm Stage Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
