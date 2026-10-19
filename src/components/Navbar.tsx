import React from 'react';
import { LayoutDashboard, Calendar, Users, ClipboardList, FileSpreadsheet, Building2, ShieldAlert } from 'lucide-react';

export type TabType = 'dashboard' | 'calendar' | 'production' | 'workers' | 'reports' | 'branches' | 'audit';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar' as TabType, label: 'Calendario', icon: Calendar },
    { id: 'production' as TabType, label: 'Asistencia', icon: ClipboardList },
    { id: 'workers' as TabType, label: 'Trabajadores', icon: Users },
    { id: 'reports' as TabType, label: 'Informes', icon: FileSpreadsheet },
    { id: 'branches' as TabType, label: 'Faenas', icon: Building2 },
    { id: 'audit' as TabType, label: 'Bitácora', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Desktop / Tablet Sub-Header Navigation */}
      <nav className="no-print bg-white border-b border-slate-200 hidden md:block shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Thumb Friendly >= 44px) */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe">
        <div className="grid grid-cols-7 h-16">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
                  isActive ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1 rounded-full transition-transform ${
                    isActive ? 'bg-emerald-50 scale-105' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold tracking-tight truncate max-w-full px-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
