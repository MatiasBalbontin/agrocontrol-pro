import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Building2,
  ArrowRight,
  Clock,
  Lock,
  PlusCircle,
  Check,
} from 'lucide-react';
import { formatDate, getTodayDateString } from '../utils/formatters';

interface ProductionCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string, branchId?: string) => void;
  selectedBranchId?: string;
  currentSelectedDate?: string;
}

export const ProductionCalendarModal: React.FC<ProductionCalendarModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  selectedBranchId,
  currentSelectedDate,
}) => {
  const { production, branches, activeBranchId, workers } = useApp();

  const getInitialDate = (dateStr?: string) => {
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        return new Date(y, m, 1);
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const [currentDate, setCurrentDate] = useState<Date>(() => getInitialDate(currentSelectedDate));
  const [selectedDayDetail, setSelectedDayDetail] = useState<string>(
    currentSelectedDate || getTodayDateString()
  );
  const [modalBranchId, setModalBranchId] = useState<string>(
    selectedBranchId && selectedBranchId !== 'ALL' ? selectedBranchId : 'ALL'
  );

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      if (selectedBranchId && selectedBranchId !== 'ALL') {
        setModalBranchId(selectedBranchId);
      } else if (activeBranchId && activeBranchId !== 'ALL') {
        setModalBranchId(activeBranchId);
      } else {
        setModalBranchId('ALL');
      }

      if (currentSelectedDate && /^\d{4}-\d{2}-\d{2}$/.test(currentSelectedDate)) {
        setSelectedDayDetail(currentSelectedDate);
        setCurrentDate(getInitialDate(currentSelectedDate));
      } else {
        setSelectedDayDetail(getTodayDateString());
      }
    }
  }, [isOpen, selectedBranchId, activeBranchId, currentSelectedDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Map of date string YYYY-MM-DD -> list of production records with quantity > 0
  const productionByDate = useMemo(() => {
    const map = new Map<string, typeof production>();
    production.forEach(p => {
      const matchBranch = modalBranchId === 'ALL' || p.branchId === modalBranchId;
      const qty = Number(p.quantity);
      if (matchBranch && qty > 0) {
        if (!map.has(p.date)) {
          map.set(p.date, []);
        }
        map.get(p.date)!.push(p);
      }
    });
    return map;
  }, [production, modalBranchId]);

  // Calendar math (Monday = 0 ... Sunday = 6)
  const firstDayOfMonth = new Date(year, month, 1);
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay === -1) startingDay = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDayDetail(getTodayDateString());
  };

  const todayStr = getTodayDateString();

  // Selected day records
  const selectedRecords = selectedDayDetail ? productionByDate.get(selectedDayDetail) || [] : [];
  const selectedHasProduction = selectedRecords.length > 0;

  const workersMap = useMemo(() => {
    return new Map(workers.map(w => [w.id, w]));
  }, [workers]);

  // Count days with production in current displayed month
  const daysWithProductionInMonth = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if ((productionByDate.get(dStr) || []).length > 0) {
        count++;
      }
    }
    return count;
  }, [productionByDate, year, month, daysInMonth]);

  const handleSelectAndNavigate = (dayStr: string, branchHint?: string) => {
    let targetBranchId = branchHint;
    if (!targetBranchId && modalBranchId !== 'ALL') {
      targetBranchId = modalBranchId;
    } else if (!targetBranchId) {
      const records = productionByDate.get(dayStr) || [];
      if (records.length > 0 && records[0].branchId) {
        targetBranchId = records[0].branchId;
      }
    }
    onSelectDate(dayStr, targetBranchId);
    onClose();
  };

  // Branch where records were saved for selected day
  const recordedBranch = selectedHasProduction && selectedRecords[0]?.branchId
    ? branches.find(b => b.id === selectedRecords[0].branchId)
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Calendario de Faenas y Control de Asistencia
              </h3>
              <p className="text-[11px] text-slate-500">
                Días en <strong className="text-emerald-800">verde</strong> tienen asistencia guardada. Haga clic en un día para seleccionarlo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            title="Cerrar calendario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
          {/* Controls Bar: Branch & Month Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
            {/* Faena Selector */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-800 shrink-0" />
              <span className="font-bold text-slate-700">Faena:</span>
              <select
                value={modalBranchId}
                onChange={e => setModalBranchId(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-1 focus:ring-emerald-700 text-xs"
              >
                <option value="ALL">🌐 Todas las Faenas (Consolidado)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Switcher */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 capitalize min-w-[120px] text-center">
                {monthNames[month]} {year}
              </h4>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50 rounded-lg border border-emerald-300 ml-1"
                title="Ir a fecha actual"
              >
                Hoy
              </button>
            </div>
          </div>

          {/* Month Summary Banner */}
          <div className="flex items-center justify-between text-[11px] bg-emerald-50/70 px-3 py-1.5 rounded-lg border border-emerald-200">
            <span className="text-emerald-950 font-medium">
              Días con asistencia en {monthNames[month]}: <strong className="font-bold text-emerald-900">{daysWithProductionInMonth} días</strong>
            </span>
            <span className="text-slate-500 hidden sm:inline">
              Doble clic en un día para cargarlo de inmediato
            </span>
          </div>

          {/* Calendar Grid */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-1.5 text-xs font-bold text-slate-700">
              {daysOfWeek.map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days Cells */}
            <div className="grid grid-cols-7 gap-1 p-1.5 bg-slate-50/60">
              {/* Empty leading cells */}
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 sm:h-16 rounded-lg bg-transparent opacity-10" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                  dayNum
                ).padStart(2, '0')}`;
                const records = productionByDate.get(dayStr) || [];
                const hasProduction = records.length > 0;
                const isSelected = selectedDayDetail === dayStr;
                const isToday = dayStr === todayStr;

                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => setSelectedDayDetail(dayStr)}
                    onDoubleClick={() => handleSelectAndNavigate(dayStr, records[0]?.branchId)}
                    className={`h-14 sm:h-16 p-1.5 rounded-xl text-left transition-all flex flex-col justify-between border cursor-pointer select-none ${
                      hasProduction
                        ? isSelected
                          ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500 shadow-md scale-[1.02] z-10'
                          : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-2xs'
                        : isToday
                        ? isSelected
                          ? 'bg-emerald-50 border-emerald-600 text-slate-900 ring-2 ring-emerald-500 shadow-sm'
                          : 'bg-white border-emerald-400 text-slate-900 ring-1 ring-emerald-300'
                        : isSelected
                        ? 'bg-slate-100 border-slate-400 text-slate-900 ring-2 ring-emerald-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={
                      hasProduction
                        ? `Día ${dayNum}: ${records.length} trabajadores (Guardada y bloqueada)`
                        : `Día ${dayNum}: Sin registro de asistencia`
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold ${
                          hasProduction ? 'text-white' : isToday ? 'text-emerald-900 font-extrabold' : 'text-slate-800'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {hasProduction ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
                      ) : isToday ? (
                        <span className="text-[9px] px-1 bg-emerald-100 text-emerald-800 rounded font-bold">
                          Hoy
                        </span>
                      ) : null}
                    </div>

                    {hasProduction ? (
                      <div className="text-[10px] font-bold tracking-tight truncate leading-tight text-emerald-50">
                        {records.length} {records.length === 1 ? 'asistente' : 'asist.'}
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-400 leading-tight">
                        {isToday ? 'Pendiente' : '—'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 px-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-600 rounded" />
                <span className="font-semibold text-slate-800">Verde: Asistencia guardada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-white border border-slate-300 rounded" />
                <span>Blanco: Sin registro</span>
              </div>
            </div>
          </div>

          {/* Selected Day Details Card (Always visible for selected day) */}
          {selectedDayDetail && (
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                selectedHasProduction
                  ? 'bg-emerald-50/90 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Clock className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      Fecha Seleccionada: {formatDate(selectedDayDetail)}
                    </span>
                    {selectedHasProduction ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-800 text-white rounded-full">
                        <Lock className="w-3 h-3" />
                        Guardada y Bloqueada ({selectedRecords.length} trabajadores)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                        Sin asistencia registrada
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600">
                    {selectedHasProduction ? (
                      <>
                        Faena registrada en{' '}
                        <strong className="text-emerald-950 font-bold">
                          {recordedBranch?.name || 'la faena seleccionada'}
                        </strong>{' '}
                        con {selectedRecords.length} asistentes confirmados.
                      </>
                    ) : (
                      <>
                        No hay asistencia guardada para este día. Presione el botón a la derecha para iniciar la planilla con los trabajadores de faena.
                      </>
                    )}
                  </p>

                  {/* Worker Preview list for recorded day */}
                  {selectedHasProduction && (
                    <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto">
                      {selectedRecords.slice(0, 10).map(r => {
                        const w = workersMap.get(r.workerId);
                        const displayName = w?.name
                          ? w.name.split(' ')[0] + ' ' + (w.name.split(' ')[1] || '')
                          : r.workerId || 'Trabajador';
                        return (
                          <span
                            key={r.id}
                            className="inline-block text-[10px] px-2 py-0.5 bg-white border border-emerald-200 rounded text-emerald-900 font-medium"
                          >
                            {displayName}
                          </span>
                        );
                      })}
                      {selectedRecords.length > 10 && (
                        <span className="text-[10px] text-emerald-800 font-bold self-center px-1">
                          +{selectedRecords.length - 10} más
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <button
                  type="button"
                  onClick={() => handleSelectAndNavigate(selectedDayDetail, selectedRecords[0]?.branchId)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 bg-emerald-800 hover:bg-emerald-900 text-white"
                >
                  {selectedHasProduction ? (
                    <>
                      <span>Cargar Faena Guardada</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Iniciar Registro para este Día</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <span className="text-[11px] text-slate-500 truncate mr-2">
            Seleccionado: <strong className="text-slate-800">{formatDate(selectedDayDetail)}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => handleSelectAndNavigate(selectedDayDetail, selectedRecords[0]?.branchId)}
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Cargar Día</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
