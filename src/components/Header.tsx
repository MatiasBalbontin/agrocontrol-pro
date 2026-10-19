import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Settings, ChevronDown, Check } from 'lucide-react';
import { PlantLogo } from './PlantLogo';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const {
    branches,
    workers,
    activeBranchId,
    setActiveBranchId,
    settings,
  } = useApp();

  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeBranch = branches.find(b => b.id === activeBranchId);
  const activeBranchName =
    activeBranchId === 'ALL'
      ? 'Todas las Faenas'
      : activeBranch?.name || 'Seleccionar Faena';

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <PlantLogo className="w-10 h-10" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-sm" title={settings.companyName}>
                {settings.companyName || 'Mi Empresa'}
              </span>
              <span className="hidden md:inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                Gestión Laboral
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              RUT: {settings.companyRut || '76.890.123-K'}
            </p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Custom Styled Branch Dropdown (Matches App UI) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition-all ${
                isBranchDropdownOpen
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
              title="Cambiar faena activa"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-left max-w-[130px] sm:max-w-[220px]">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-normal leading-tight">
                  Faena
                </span>
                <span className="truncate block leading-tight text-slate-900 font-bold">
                  {activeBranchName}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isBranchDropdownOpen ? 'rotate-180 text-emerald-700' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Popover */}
            {isBranchDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Seleccionar Faena</span>
                  <span className="font-mono">{branches.length} activas</span>
                </div>

                <div className="p-1 space-y-1 max-h-72 overflow-y-auto">
                  {/* Option: Consolidado Global */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveBranchId('ALL');
                      setIsBranchDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-lg text-left transition-colors flex items-center justify-between text-xs ${
                      activeBranchId === 'ALL'
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        🌐
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Todas las Faenas</div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          Consolidado general de todas las faenas
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {workers.filter(w => w.status === 'ACTIVO').length} activos
                      </span>
                      {activeBranchId === 'ALL' && (
                        <Check className="w-4 h-4 text-emerald-700" />
                      )}
                    </div>
                  </button>

                  {/* Individual Branches List */}
                  {branches.map(b => {
                    const isSelected = activeBranchId === b.id;
                    const branchWorkersCount = workers.filter(
                      w => w.branchId === b.id && w.status === 'ACTIVO'
                    ).length;

                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setActiveBranchId(b.id);
                          setIsBranchDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-lg text-left transition-colors flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected
                                ? 'bg-emerald-800 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{b.name}</div>
                            <div className="text-[11px] text-slate-500 font-normal truncate">
                              Encargado: {b.manager}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {branchWorkersCount} activos
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Configuration Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            title="Configuración, Empresa y Respaldos"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
