import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { WorkersView } from './components/WorkersView';
import { ProductionView } from './components/ProductionView';
import { ReportsView } from './components/ReportsView';
import { BranchesView } from './components/BranchesView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsModal } from './components/SettingsModal';
import { CalendarView } from './components/CalendarView';

function MainLayout() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    // Viewport-Fit Screen Container: No whole-page vertical bouncy scroll
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col font-sans">
      {/* Top Header (Pinned) */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Tab Navigation (Pinned) */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Internal Scrollable Content Viewport */}
      <main className="flex-1 min-h-0 overflow-y-auto max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 pb-20 md:pb-4">
        {currentTab === 'dashboard' && <DashboardView onNavigate={setCurrentTab} />}
        {currentTab === 'calendar' && <CalendarView onNavigate={setCurrentTab} />}
        {currentTab === 'workers' && <WorkersView />}
        {currentTab === 'production' && <ProductionView onNavigate={setCurrentTab} />}
        {currentTab === 'reports' && <ReportsView />}
        {currentTab === 'branches' && <BranchesView />}
        {currentTab === 'audit' && <AuditLogView />}
      </main>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
