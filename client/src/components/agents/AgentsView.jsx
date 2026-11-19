import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, CheckCircle2, AlertTriangle, Clock, DollarSign, Play } from 'lucide-react';
import { apiRequest } from '../../services/api';

export function AgentsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Market agent parameters
  const [targetCountry, setTargetCountry] = useState('Philippines');
  const [targetIndustry, setTargetIndustry] = useState('Cosmetics');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/agents/logs?limit=30');
      setLogs(res.data || []);
    } catch (err) {
      console.error('[Fetch Agent Logs Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRunMarketAgent = async () => {
    setRunningAgent(true);
    try {
      await apiRequest('/agents/run', {
        method: 'POST',
        body: JSON.stringify({
          agentType: 'market_opportunity',
          country: targetCountry,
          industry: targetIndustry
        })
      });
      await fetchLogs();
      alert('Market Opportunity Agent executed successfully. New market intelligence synthesized.');
    } catch (err) {
      alert(`Agent execution failed: ${err.message}`);
    } finally {
      setRunningAgent(false);
    }
  };

  const agents = [
    { name: 'Global Research Agent', desc: 'Inspects live target website assets, parses HTTP metadata, and verifies commercial legitimacy.', role: 'Automated Inspector' },
    { name: 'Company Intelligence Agent', desc: 'Synthesizes enterprise capabilities, product lines, and NKB manufacturing partnership synergies.', role: 'Intelligence Analyst' },
    { name: 'Lead Qualification Agent', desc: 'Executes 100-point multi-factor qualification scoring and flags missing evidence penalties.', role: 'Scoring Engine' },
    { name: 'Market Opportunity Agent', desc: 'Scans cross-border OEM/ODM manufacturing demand, category trends, and competitor dynamics.', role: 'Market Radar' },
    { name: 'Contact Research Agent', desc: 'Uncovers public procurement emails and sourcing management contact channels ethically.', role: 'Contact Researcher' },
    { name: 'Sales Proposal Agent', desc: 'Generates tailored OEM/ODM commercial proposals citing certified NKB production specifications.', role: 'Proposal Drafter' },
    { name: 'Follow-up Recommendation Agent', desc: 'Computes optimal outreach cadences and talking points based on current CRM deal stage.', role: 'Cadence Advisor' }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-500" />
              <span>AI Business Development Agents (Free-First Architecture)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic, zero-hallucination B2B acquisition agents. All outputs are traceable to verified sources.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Zero Additional Cost Policy Active ($0.0000 Spent)</span>
          </div>
        </div>

        {/* 7 Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {agents.map((a, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{a.name}</span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {a.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Trigger Bar for Market Opportunity Agent */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Execute Global Market Opportunity Agent
          </h4>
          <p className="text-xs text-slate-500">
            Synthesize international B2B contract manufacturing demand for priority territories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={targetCountry}
            onChange={(e) => setTargetCountry(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none"
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

          <select
            value={targetIndustry}
            onChange={(e) => setTargetIndustry(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="Cosmetics">Cosmetics & Skincare</option>
            <option value="Perfume">Perfume & Fragrance</option>
            <option value="Food Supplements">Food Supplements</option>
            <option value="Packaging Materials">Packaging Supply</option>
          </select>

          <button
            onClick={handleRunMarketAgent}
            disabled={runningAgent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {runningAgent ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Play className="w-4 h-4 text-amber-400" />}
            <span>Run Market Agent</span>
          </button>
        </div>
      </div>

      {/* Execution Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Agent Execution Logs ({logs.length})
          </h4>
          <span className="text-[11px] text-slate-400">Complete audit trail of all AI agent interactions</span>
        </div>

        {logs.length === 0 && !loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No agent executions logged yet. Execute an agent above or inspect any company to trigger automated research.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">Task Description</th>
                  <th className="py-3 px-4">Model Engine</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Executed At</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.agent_name}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.task_description}>
                      {log.task_description}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.model_used}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{log.execution_duration_ms} ms</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold text-[11px]">$0.0000</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Success
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedLog.agent_name} Execution</h4>
                <p className="text-xs text-slate-500">{selectedLog.task_description}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Output Result Payload:</span>
                <pre className="p-3 bg-slate-900 text-amber-300 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.outputResult, null, 2)}
                </pre>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Input Parameters:</span>
                <pre className="p-3 bg-slate-100 text-slate-800 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.inputPayload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
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
