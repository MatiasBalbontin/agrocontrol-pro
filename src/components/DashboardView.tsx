import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from './Navbar';
import {
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  UserPlus,
  UserMinus,
  ArrowRight,
  ClipboardList,
  Building2,
  DollarSign,
  TrendingUp,
  FileCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  formatCLP,
  formatQuantity,
  formatDate,
  getTodayDateString,
  getDateDaysAgo,
} from '../utils/formatters';

interface DashboardViewProps {
  onNavigate: (tab: TabType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { workers, branches, production, movements, activeBranchId, settings, getWorkerContractStatus } = useApp();

  const today = getTodayDateString();
  const sevenDaysAgo = getDateDaysAgo(7);

  const [attendanceTab, setAttendanceTab] = useState<'present' | 'absent'>('present');

  // Filter workers according to active branch
  const filteredWorkers =
    activeBranchId === 'ALL'
      ? workers
      : workers.filter(w => w.branchId === activeBranchId);

  const activeWorkers = filteredWorkers.filter(w => w.status === 'ACTIVO');

  // Workers with missing or expired contracts
  const contractAlertWorkers = activeWorkers.filter(w => {
    const status = getWorkerContractStatus(w);
    return status.status === 'NO_CONTRACT' || status.status === 'EXPIRED';
  });

  // Filter production records for today
  const filteredProductionToday = production.filter(p => {
    const matchDate = p.date === today;
    const matchBranch = activeBranchId === 'ALL' || p.branchId === activeBranchId;
    return matchDate && matchBranch;
  });

  // Set of worker IDs who attended today (quantity > 0)
  const attendedWorkerIds = new Set(
    filteredProductionToday.filter(p => p.quantity > 0).map(p => p.workerId)
  );

  // Present workers today
  const presentWorkers = activeWorkers.filter(w => attendedWorkerIds.has(w.id));
  // Absent workers today
  const absentWorkers = activeWorkers.filter(w => !attendedWorkerIds.has(w.id));

  const totalJornadasToday = filteredProductionToday
    .filter(p => p.paymentMode === 'DÍA')
    .reduce((sum, p) => sum + p.quantity, 0);

  const totalKilosToday = filteredProductionToday
    .filter(p => p.paymentMode === 'KILO')
    .reduce((sum, p) => sum + p.quantity, 0);

  const totalMontoToday = filteredProductionToday.reduce(
    (sum, p) => sum + p.totalCalculated,
    0
  );

  // Movements in the last 7 days
  const recentMovements = movements.filter(m => {
    const matchBranch = activeBranchId === 'ALL' || m.branchId === activeBranchId;
    return matchBranch && m.date >= sevenDaysAgo;
  });

  const incorporationsWeek = recentMovements.filter(
    m => m.type === 'INGRESO' || m.type === 'REINCORPORACION'
  );
  const departuresWeek = recentMovements.filter(m => m.type === 'RETIRO');

  // Active branch display label
  const activeBranchLabel =
    activeBranchId === 'ALL'
      ? 'Consolidado Global (Todas las Faenas)'
      : branches.find(b => b.id === activeBranchId)?.name || 'Faena Seleccionada';

  const attendancePercentage =
    activeWorkers.length > 0
      ? Math.round((presentWorkers.length / activeWorkers.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Scope banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Panel de Control Diario</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">{activeBranchLabel}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fecha de Faena: <span className="font-bold text-slate-800">{formatDate(today)}</span>
          </p>
        </div>

        {/* Quick action buttons for field operatives */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('production')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <ClipboardList className="w-4 h-4 text-emerald-200" />
            <span>Pasar Asistencia (Check)</span>
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
          >
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span>Ver Calendario</span>
          </button>
          <button
            onClick={() => onNavigate('workers')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>Nuevo Trabajador</span>
          </button>
        </div>
      </div>

      {/* Legal Contract Compliance Alert Banner in Dashboard */}
      {contractAlertWorkers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-red-950 text-sm">
                  Alerta Legal de Cumplimiento: {contractAlertWorkers.length} trabajador(es) con irregularidad en contrato
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-900 text-[10px] font-bold uppercase animate-pulse">
                  Acción requerida
                </span>
              </div>
              <p className="text-xs text-red-800 mt-0.5">
                Existen trabajadores activos sin contrato adjuntado o con plazo vencido en {activeBranchLabel}. La legislación exige contrato vigente adjunto.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('workers')}
            className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-xs shrink-0 flex items-center gap-1.5"
          >
            <span>Resolver en Trabajadores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stat Cards Grid (Optimized for Attendance & Daily Operations) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Asistencia Hoy */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Asistencia Hoy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {presentWorkers.length}
            </span>
            <span className="text-xs font-bold text-slate-500">
              / {activeWorkers.length} activos
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {attendancePercentage}% Presentismo
            </span>
            <span className="text-slate-500 text-[11px]">
              {totalJornadasToday} jornadas
            </span>
          </div>
        </div>

        {/* Card 2: Ausencias Hoy */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Ausencias Hoy</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-900 font-mono tabular-nums">
              {absentWorkers.length}
            </span>
            <span className="text-xs text-rose-700 font-semibold">sin registrar hoy</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {absentWorkers.length === 0
              ? '¡Cuadrilla 100% presente en terreno!'
              : 'Trabajadores sin Check de asistencia para hoy'}
          </p>
        </div>

        {/* Card 3: Dotación Total Registrada */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Dotación Total</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
              {filteredWorkers.length}
            </span>
            <span className="text-xs text-slate-500">fichas</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-2">
            <span>{activeWorkers.length} Activos</span>
            <span aria-hidden="true">·</span>
            <span>{filteredWorkers.filter(w => w.status === 'RETIRADO').length} Retirados</span>
          </div>
        </div>

        {/* Card 4: Liquidación Contable */}
        {settings.enableMonetaryValuation ? (
          <div className="bg-white border border-emerald-200 rounded-xl p-4 sm:p-5 shadow-xs bg-gradient-to-br from-emerald-50/40 to-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Total a Pagar Hoy</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {formatCLP(totalMontoToday)}
              </span>
            </div>
            <p className="mt-3 text-[11px] text-emerald-800 font-medium">
              Calculado según tarifa por jornada
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Libro para Contabilidad</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-emerald-800" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base font-bold text-slate-900">
                {presentWorkers.length} Días Asistidos
              </span>
            </div>
            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              Jornadas consolidadas listas para informe mensual de nómina.
            </p>
          </div>
        )}
      </div>

      {/* Grid: 2 Columns - Daily Attendance Log & Multi-branch Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Attendance Register */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Libro de Asistencia de Hoy en Terreno
                </h2>
                <p className="text-xs text-slate-500">
                  {formatDate(today)} · {presentWorkers.length} presentes, {absentWorkers.length} ausentes
                </p>
              </div>

              {/* Subtabs: Presentes vs Ausentes */}
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
                <button
                  onClick={() => setAttendanceTab('present')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors ${
                    attendanceTab === 'present'
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Presentes ({presentWorkers.length})
                </button>
                <button
                  onClick={() => setAttendanceTab('absent')}
                  className={`px-3 py-1 rounded-md font-bold transition-colors ${
                    attendanceTab === 'absent'
                      ? 'bg-white text-rose-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ausentes ({absentWorkers.length})
                </button>
              </div>
            </div>

            {/* List */}
            {attendanceTab === 'present' ? (
              presentWorkers.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Sin asistencia registrada hoy</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Cargue la asistencia con el botón "Pasar Asistencia (Check)".
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                  {presentWorkers.map(w => {
                    const rec = filteredProductionToday.find(p => p.workerId === w.id);
                    const branch = branches.find(b => b.id === w.branchId);

                    return (
                      <div key={w.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{w.name}</span>
                            <span className="text-slate-500 text-[11px] font-mono">
                              {w.rut} · {rec?.labor || w.labor}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[11px]">
                            1 Jornada
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[120px]">
                            {branch?.name || w.branchId}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : absentWorkers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">¡Asistencia Completa!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Todos los trabajadores activos registraron su jornada hoy.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {absentWorkers.map(w => {
                  const branch = branches.find(b => b.id === w.branchId);
                  return (
                    <div key={w.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                          <XCircle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{w.name}</span>
                          <span className="text-slate-500 text-[11px] font-mono">
                            {w.rut} · {w.labor}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded font-bold text-[11px]">
                          Ausente
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[120px]">
                          {branch?.name || w.branchId}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigate('production')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline"
            >
              <span>Abrir Planilla Completa de Asistencia</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Branches Breakdown & Weekly Movements */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sucursales Attendance Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-800" />
              <span>Asistencia por Faena / Predio</span>
            </h2>

            <div className="space-y-3">
              {branches.map(b => {
                const bWorkers = workers.filter(w => w.branchId === b.id && w.status === 'ACTIVO');
                const bAttended = bWorkers.filter(w => attendedWorkerIds.has(w.id)).length;
                const bPct = bWorkers.length > 0 ? Math.round((bAttended / bWorkers.length) * 100) : 0;

                return (
                  <div key={b.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900 truncate max-w-[180px]">
                        {b.name}
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {bAttended} / {bWorkers.length}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-700 h-2 rounded-full transition-all"
                        style={{ width: `${bPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                      <span>Encargado: {b.manager}</span>
                      <span className="font-bold text-emerald-800">{bPct}% presente</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Movements */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Altas y Bajas de la Semana</h2>
                <p className="text-[11px] text-slate-500">
                  {incorporationsWeek.length} ingresos · {departuresWeek.length} retiros
                </p>
              </div>
              <button
                onClick={() => onNavigate('workers')}
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                Ver Fichas
              </button>
            </div>

            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center italic">
                Sin movimientos esta semana
              </p>
            ) : (
              <div className="space-y-2">
                {recentMovements.slice(0, 4).map(mov => {
                  const isIngreso = mov.type === 'INGRESO' || mov.type === 'REINCORPORACION';
                  return (
                    <div
                      key={mov.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isIngreso ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                        <div>
                          <strong className="text-slate-900 block">{mov.workerName}</strong>
                          <span className="text-[10px] text-slate-500">
                            {isIngreso ? 'Incorporación' : 'Retiro faena'} · {formatDate(mov.date)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {mov.workerRut}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
