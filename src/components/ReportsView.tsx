import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Printer,
  FileSpreadsheet,
  Calendar,
  Building2,
  Users,
  Search,
  CheckCircle2,
  UserPlus,
  UserMinus,
  Edit3,
  Save,
  X,
  AlertCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import {
  formatCLP,
  formatQuantity,
  formatDate,
  getTodayDateString,
  getDateDaysAgo,
} from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const {
    workers,
    branches,
    production,
    movements,
    activeBranchId,
    settings,
    adjustPeriodProduction,
  } = useApp();

  const today = getTodayDateString();

  // Period Selection
  const [periodPreset, setPeriodPreset] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState(getDateDaysAgo(30));
  const [endDate, setEndDate] = useState(today);

  // Selected Branch for Report (defaults to active branch or ALL)
  const [reportBranchId, setReportBranchId] = useState<string>(activeBranchId);

  // Active Report Tab: 'detailed' predefinido
  const [reportType, setReportType] = useState<'detailed' | 'general' | 'altas' | 'bajas'>('detailed');

  // Search filter for detailed table to avoid visual cognitive overload
  const [detailedSearch, setDetailedSearch] = useState('');

  // Edit Mode state for Direct Production Quantities Adjustment
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRow, setEditingRow] = useState<{
    workerId: string;
    workerName: string;
    workerRut: string;
    labor: string;
    currentQuantity: number;
    newQuantity: number;
    paymentMode: string;
    unitRate: number;
    justification: string;
  } | null>(null);
  const [editNotice, setEditNotice] = useState<string | null>(null);

  // Handle Preset Changes
  const handlePresetChange = (preset: 'today' | 'week' | 'month' | 'custom') => {
    setPeriodPreset(preset);
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'week') {
      setStartDate(getDateDaysAgo(7));
      setEndDate(today);
    } else if (preset === 'month') {
      setStartDate(getDateDaysAgo(30));
      setEndDate(today);
    }
  };

  // Filtered Production Records for Report
  const filteredProduction = useMemo(() => {
    return production.filter(p => {
      const matchDate = (!startDate || p.date >= startDate) && (!endDate || p.date <= endDate);
      const matchBranch = reportBranchId === 'ALL' || p.branchId === reportBranchId;
      return matchDate && matchBranch;
    });
  }, [production, startDate, endDate, reportBranchId]);

  // Filtered Movements for Report (Altas y Bajas en el período)
  const periodMovements = useMemo(() => {
    return movements.filter(m => {
      const matchDate = (!startDate || m.date >= startDate) && (!endDate || m.date <= endDate);
      const matchBranch = reportBranchId === 'ALL' || m.branchId === reportBranchId;
      return matchDate && matchBranch;
    });
  }, [movements, startDate, endDate, reportBranchId]);

  const periodIncorporations = periodMovements.filter(
    m => m.type === 'INGRESO' || m.type === 'REINCORPORACION'
  );
  const periodDepartures = periodMovements.filter(m => m.type === 'RETIRO');

  // Workers hired in the period
  const periodHiredWorkers = useMemo(() => {
    const hiredSet = new Set<string>();
    const list: typeof workers = [];

    workers.forEach(w => {
      const matchBranch = reportBranchId === 'ALL' || w.branchId === reportBranchId;
      const matchDate = (!startDate || w.hireDate >= startDate) && (!endDate || w.hireDate <= endDate);
      if (matchBranch && matchDate) {
        hiredSet.add(w.id);
        list.push(w);
      }
    });

    periodMovements.forEach(m => {
      if ((m.type === 'INGRESO' || m.type === 'REINCORPORACION') && !hiredSet.has(m.workerId)) {
        const w = workers.find(work => work.id === m.workerId);
        if (w) {
          hiredSet.add(w.id);
          list.push(w);
        }
      }
    });

    return list.sort((a, b) => (b.hireDate || '').localeCompare(a.hireDate || ''));
  }, [workers, periodMovements, reportBranchId, startDate, endDate]);

  // Workers retired in the period
  const periodRetiredWorkers = useMemo(() => {
    const retiredSet = new Set<string>();
    const list: Array<{
      id: string;
      rut: string;
      name: string;
      branchId: string;
      labor: string;
      hireDate: string;
      departureDate: string;
      departureReason: string;
      documents?: any[];
    }> = [];

    workers.forEach(w => {
      if (w.status === 'RETIRADO' && w.departureDate) {
        const matchBranch = reportBranchId === 'ALL' || w.branchId === reportBranchId;
        const matchDate = (!startDate || w.departureDate >= startDate) && (!endDate || w.departureDate <= endDate);
        if (matchBranch && matchDate) {
          retiredSet.add(w.id);
          list.push({
            id: w.id,
            rut: w.rut,
            name: w.name,
            branchId: w.branchId,
            labor: w.labor,
            hireDate: w.hireDate,
            departureDate: w.departureDate,
            departureReason: w.departureReason || 'Conclusión del trabajo o servicio (Art. 159 N°5)',
            documents: w.documents,
          });
        }
      }
    });

    periodMovements.forEach(m => {
      if (m.type === 'RETIRO' && !retiredSet.has(m.workerId)) {
        const w = workers.find(work => work.id === m.workerId);
        retiredSet.add(m.workerId);
        list.push({
          id: m.workerId,
          rut: m.workerRut,
          name: m.workerName,
          branchId: m.branchId,
          labor: w?.labor || 'Labores Agrícolas',
          hireDate: w?.hireDate || '',
          departureDate: m.date,
          departureReason: m.reason || 'Conclusión de la faena asignada',
          documents: w?.documents,
        });
      }
    });

    return list.sort((a, b) => (b.departureDate || '').localeCompare(a.departureDate || ''));
  }, [workers, periodMovements, reportBranchId, startDate, endDate]);

  // Active workers in branch during this scope
  const scopedWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchBranch = reportBranchId === 'ALL' || w.branchId === reportBranchId;
      return matchBranch;
    });
  }, [workers, reportBranchId]);

  const activeWorkersCount = scopedWorkers.filter(w => w.status === 'ACTIVO').length;

  // Aggregated totals in period
  const totalKilos = filteredProduction
    .filter(p => p.paymentMode === 'KILO')
    .reduce((sum, p) => sum + p.quantity, 0);

  const totalHoras = filteredProduction
    .filter(p => p.paymentMode === 'HORA')
    .reduce((sum, p) => sum + p.quantity, 0);

  const totalDias = filteredProduction
    .filter(p => p.paymentMode === 'DÍA')
    .reduce((sum, p) => sum + p.quantity, 0);

  const totalTareas = filteredProduction
    .filter(p => p.paymentMode === 'TAREA')
    .reduce((sum, p) => sum + p.quantity, 0);

  const totalMontoAPagar = filteredProduction.reduce((sum, p) => sum + p.totalCalculated, 0);

  // Group detailed production by Worker and Labor
  const detailedWorkerRows = useMemo(() => {
    const map = new Map<
      string,
      {
        workerId: string;
        workerName: string;
        workerRut: string;
        branchName: string;
        labor: string;
        paymentMode: string;
        quantity: number;
        unitRate: number;
        totalCalculated: number;
      }
    >();

    filteredProduction.forEach(rec => {
      const worker = workers.find(w => w.id === rec.workerId);
      const branch = branches.find(b => b.id === rec.branchId);
      const key = `${rec.workerId}_${rec.labor}`;

      if (!map.has(key)) {
        map.set(key, {
          workerId: rec.workerId,
          workerName: worker?.name || 'Trabajador',
          workerRut: worker?.rut || '-',
          branchName: branch?.name || rec.branchId,
          labor: rec.labor,
          paymentMode: rec.paymentMode,
          quantity: 0,
          unitRate: rec.unitRate,
          totalCalculated: 0,
        });
      }

      const existing = map.get(key)!;
      existing.quantity += rec.quantity;
      existing.totalCalculated += rec.totalCalculated;
    });

    const rows = Array.from(map.values()).sort((a, b) => a.workerName.localeCompare(b.workerName));

    if (!detailedSearch.trim()) return rows;
    const term = detailedSearch.toLowerCase();
    return rows.filter(
      r =>
        r.workerName.toLowerCase().includes(term) ||
        r.workerRut.toLowerCase().includes(term) ||
        r.labor.toLowerCase().includes(term) ||
        r.branchName.toLowerCase().includes(term)
    );
  }, [filteredProduction, workers, branches, detailedSearch]);

  // Non-zero unit summaries for General Report
  const activeUnitSummaries = useMemo(() => {
    const list = [
      {
        mode: 'DÍA' as const,
        name: 'Jornadas / Días',
        labors: 'Riego, tractor, faena general',
        quantity: totalDias,
        unitLabel: 'días',
        amount: filteredProduction
          .filter(p => p.paymentMode === 'DÍA')
          .reduce((s, p) => s + p.totalCalculated, 0),
      },
      {
        mode: 'KILO' as const,
        name: 'Kilos (Trato Cosecha)',
        labors: 'Cosecha de fruta',
        quantity: totalKilos,
        unitLabel: 'kg',
        amount: filteredProduction
          .filter(p => p.paymentMode === 'KILO')
          .reduce((s, p) => s + p.totalCalculated, 0),
      },
      {
        mode: 'HORA' as const,
        name: 'Horas (Packing / Turno)',
        labors: 'Packing, frío y calibrado',
        quantity: totalHoras,
        unitLabel: 'hrs',
        amount: filteredProduction
          .filter(p => p.paymentMode === 'HORA')
          .reduce((s, p) => s + p.totalCalculated, 0),
      },
      {
        mode: 'TAREA' as const,
        name: 'Tareas / Hileras',
        labors: 'Poda, raleo, desbrote',
        quantity: totalTareas,
        unitLabel: 'tareas',
        amount: filteredProduction
          .filter(p => p.paymentMode === 'TAREA')
          .reduce((s, p) => s + p.totalCalculated, 0),
      },
    ];

    // Filter out units with 0 quantity to avoid noise
    return list.filter(u => u.quantity > 0);
  }, [totalDias, totalKilos, totalHoras, totalTareas, filteredProduction]);

  // Branch summaries
  const branchSummaries = useMemo(() => {
    const list = reportBranchId === 'ALL' ? branches : branches.filter(b => b.id === reportBranchId);

    return list.map(b => {
      const branchProds = filteredProduction.filter(p => p.branchId === b.id);
      const branchMovs = periodMovements.filter(m => m.branchId === b.id);
      const bActiveWorkers = workers.filter(w => w.branchId === b.id && w.status === 'ACTIVO').length;

      const units = [
        { mode: 'DÍA', quantity: branchProds.filter(p => p.paymentMode === 'DÍA').reduce((s, p) => s + p.quantity, 0), unit: 'días' },
        { mode: 'KILO', quantity: branchProds.filter(p => p.paymentMode === 'KILO').reduce((s, p) => s + p.quantity, 0), unit: 'kg' },
        { mode: 'HORA', quantity: branchProds.filter(p => p.paymentMode === 'HORA').reduce((s, p) => s + p.quantity, 0), unit: 'hrs' },
        { mode: 'TAREA', quantity: branchProds.filter(p => p.paymentMode === 'TAREA').reduce((s, p) => s + p.quantity, 0), unit: 'tareas' },
      ].filter(u => u.quantity > 0);

      const totalAmount = branchProds.reduce((s, p) => s + p.totalCalculated, 0);

      return {
        branch: b,
        activeWorkers: bActiveWorkers,
        incorporations: branchMovs.filter(m => m.type === 'INGRESO' || m.type === 'REINCORPORACION').length,
        departures: branchMovs.filter(m => m.type === 'RETIRO').length,
        totalRecords: branchProds.length,
        units,
        totalAmount,
      };
    });
  }, [branches, reportBranchId, filteredProduction, periodMovements, workers]);

  const branchLabel =
    reportBranchId === 'ALL'
      ? 'Todas las Faenas (Consolidado)'
      : branches.find(b => b.id === reportBranchId)?.name || 'Faena Seleccionada';

  // Save manual adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    const validQty = Math.max(0, editingRow.newQuantity);
    adjustPeriodProduction(
      editingRow.workerId,
      editingRow.labor,
      validQty,
      editingRow.justification || 'Ajuste manual directo de informe por administración',
      startDate,
      endDate,
      reportBranchId !== 'ALL' ? reportBranchId : undefined
    );

    setEditNotice(
      `¡Ajuste guardado! Se actualizó la cantidad de ${editingRow.workerName} a ${validQty} ${editingRow.paymentMode.toLowerCase()}.`
    );
    setEditingRow(null);
    setTimeout(() => setEditNotice(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Header & Controls Card (Hidden during printing) */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Informes de Faena & Contabilidad
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Planillas consolidadas, asistencia de cuadrillas y reportes oficiales listos para impresión.
            </p>
          </div>

          {/* Action Buttons: Edit Quantities & Print */}
          <div className="flex items-center gap-2">
            {reportType === 'detailed' && (
              <button
                type="button"
                onClick={() => setIsEditMode(prev => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isEditMode
                    ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
                title="Habilitar edición manual de cantidades producidas para contabilidad"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>{isEditMode ? 'Cerrar Edición' : 'Editar Cantidades'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-300" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Clean, minimal pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setReportType('detailed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportType === 'detailed'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Planilla Detallada
            </button>
            <button
              onClick={() => setReportType('general')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportType === 'general'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resumen Ejecutivo
            </button>
            <button
              onClick={() => setReportType('altas')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                reportType === 'altas'
                  ? 'bg-white text-emerald-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Nuevas Altas ({periodHiredWorkers.length})</span>
            </button>
            <button
              onClick={() => setReportType('bajas')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                reportType === 'bajas'
                  ? 'bg-white text-rose-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserMinus className="w-3.5 h-3.5 text-rose-700" />
              <span>Bajas & Finiquitos ({periodRetiredWorkers.length})</span>
            </button>
          </div>

          {/* Faena Selector */}
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="font-semibold text-slate-700">Faena:</span>
            <select
              value={reportBranchId}
              onChange={e => setReportBranchId(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-700"
            >
              <option value="ALL">🌐 Todas las Faenas (Consolidado)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Row: Compact & Clean */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-600">
          {/* Quick Presets */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Período:
            </span>
            {(['today', 'week', 'month', 'custom'] as const).map(p => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  periodPreset === p
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p === 'today' ? 'Hoy' : p === 'week' ? '7 Días' : p === 'month' ? '30 Días' : 'Manual'}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 text-[11px]">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="bg-transparent text-slate-900 font-mono font-semibold text-xs focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
              <span className="text-slate-500 text-[11px]">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="bg-transparent text-slate-900 font-mono font-semibold text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Alert Notice */}
      {editNotice && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{editNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setEditNotice(null)}
            className="text-emerald-800 hover:text-emerald-950 text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. PRINTABLE DOCUMENT CANVAS (Executive, Breathable & Clean) */}
      <div className="print-card bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-slate-900 text-xs space-y-6">
        {/* Document Header (Clean Corporate Letterhead) */}
        <div className="border-b border-slate-300 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight uppercase">
              {settings.companyName || 'Empresa Agrícola y de Servicios'}
            </h2>
            <p className="text-slate-600 font-mono text-[11px]">RUT: {settings.companyRut || '76.890.123-K'}</p>
            <p className="text-slate-500 text-[11px]">
              {settings.companyAddress} · Fono: {settings.companyPhone}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded-md font-bold text-slate-800 uppercase tracking-wide text-[11px]">
              {reportType === 'general'
                ? 'Resumen Ejecutivo de Faena'
                : reportType === 'altas'
                ? 'Nómina Oficial de Altas'
                : reportType === 'bajas'
                ? 'Nómina Oficial de Bajas y Términos'
                : 'Planilla Detallada de Producción'}
            </span>
            <p className="text-slate-500 text-[11px]">
              Período: <strong className="text-slate-800 font-mono">{formatDate(startDate)} al {formatDate(endDate)}</strong>
            </p>
            <p className="text-slate-500 text-[11px]">
              Faena: <strong className="text-slate-800">{branchLabel}</strong>
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: PLANILLA DETALLADA DE PRODUCCIÓN (DEFAULT) */}
        {/* ========================================================= */}
        {reportType === 'detailed' && (
          <div className="space-y-4">
            {/* Detailed Controls: Search bar & Quick KPI Strip */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por trabajador, labor..."
                  value={detailedSearch}
                  onChange={e => setDetailedSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Quick Summary Pill */}
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                <span>
                  Mostrando: <strong className="text-slate-900 font-mono">{detailedWorkerRows.length}</strong> trabajadores
                </span>
                {settings.enableMonetaryValuation && (
                  <span className="text-emerald-900 font-bold font-mono">
                    Total: {formatCLP(totalMontoAPagar)}
                  </span>
                )}
              </div>
            </div>

            {isEditMode && (
              <div className="no-print p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>
                    Presione <strong>'Editar'</strong> en cualquier fila para ajustar la cantidad física producida. Los cambios quedan grabados en la bitácora.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-bold shrink-0 text-xs"
                >
                  Listo
                </button>
              </div>
            )}

            {detailedWorkerRows.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-1">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">No hay registros de faena en el rango seleccionado</p>
                <p className="text-[11px] text-slate-400">Verifique las fechas o el filtro de faena en la barra superior.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 w-16">ID</th>
                      <th className="px-3 py-2.5">RUT</th>
                      <th className="px-3 py-2.5">Trabajador</th>
                      <th className="px-3 py-2.5">Labor</th>
                      <th className="px-3 py-2.5">Faena</th>
                      <th className="px-3 py-2.5 text-center">Unidad</th>
                      <th className="px-3 py-2.5 text-right">Cantidad Producida</th>
                      {settings.enableMonetaryValuation && (
                        <>
                          <th className="px-3 py-2.5 text-right">Tarifa</th>
                          <th className="px-3 py-2.5 text-right">Total a Pagar</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {detailedWorkerRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2 font-mono text-[11px] font-bold text-slate-500">
                          {row.workerId}
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                          {row.workerRut}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {row.workerName}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{row.labor}</td>
                        <td className="px-3 py-2 text-slate-600 truncate max-w-[130px]">
                          {row.branchName}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                            {row.paymentMode}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                          <div className="flex items-center justify-end gap-2">
                            <span>
                              {row.quantity.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
                            </span>
                            {isEditMode && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRow({
                                    workerId: row.workerId,
                                    workerName: row.workerName,
                                    workerRut: row.workerRut,
                                    labor: row.labor,
                                    currentQuantity: row.quantity,
                                    newQuantity: row.quantity,
                                    paymentMode: row.paymentMode,
                                    unitRate: row.unitRate,
                                    justification: '',
                                  });
                                }}
                                className="no-print inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-sans font-bold transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3 text-amber-800" />
                                <span>Editar</span>
                              </button>
                            )}
                          </div>
                        </td>
                        {settings.enableMonetaryValuation && (
                          <>
                            <td className="px-3 py-2 text-right font-mono text-slate-500 text-[11px]">
                              {formatCLP(row.unitRate)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-emerald-900">
                              {formatCLP(row.totalCalculated)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {/* Table Footer */}
                  <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan={6} className="px-3 py-2.5 text-right uppercase text-slate-700">
                        Total {detailedWorkerRows.length} trabajadores registrados:
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-900">
                        {detailedWorkerRows
                          .reduce((s, r) => s + r.quantity, 0)
                          .toLocaleString('es-CL', { maximumFractionDigits: 1 })}
                      </td>
                      {settings.enableMonetaryValuation && (
                        <>
                          <td />
                          <td className="px-3 py-2.5 text-right font-mono text-emerald-950 font-extrabold text-sm">
                            {formatCLP(totalMontoAPagar)}
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RESUMEN EJECUTIVO (CLEAN, AIRY & CONCISE) */}
        {/* ========================================================= */}
        {reportType === 'general' && (
          <div className="space-y-6">
            {/* 4 Clean Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/70">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Trabajadores Activos
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                  {activeWorkersCount}
                </span>
                <span className="text-[10px] text-slate-400">Dotación operativa</span>
              </div>

              <div className="border border-slate-200 p-3.5 rounded-xl bg-emerald-50/50">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Altas en Período
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-900 mt-1 block">
                  +{periodIncorporations.length}
                </span>
                <span className="text-[10px] text-emerald-700">Incorporaciones</span>
              </div>

              <div className="border border-slate-200 p-3.5 rounded-xl bg-rose-50/50">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                  Bajas en Período
                </span>
                <span className="text-2xl font-bold font-mono text-rose-900 mt-1 block">
                  -{periodDepartures.length}
                </span>
                <span className="text-[10px] text-rose-700">Desvinculaciones</span>
              </div>

              <div className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/70">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {settings.enableMonetaryValuation ? 'Total Liquidación' : 'Registros de Faena'}
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
                  {settings.enableMonetaryValuation
                    ? formatCLP(totalMontoAPagar)
                    : filteredProduction.length}
                </span>
                <span className="text-[10px] text-slate-400">
                  {settings.enableMonetaryValuation ? 'Valor estimado' : 'Jornadas auditadas'}
                </span>
              </div>
            </div>

            {/* 1. Physical Units Summary (Omits zero units) */}
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 flex items-center justify-between">
                <span>1. Consolidado Físico por Unidad de Medida</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Unidades en cero quedan excluidas)
                </span>
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="px-3 py-2">Unidad de Medida</th>
                      <th className="px-3 py-2">Labores Principales</th>
                      <th className="px-3 py-2 text-right">Cantidad Acumulada</th>
                      {settings.enableMonetaryValuation && (
                        <th className="px-3 py-2 text-right">Monto Estimado</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-mono">
                    {activeUnitSummaries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={settings.enableMonetaryValuation ? 4 : 3}
                          className="px-3 py-4 text-center font-sans text-slate-400 italic"
                        >
                          No hay faenas registradas con cantidad mayor a cero en el período.
                        </td>
                      </tr>
                    ) : (
                      activeUnitSummaries.map(u => (
                        <tr key={u.mode} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-sans font-bold text-slate-900">
                            {u.name}
                          </td>
                          <td className="px-3 py-2 font-sans text-slate-600">{u.labors}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">
                            {formatQuantity(u.quantity)} {u.unitLabel}
                          </td>
                          {settings.enableMonetaryValuation && (
                            <td className="px-3 py-2 text-right font-bold text-emerald-800">
                              {formatCLP(u.amount)}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Breakdown by Faena */}
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
                2. Desglose Consolidado por Faena / Predio
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="px-3 py-2">Faena / Predio</th>
                      <th className="px-3 py-2">Encargado</th>
                      <th className="px-3 py-2 text-center">Dotación Activa</th>
                      <th className="px-3 py-2 text-center">Altas / Bajas</th>
                      <th className="px-3 py-2 text-right">Producción en Período</th>
                      {settings.enableMonetaryValuation && (
                        <th className="px-3 py-2 text-right">Total a Pagar</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {branchSummaries.map(bs => (
                      <tr key={bs.branch.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-bold text-slate-900">
                          <div>{bs.branch.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {bs.branch.location}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          <div>{bs.branch.manager}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{bs.branch.phone}</div>
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-slate-900">
                          {bs.activeWorkers}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-xs">
                          <span className="text-emerald-700 font-bold">+{bs.incorporations}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-rose-700 font-bold">-{bs.departures}</span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-900">
                          {bs.units.length === 0 ? (
                            <span className="text-slate-400 text-[11px]">Sin registros</span>
                          ) : (
                            bs.units.map(u => (
                              <div key={u.mode} className="font-bold text-[11px]">
                                {formatQuantity(u.quantity)} {u.unit}
                              </div>
                            ))
                          )}
                        </td>
                        {settings.enableMonetaryValuation && (
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800">
                            {formatCLP(bs.totalAmount)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: INFORME DE ALTAS */}
        {/* ========================================================= */}
        {reportType === 'altas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-950">
                  <UserPlus className="w-4 h-4 text-emerald-700" />
                  <span>Nómina de Nuevas Altas en Faena</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Trabajadores incorporados en el período ({formatDate(startDate)} al {formatDate(endDate)}).
                </p>
              </div>
              <span className="text-xs font-bold font-mono px-3 py-1 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-300">
                {periodHiredWorkers.length} Incorporaciones
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Fecha Ingreso</th>
                    <th className="px-3 py-2.5">RUT</th>
                    <th className="px-3 py-2.5">Nombre Completo</th>
                    <th className="px-3 py-2.5">Faena Asignada</th>
                    <th className="px-3 py-2.5">Labor</th>
                    <th className="px-3 py-2.5">Tipo Contrato</th>
                    <th className="px-3 py-2.5">Previsión / Salud</th>
                    <th className="px-3 py-2.5 text-center">Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {periodHiredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-400 italic">
                        No se registraron altas en la fecha y faena seleccionadas.
                      </td>
                    </tr>
                  ) : (
                    periodHiredWorkers.map(w => {
                      const b = branches.find(br => br.id === w.branchId);
                      const hasContractDoc = (w.documents || []).some(d => d.category === 'CONTRATO');

                      return (
                        <tr key={w.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-bold text-slate-900">
                            {formatDate(w.hireDate)}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700">{w.rut}</td>
                          <td className="px-3 py-2 font-bold text-slate-900">{w.name}</td>
                          <td className="px-3 py-2 text-slate-700 truncate max-w-[140px]">{b?.name || w.branchId}</td>
                          <td className="px-3 py-2 text-slate-700">{w.labor}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {w.contractType === 'INDEFINIDO'
                              ? 'Indefinido'
                              : w.contractType === 'PLAZO_FIJO'
                              ? 'Plazo Fijo'
                              : 'Por Faena (Art. 159)'}
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-[11px]">
                            {w.afp} / {w.health}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {hasContractDoc ? (
                              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Adjunto</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-900 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-300 text-[10px]">
                                <span>Pendiente</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: INFORME DE BAJAS */}
        {/* ========================================================= */}
        {reportType === 'bajas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-950">
                  <UserMinus className="w-4 h-4 text-rose-700" />
                  <span>Nómina de Bajas y Término de Faena</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Trabajadores desvinculados o con finiquito en el período ({formatDate(startDate)} al {formatDate(endDate)}).
                </p>
              </div>
              <span className="text-xs font-bold font-mono px-3 py-1 bg-rose-50 text-rose-900 rounded-lg border border-rose-300">
                {periodRetiredWorkers.length} Desvinculaciones
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Fecha Baja</th>
                    <th className="px-3 py-2.5">RUT</th>
                    <th className="px-3 py-2.5">Nombre del Trabajador</th>
                    <th className="px-3 py-2.5">Faena</th>
                    <th className="px-3 py-2.5">Labor</th>
                    <th className="px-3 py-2.5">Causal Legal</th>
                    <th className="px-3 py-2.5 text-center">Finiquito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {periodRetiredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-slate-400 italic">
                        No se registraron bajas en la fecha y faena seleccionadas.
                      </td>
                    </tr>
                  ) : (
                    periodRetiredWorkers.map(w => {
                      const b = branches.find(br => br.id === w.branchId);
                      const hasFiniquito = (w.documents || []).some(d => d.category === 'FINIQUITO');

                      return (
                        <tr key={w.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-mono font-bold text-rose-900">
                            {formatDate(w.departureDate)}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700">{w.rut}</td>
                          <td className="px-3 py-2 font-bold text-slate-900">{w.name}</td>
                          <td className="px-3 py-2 text-slate-700 truncate max-w-[140px]">{b?.name || w.branchId}</td>
                          <td className="px-3 py-2 text-slate-700">{w.labor}</td>
                          <td className="px-3 py-2 text-slate-800 text-[11px]">
                            {w.departureReason || 'Conclusión de la faena asignada (Art. 159 N°5)'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {hasFiniquito ? (
                              <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Firmado</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-800 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                                <span>Pendiente</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formal Signature Footnotes for Printing */}
        <div className="pt-10 border-t border-slate-300 grid grid-cols-2 gap-10 text-center text-xs">
          <div>
            <div className="w-48 border-b border-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-900">Encargado de Faena / Supervisor</p>
            <p className="text-slate-500 text-[11px]">Revisión y conformidad de faenas en campo</p>
          </div>

          <div>
            <div className="w-48 border-b border-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-900">Administración / Contratista</p>
            <p className="text-slate-500 text-[11px]">Conforme para cálculo de nómina y pago</p>
          </div>
        </div>

        {/* Footer info: uses configured companyName, never Legion */}
        <div className="pt-4 text-center text-[10px] text-slate-400 font-mono">
          Documento oficial de control laboral · {settings.companyName || 'Empresa'} · Impreso el {new Date().toLocaleString('es-CL')}
        </div>
      </div>

      {/* MODAL FOR DIRECT ADJUSTMENT OF WORKER PRODUCTION QUANTITY */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <Edit3 className="w-4 h-4 text-amber-800" />
                <h3>Ajustar Cantidad Producida</h3>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                <div className="font-bold text-slate-900 text-sm">{editingRow.workerName}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  RUT: {editingRow.workerRut} · ID: {editingRow.workerId}
                </div>
                <div className="text-slate-700 pt-1 border-t border-slate-200 mt-1">
                  Labor: <strong className="text-slate-900">{editingRow.labor}</strong> · Unidad:{' '}
                  <strong className="text-slate-900">{editingRow.paymentMode}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cantidad Actual en el Período:
                </label>
                <div className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  {editingRow.currentQuantity} {editingRow.paymentMode.toLowerCase()}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nueva Cantidad Ajustada:
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={editingRow.newQuantity}
                  onChange={e =>
                    setEditingRow({
                      ...editingRow,
                      newQuantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Diferencia:{' '}
                  <strong
                    className={
                      editingRow.newQuantity - editingRow.currentQuantity >= 0
                        ? 'text-emerald-700 font-bold'
                        : 'text-rose-700 font-bold'
                    }
                  >
                    {editingRow.newQuantity - editingRow.currentQuantity >= 0 ? '+' : ''}
                    {(editingRow.newQuantity - editingRow.currentQuantity).toLocaleString('es-CL')}{' '}
                    {editingRow.paymentMode.toLowerCase()}
                  </strong>
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Justificación / Motivo del Ajuste:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ajuste de pesaje en báscula, día compensatorio"
                  value={editingRow.justification}
                  onChange={e =>
                    setEditingRow({
                      ...editingRow,
                      justification: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-700"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Quedará registrado en la bitácora de auditoría.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-4 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-bold shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Ajuste</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
