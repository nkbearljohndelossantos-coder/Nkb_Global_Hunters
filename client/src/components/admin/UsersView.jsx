import React, { useState, useEffect } from 'react';
import { UserCheck, PlusCircle, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function UsersView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('role_sales_staff');

  const fetchUsersAndRoles = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        apiRequest('/users'),
        apiRequest('/users/roles')
      ]);
      setUsers(uRes || []);
      setRoles(rRes || []);
    } catch (err) {
      console.error('[Fetch Users Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ username, fullName, email, password, roleId })
      });
      setShowModal(false);
      setUsername('');
      setFullName('');
      setEmail('');
      setPassword('');
      await fetchUsersAndRoles();
      alert('User created successfully.');
    } catch (err) {
      alert(`User creation failed: ${err.message}`);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.is_active === 1 ? false : true;
    try {
      await apiRequest(`/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus })
      });
      await fetchUsersAndRoles();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const isAdmin = currentUser?.roleId === 'role_admin' || currentUser?.roleName === 'Administrator';

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-500" />
            <span>Enterprise User Management & Role-Based Access Control</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized internal personnel, assign role privileges, and enforce authentication security.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-nkb-navy hover:bg-nkb-navyLight text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Create User Account</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Full Name & Username</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Login</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {u.full_name}
                    <span className="block text-[11px] text-slate-400 font-mono font-normal">@{u.username}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-xs border border-slate-200">
                      {u.role_name}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {u.is_active === 1 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Deactivated</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold ${
                            u.is_active === 1
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.is_active === 1 ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Add New Team Member</h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. msantos"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maria@nkb-manufacturing.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Secure 8+ character password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Role & Authorization Level *</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description}
                    </option>
                  ))}
                </select>
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
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
