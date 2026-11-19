import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { LoginView } from './components/auth/LoginView';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { DiscoveryView } from './components/discovery/DiscoveryView';
import { CompaniesView } from './components/intelligence/CompaniesView';
import { CompanyDetailDrawer } from './components/intelligence/CompanyDetailDrawer';
import { ManualCompanyModal } from './components/intelligence/ManualCompanyModal';
import { ProspectsView } from './components/qualification/ProspectsView';
import { ContactsView } from './components/contacts/ContactsView';
import { AgentsView } from './components/agents/AgentsView';
import { MarketView } from './components/market/MarketView';
import { CrmView } from './components/crm/CrmView';
import { OpportunitiesView } from './components/crm/OpportunitiesView';
import { ProposalsView } from './components/proposals/ProposalsView';
import { OutreachView } from './components/outreach/OutreachView';
import { ReportsView } from './components/reports/ReportsView';
import { TasksView } from './components/crm/TasksView';
import { SourcesView } from './components/admin/SourcesView';
import { UsersView } from './components/admin/UsersView';
import { SettingsView } from './components/admin/SettingsView';
import { AuditView } from './components/admin/AuditView';

export function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-amber-400 font-mono text-sm">
        Initializing NKB Global Hunter Enterprise Application...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} />;
      case 'finder':
        return (
          <DiscoveryView
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onOpenManualModal={() => setShowManualModal(true)}
          />
        );
      case 'intelligence':
        return (
          <CompaniesView
            key={refreshTrigger}
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onOpenManualModal={() => setShowManualModal(true)}
            onNavigate={setCurrentView}
          />
        );
      case 'prospects':
        return (
          <ProspectsView
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onNavigate={setCurrentView}
          />
        );
      case 'contacts':
        return (
          <ContactsView
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onNavigate={setCurrentView}
          />
        );
      case 'agents':
        return <AgentsView />;
      case 'market':
        return <MarketView onNavigate={setCurrentView} />;
      case 'pipeline':
        return (
          <CrmView
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onNavigate={setCurrentView}
          />
        );
      case 'opportunities':
        return (
          <OpportunitiesView
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            onNavigate={setCurrentView}
          />
        );
      case 'proposals':
        return <ProposalsView onNavigate={setCurrentView} />;
      case 'outreach':
        return <OutreachView onNavigate={setCurrentView} />;
      case 'reports':
        return <ReportsView />;
      case 'tasks':
        return <TasksView />;
      case 'sources':
        return <SourcesView />;
      case 'users':
        return <UsersView />;
      case 'settings':
        return <SettingsView />;
      case 'audit':
        return <AuditView />;
      default:
        return <DashboardView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          currentView={currentView}
          onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Selected Company Deep Inspection Drawer */}
      {selectedCompanyId && (
        <CompanyDetailDrawer
          companyId={selectedCompanyId}
          onClose={() => setSelectedCompanyId(null)}
          onRefreshList={() => setRefreshTrigger((prev) => prev + 1)}
          onNavigate={setCurrentView}
        />
      )}

      {/* Manual Company Entry Modal */}
      <ManualCompanyModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
