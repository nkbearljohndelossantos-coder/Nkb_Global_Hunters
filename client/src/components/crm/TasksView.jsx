import React, { useState, useEffect } from 'react';
import { CheckSquare, PlusCircle, CheckCircle2, Clock, Building2 } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { EmptyState } from '../common/EmptyState';

export function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/crm/tasks');
      setTasks(res || []);
    } catch (err) {
      console.error('[Fetch Tasks Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/crm/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description, priority, dueDate })
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      await fetchTasks();
    } catch (err) {
      alert(`Task creation failed: ${err.message}`);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await apiRequest(`/crm/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      await fetchTasks();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            <span>Sales Tasks & Follow-up Cadences</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage discovery reviews, client outreach deadlines, and scheduled RFQ follow-ups.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>New Follow-up Task</span>
        </button>
      </div>

      {tasks.length === 0 && !loading && (
        <EmptyState
          title="No Pending Follow-ups or Tasks"
          description="Create follow-up action items to keep track of quotation deadlines and client inquiries."
          actionLabel="Create Follow-up Task"
          onAction={() => setShowModal(true)}
        />
      )}

      {tasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => handleToggleStatus(task)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <h5 className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </h5>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      task.priority === 'high'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : task.priority === 'medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.priority} Priority
                  </span>
                  {task.due_date && (
                    <span className="text-slate-400 text-[11px]">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Add New Sales Follow-up Task</h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on custom packaging sample prototype"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 bg-white"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details or action reminders..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 border rounded text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded text-xs font-semibold"
              >
                Save Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
