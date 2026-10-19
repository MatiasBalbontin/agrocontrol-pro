import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from './Navbar';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  Check,
  Table,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDate, getTodayDateString, formatCLP, formatQuantity } from '../utils/formatters';
import {
  getMonthCalendarDays,
  MONTH_NAMES_ES,
  DAYS_OF_WEEK_SHORT,
  CalendarDay,
} from '../utils/calendarUtils';

interface CalendarViewProps {
  onNavigate: (tab: TabType) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigate }) => {
  const {
    production,
    branches,
    activeBranchId,
    workers,
    selectedProductionDate,
    setSelectedProductionDate,
    setActiveBranchId,
  } = useApp();

  const todayStr = getTodayDateString();

  // Selected date parsed into month and year for calendar navigation
  const [currentDate, setCurrentDate] = useState(() => {
    if (selectedProductionDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedProductionDate)) {
      const parts = selectedProductionDate.split('-');
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1, 12, 0, 0);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
  });

  const [selectedDay, setSelectedDay] = useState<string>(
    selectedProductionDate || todayStr
  );

  const [viewBranchId, setViewBranchId] = useState<string>(
    activeBranchId !== 'ALL' ? activeBranchId : 'ALL'
  );

  // Sync when selectedProductionDate changes from other views or tabs
  useEffect(() => {
    if (selectedProductionDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedProductionDate)) {
      setSelectedDay(selectedProductionDate);
      const parts = selectedProductionDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setCurrentDate(new Date(y, m, 1, 12, 0, 0));
      }
    }
  }, [selectedProductionDate]);

  // Sync branch if activeBranchId changes globally
  useEffect(() => {
    if (activeBranchId && activeBranchId !== 'ALL') {
      setViewBranchId(activeBranchId);
    }
  }, [activeBranchId]);

  // View Mode: 'calendar' (monthly grid) vs 'matrix' (Libro de Asistencia mensual)
  const [viewMode, setViewMode] = useState<'calendar' | 'matrix'>('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1, 12, 0, 0));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1, 12, 0, 0));
  };

  const goToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0));
    setSelectedDay(todayStr);
  };

  // Grid days (exact 35 or 42 cells)
  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(year, month);
  }, [year, month]);

  // Map of date string YYYY-MM-DD -> records
  const productionByDate = useMemo(() => {
    const map = new Map<string, typeof production>();
    production.forEach(p => {
      const matchBranch = viewBranchId === 'ALL' || p.branchId === viewBranchId;
      const qty = Number(p.quantity);
      if (matchBranch && qty > 0) {
        if (!map.has(p.date)) {
          map.set(p.date, []);
        }
        map.get(p.date)!.push(p);
      }
    });
    return map;
  }, [production, viewBranchId]);

  // Count days with production in current month
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysWithProductionInMonth = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if ((productionByDate.get(dStr) || []).length > 0) {
        count++;
      }
    }
    return count;
  }, [productionByDate, year, month, daysInCurrentMonth]);

  // Total attendances in month
  const totalAttendancesInMonth = useMemo(() => {
    let total = 0;
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const recs = productionByDate.get(dStr) || [];
      total += recs.length;
    }
    return total;
  }, [productionByDate, year, month, daysInCurrentMonth]);

  // Active workers scoped to branch
  const activeWorkers = useMemo(() => {
    return workers.filter(
      w => w.status === 'ACTIVO' && (viewBranchId === 'ALL' || w.branchId === viewBranchId)
    );
  }, [workers, viewBranchId]);

  // Selected Day Details
  const selectedRecords = selectedDay ? productionByDate.get(selectedDay) || [] : [];
  const selectedHasProduction = selectedRecords.length > 0;
  const attendedIdsSet = useMemo(() => new Set(selectedRecords.map(r => r.workerId)), [selectedRecords]);

  const presentWorkers = useMemo(() => {
    return activeWorkers.filter(w => attendedIdsSet.has(w.id));
  }, [activeWorkers, attendedIdsSet]);

  const absentWorkers = useMemo(() => {
    return activeWorkers.filter(w => !attendedIdsSet.has(w.id));
  }, [activeWorkers, attendedIdsSet]);

  const recordedBranch = selectedHasProduction && selectedRecords[0]?.branchId
    ? branches.find(b => b.id === selectedRecords[0].branchId)
    : null;

  // Navigate to Planilla de Asistencia with this date and branch
  const handleOpenInPlanilla = (targetDate: string, branchHint?: string) => {
    setSelectedProductionDate(targetDate);
    if (branchHint && branches.some(b => b.id === branchHint)) {
      setActiveBranchId(branchHint);
    } else if (viewBranchId !== 'ALL') {
      setActiveBranchId(viewBranchId);
    }
    onNavigate('production');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Header & Controls Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
                <CalendarIcon className="w-4 h-4 text-emerald-300" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Calendario de Asistencia & Faenas
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría visual de días trabajados, dotación de cuadrillas y libros mensuales de asistencia.
            </p>
          </div>

          {/* Right Action: View Mode Toggle & Faena Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'calendar'
                    ? 'bg-white text-emerald-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Vista Calendario</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'matrix'
                    ? 'bg-white text-emerald-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-emerald-700" />
                <span>Matriz Mensual (Libro)</span>
              </button>
            </div>

            {/* Faena Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
              <Building2 className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="font-semibold text-slate-700">Faena:</span>
              <select
                value={viewBranchId}
                onChange={e => setViewBranchId(e.target.value)}
                className="bg-transparent font-bold text-slate-900 text-xs focus:outline-none"
              >
                <option value="ALL">🌐 Todas las Faenas</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 2. Month Navigation & KPI Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Month Switcher */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 min-w-[140px] text-center capitalize">
              {MONTH_NAMES_ES[month]} {year}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 ml-1 transition-colors"
            >
              Ir a Hoy
            </button>
          </div>

          {/* Monthly KPI Chips */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium">
              Días con Faena: <strong className="font-bold text-emerald-900">{daysWithProductionInMonth} días</strong>
            </div>
            <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
              Asistencias Acumuladas: <strong className="font-bold text-slate-900">{totalAttendancesInMonth} jornales</strong>
            </div>
            <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
              Dotación: <strong className="font-bold text-slate-900">{activeWorkers.length} activos</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW MODE A: FULL MONTHLY CALENDAR GRID */}
      {/* ========================================================= */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Calendar Grid (Col 12 on mobile, Col 8 on desktop) */}
          <div className="lg:col-span-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
              <span className="font-medium">
                Haga clic en un día para seleccionarlo o <strong>doble clic</strong> para abrir su planilla.
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-emerald-600 rounded" />
                  <span className="font-semibold text-slate-700">Con Asistencia</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-white border border-slate-300 rounded" />
                  <span>Sin Faena</span>
                </div>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-center py-2 text-xs font-bold text-slate-700">
              {DAYS_OF_WEEK_SHORT.map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* 35 or 42 Days Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map(day => {
                const records = productionByDate.get(day.dateStr) || [];
                const hasProduction = records.length > 0;
                const isSelected = selectedDay === day.dateStr;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day.dateStr);
                      setSelectedProductionDate(day.dateStr);
                    }}
                    onDoubleClick={() => handleOpenInPlanilla(day.dateStr, records[0]?.branchId)}
                    className={`min-h-[70px] sm:min-h-[82px] p-2 rounded-xl text-left transition-all flex flex-col justify-between border cursor-pointer select-none ${
                      hasProduction
                        ? isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 ring-3 ring-emerald-400 shadow-md scale-[1.02] z-10'
                          : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-2xs'
                        : day.isToday
                        ? isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-slate-900 ring-3 ring-emerald-400 shadow-sm'
                          : 'bg-white border-emerald-400 text-slate-900 ring-1 ring-emerald-300'
                        : isSelected
                        ? 'bg-slate-100 border-slate-400 text-slate-900 ring-3 ring-emerald-400 shadow-sm'
                        : day.isCurrentMonth
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                        : 'bg-slate-50/50 border-slate-100 text-slate-400 hover:bg-slate-100/50 opacity-60'
                    }`}
                  >
                    {/* Top Row: Day Number & Today/Check Pill */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          hasProduction
                            ? 'text-white'
                            : day.isToday
                            ? 'text-emerald-900 font-extrabold'
                            : 'text-slate-800'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                      {hasProduction ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
                      ) : day.isToday ? (
                        <span className="text-[9px] px-1 bg-emerald-100 text-emerald-900 font-extrabold rounded">
                          Hoy
                        </span>
                      ) : null}
                    </div>

                    {/* Middle / Bottom Content */}
                    {hasProduction ? (
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-bold tracking-tight truncate leading-tight text-emerald-50">
                          {records.length} {records.length === 1 ? 'asistente' : 'asist.'}
                        </div>
                        <div className="text-[9px] text-emerald-100/80 truncate font-mono">
                          {formatQuantity(records.reduce((s, r) => s + r.quantity, 0))} días
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 leading-tight">
                        {day.isCurrentMonth ? (day.isWeekend ? 'Finde' : '—') : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Day Details & Attendance Inspector (Col 4 on desktop) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              {/* Day Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Día Seleccionado</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {formatDate(selectedDay)}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {recordedBranch?.name || (viewBranchId !== 'ALL' ? branches.find(b => b.id === viewBranchId)?.name : 'Faena')}
                  </p>
                </div>

                {selectedHasProduction ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-lg border border-emerald-300 shrink-0">
                    ✓ Guardada
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-semibold text-xs rounded-lg border border-slate-200 shrink-0">
                    Sin Faena
                  </span>
                )}
              </div>

              {/* Day Stats */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase block">
                    Presentes
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-950 mt-0.5 block">
                    {presentWorkers.length}
                  </span>
                  <span className="text-[10px] text-emerald-700">Asistieron a faena</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                    Ausentes
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-800 mt-0.5 block">
                    {absentWorkers.length}
                  </span>
                  <span className="text-[10px] text-slate-400">Sin registro</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => handleOpenInPlanilla(selectedDay, selectedRecords[0]?.branchId)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
              >
                {selectedHasProduction ? (
                  <>
                    <span>Abrir y Editar en Planilla</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Iniciar Registro para este Día</span>
                  </>
                )}
              </button>

              {/* Worker List for this day */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Trabajadores con Check ({presentWorkers.length}):</span>
                  {selectedHasProduction && (
                    <span className="text-emerald-700 font-mono text-[11px]">
                      {presentWorkers.length} / {activeWorkers.length}
                    </span>
                  )}
                </div>

                {presentWorkers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center bg-slate-50 rounded-xl border border-slate-100">
                    No hay trabajadores con asistencia confirmada en esta fecha.
                  </p>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl text-xs bg-white">
                    {presentWorkers.map(w => (
                      <div key={w.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50">
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate">{w.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {w.rut} · {w.labor}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md shrink-0">
                          ✓ 1 Día
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW MODE B: MATRIZ MENSUAL (LIBRO DE ASISTENCIA 1-31) */}
      {/* ========================================================= */}
      {viewMode === 'matrix' && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Libro de Asistencia Mensual ({MONTH_NAMES_ES[month]} {year})
              </h3>
              <p className="text-[11px] text-slate-500">
                Audite la asistencia diaria de todos los trabajadores de la faena durante los {daysInCurrentMonth} días del mes.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-900 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200 self-start sm:self-center">
              Total {totalAttendancesInMonth} asistencias registradas
            </span>
          </div>

          {/* Matrix Table with Horizontal Scroll */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-700 text-[11px]">
                <tr>
                  <th className="px-3 py-2 sticky left-0 bg-slate-50 z-20 min-w-[160px] border-r border-slate-200 shadow-xs">
                    Trabajador
                  </th>
                  <th className="px-2 py-2 min-w-[90px] border-r border-slate-200 text-slate-600">
                    Labor
                  </th>
                  {/* Days 1 to daysInCurrentMonth */}
                  {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isToday = dStr === todayStr;

                    return (
                      <th
                        key={dayNum}
                        className={`px-1.5 py-2 text-center font-mono min-w-[28px] border-r border-slate-100 ${
                          isToday ? 'bg-emerald-100 text-emerald-950 font-extrabold' : ''
                        }`}
                        title={`Día ${dayNum} de ${MONTH_NAMES_ES[month]}`}
                      >
                        {dayNum}
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-right bg-emerald-50 text-emerald-950 font-extrabold min-w-[80px]">
                    Total Días
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                {activeWorkers.map(w => {
                  let workerDaysCount = 0;

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80">
                      {/* Sticky Worker Name */}
                      <td className="px-3 py-1.5 font-sans font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200 truncate max-w-[160px]">
                        <div>{w.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{w.rut}</div>
                      </td>
                      <td className="px-2 py-1.5 font-sans text-slate-600 border-r border-slate-200 truncate max-w-[90px]">
                        {w.labor}
                      </td>

                      {/* Day cells 1 to 31 */}
                      {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const dayRecords = productionByDate.get(dStr) || [];
                        const attended = dayRecords.some(r => r.workerId === w.id);
                        if (attended) workerDaysCount++;

                        return (
                          <td
                            key={dayNum}
                            className={`p-0 text-center border-r border-slate-100 ${
                              dStr === todayStr ? 'bg-emerald-50/40' : ''
                            }`}
                          >
                            {attended ? (
                              <span className="inline-block w-4 h-4 bg-emerald-600 text-white rounded font-bold text-[9px] leading-4">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300">·</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="px-3 py-1.5 text-right font-bold text-emerald-900 bg-emerald-50/50">
                        {workerDaysCount} {workerDaysCount === 1 ? 'día' : 'días'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Footer: Total Attendees per Day */}
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[11px]">
                <tr>
                  <td className="px-3 py-2 sticky left-0 bg-slate-100 z-20 border-r border-slate-300 text-slate-800 uppercase font-sans">
                    Total Presentes:
                  </td>
                  <td className="border-r border-slate-300" />
                  {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const dayRecs = productionByDate.get(dStr) || [];

                    return (
                      <td
                        key={dayNum}
                        className="px-1 py-2 text-center font-mono border-r border-slate-200 text-slate-800"
                      >
                        {dayRecs.length > 0 ? dayRecs.length : ''}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-mono text-emerald-950 font-extrabold bg-emerald-100">
                    {totalAttendancesInMonth}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
