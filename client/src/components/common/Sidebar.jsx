import React from 'react';
import {
  LayoutDashboard,
  Globe,
  Building2,
  Award,
  Users,
  Bot,
  TrendingUp,
  GitBranch,
  Briefcase,
  FileText,
  Mail,
  BarChart3,
  CheckSquare,
  Database,
  UserCheck,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'finder', label: 'Global Company Finder', icon: Globe },
  { id: 'intelligence', label: 'Company Intelligence', icon: Building2 },
  { id: 'prospects', label: 'Enterprise Prospects', icon: Award },
  { id: 'contacts', label: 'Contact Discovery', icon: Users },
  { id: 'agents', label: 'AI Research Agents', icon: Bot },
  { id: 'market', label: 'Market Intelligence', icon: TrendingUp },
  { id: 'pipeline', label: 'CRM Pipeline', icon: GitBranch },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'proposals', label: 'Proposals', icon: FileText },
  { id: 'outreach', label: 'Outreach Center', icon: Mail },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'tasks', label: 'Tasks & Follow-ups', icon: CheckSquare },
  { id: 'sources', label: 'Data Sources', icon: Database },
  { id: 'users', label: 'User Management', icon: UserCheck },
  { id: 'settings', label: 'System Settings', icon: Settings },
  { id: 'audit', label: 'Audit Logs', icon: ShieldAlert }
];

export function Sidebar({ currentView, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-nkb-dark text-slate-300 flex flex-col h-screen select-none border-r border-slate-800 flex-shrink-0">
      {/* Branding Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nkb-navyLight to-nkb-navy border border-amber-500/40 flex items-center justify-center shadow-inner">
          <Globe className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wider text-white uppercase font-mono">NKB GLOBAL HUNTER</h1>
          <p className="text-[10px] text-amber-400/90 tracking-wide font-medium">B2B Manufacturing Acquisition</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 text-xs">
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
          Enterprise Modules
        </div>
        {NAVIGATION_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-left ${
                isActive
                  ? 'bg-nkb-navyLight text-amber-300 font-semibold shadow-sm border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400/80" />}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Principal Administrator'}</p>
            <p className="text-[10px] text-amber-400 truncate">{user?.roleName || 'Administrator'}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
