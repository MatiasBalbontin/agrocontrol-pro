import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Worker, ProductionRecord, PaymentMode } from '../types';
import {
  ClipboardList,
  Table,
  Smartphone,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  Calendar,
  Building2,
  Check,
  FileCheck,
  CheckSquare,
  Square,
  Users,
  AlertCircle,
  HelpCircle,
  Lock,
  Unlock,
  Edit3,
} from 'lucide-react';
import {
  formatCLP,
  formatQuantity,
  formatDate,
  getTodayDateString,
  getUnitSymbol,
  getUnitName,
} from '../utils/formatters';
import { ProductionCalendarModal } from './ProductionCalendarModal';
import { TabType } from './Navbar';

interface ProductionViewProps {
  onNavigate?: (tab: TabType) => void;
}

export const ProductionView: React.FC<ProductionViewProps> = ({ onNavigate }) => {
  const {
    workers,
    branches,
    production,
    activeBranchId,
    addProductionRecord,
    batchAddProduction,
    updateProductionRecord,
    deleteProductionRecord,
    settings,
    selectedProductionDate,
    setSelectedProductionDate,
    setActiveBranchId,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'batch' | 'quick' | 'list'>('batch');

  // Common filters: initialize from global selectedProductionDate if available
  const [selectedDate, setSelectedDate] = useState(
    selectedProductionDate || getTodayDateString()
  );
  const [selectedBranchId, setSelectedBranchId] = useState(
    activeBranchId !== 'ALL' ? activeBranchId : branches[0]?.id || ''
  );

  // Sync selected date when changed from CalendarView or navigation
  useEffect(() => {
    if (selectedProductionDate && selectedProductionDate !== selectedDate) {
      setSelectedDate(selectedProductionDate);
    }
  }, [selectedProductionDate]);

  // Calendar Modal State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Save Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Sync selected branch if global filter changes to a specific branch
  useEffect(() => {
    if (activeBranchId !== 'ALL') {
      setSelectedBranchId(activeBranchId);
    }
  }, [activeBranchId]);

  // --- SUBTAB 1: BATCH SPREADSHEET WITH CHECK ATTENDANCE ---
  const [batchData, setBatchData] = useState<
    Record<string, { isChecked: boolean; quantity: number; labor: string; notes?: string }>
  >({});
  const [batchSearch, setBatchSearch] = useState('');
  const [batchSavedNotice, setBatchSavedNotice] = useState<string | null>(null);
  const [batchWarningNotice, setBatchWarningNotice] = useState<string | null>(null);
  const [isUnlockedForEdit, setIsUnlockedForEdit] = useState(false);

  // Active workers of the selected branch
  const batchWorkers = useMemo(() => {
    return workers.filter(
      w => w.status === 'ACTIVO' && (!selectedBranchId || w.branchId === selectedBranchId)
    );
  }, [workers, selectedBranchId]);

  // Existing records for selected date and branch with quantity > 0
  const existingForDay = useMemo(() => {
    return production.filter(
      p => p.date === selectedDate && (!selectedBranchId || p.branchId === selectedBranchId) && p.quantity > 0
    );
  }, [production, selectedDate, selectedBranchId]);

  const hasSavedRecordsForDay = existingForDay.length > 0;

  // Filtered batch workers for search inside table
  const displayedBatchWorkers = useMemo(() => {
    if (!batchSearch.trim()) return batchWorkers;
    const term = batchSearch.toLowerCase();
    return batchWorkers.filter(
      w =>
        w.name.toLowerCase().includes(term) ||
        w.rut.toLowerCase().includes(term) ||
        w.id.toLowerCase().includes(term) ||
        w.labor.toLowerCase().includes(term)
    );
  }, [batchWorkers, batchSearch]);

  // Reset unlocked state when date or branch changes
  useEffect(() => {
    setIsUnlockedForEdit(false);
    setBatchWarningNotice(null);
  }, [selectedDate, selectedBranchId]);

  // Load existing records for this date/branch or initialize as NOT ATTENDING
  useEffect(() => {
    const existingMap = new Map(existingForDay.map(p => [p.workerId, p]));

    const initial: Record<
      string,
      { isChecked: boolean; quantity: number; labor: string; notes?: string }
    > = {};

    batchWorkers.forEach(w => {
      const existing = existingMap.get(w.id);
      if (existing && existing.quantity > 0) {
        initial[w.id] = {
          isChecked: true,
          quantity: Math.round(existing.quantity) || 1,
          labor: existing.labor || w.labor,
          notes: existing.notes || '',
        };
      } else {
        // BY DEFAULT: ALL NON-ATTENDING (quantity: 0, isChecked: false)
        // Production fills additively with who actually attends
        initial[w.id] = {
          isChecked: false,
          quantity: 0,
          labor: w.labor,
          notes: '',
        };
      }
    });

    setBatchData(initial);
  }, [batchWorkers, selectedBranchId, selectedDate, existingForDay]);

  const isLocked = hasSavedRecordsForDay && !isUnlockedForEdit;

  const toggleWorkerCheck = (workerId: string) => {
    if (isLocked) {
      setBatchWarningNotice(
        'Esta faena ya fue guardada y está bloqueada para proteger la auditoría. Presione "Modificar Asistencia Guardada" para desbloquearla y hacer cambios.'
      );
      return;
    }
    setBatchWarningNotice(null);
    setBatchData(prev => {
      const current = prev[workerId];
      if (!current) return prev;
      const newChecked = !current.isChecked;
      return {
        ...prev,
        [workerId]: {
          ...current,
          isChecked: newChecked,
          quantity: newChecked ? 1 : 0,
        },
      };
    });
  };

  const markAllChecks = () => {
    if (isLocked) {
      setBatchWarningNotice('La faena está bloqueada. Habilite la edición antes de marcar checks.');
      return;
    }
    setBatchWarningNotice(null);
    setBatchData(prev => {
      const updated = { ...prev };
      batchWorkers.forEach(w => {
        updated[w.id] = {
          ...updated[w.id],
          isChecked: true,
          quantity: updated[w.id]?.quantity > 0 ? updated[w.id].quantity : 1,
        };
      });
      return updated;
    });
  };

  const unmarkAllChecks = () => {
    if (isLocked) {
      setBatchWarningNotice('La faena está bloqueada. Habilite la edición antes de desmarcar checks.');
      return;
    }
    setBatchWarningNotice(null);
    setBatchData(prev => {
      const updated = { ...prev };
      batchWorkers.forEach(w => {
        updated[w.id] = {
          ...updated[w.id],
          isChecked: false,
          quantity: 0,
        };
      });
      return updated;
    });
  };

  const handleBatchLaborChange = (workerId: string, labor: string) => {
    setBatchData(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        labor,
      },
    }));
  };

  const handleBatchDaysChange = (workerId: string, daysStr: string) => {
    const intVal = parseInt(daysStr, 10);
    const validQty = isNaN(intVal) || intVal < 0 ? 0 : intVal;
    setBatchData(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        quantity: validQty,
        isChecked: validQty > 0,
      },
    }));
  };

  const handleBatchNotesChange = (workerId: string, notes: string) => {
    setBatchData(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        notes,
      },
    }));
  };

  const presentCount = useMemo(() => {
    return batchWorkers.filter(w => batchData[w.id]?.isChecked && batchData[w.id]?.quantity > 0)
      .length;
  }, [batchWorkers, batchData]);

  // Trigger Confirmation Modal
  const handlePreSaveBatch = () => {
    if (presentCount === 0) {
      setBatchWarningNotice('Por favor marque al menos a un trabajador con Check (asistió) antes de guardar.');
      return;
    }
    setBatchWarningNotice(null);
    setIsConfirmModalOpen(true);
  };

  // Execute Confirmed Save
  const handleConfirmSaveBatch = () => {
    const recordsToSave: Parameters<typeof batchAddProduction>[0] = [];

    batchWorkers.forEach(worker => {
      const entry = batchData[worker.id];
      if (entry && entry.isChecked && entry.quantity > 0) {
        const qty = Math.round(entry.quantity); // Integer days
        const rate = worker.unitRate || 28000;
        recordsToSave.push({
          date: selectedDate,
          branchId: selectedBranchId || worker.branchId,
          workerId: worker.id,
          labor: entry.labor || worker.labor,
          paymentMode: worker.paymentMode || 'DÍA',
          quantity: qty,
          unitRate: rate,
          totalCalculated: qty * rate,
          notes: entry.notes || undefined,
        });
      }
    });

    const count = batchAddProduction(recordsToSave, selectedDate, selectedBranchId);
    setIsConfirmModalOpen(false);
    setIsUnlockedForEdit(false);

    setBatchSavedNotice(
      `¡Asistencia guardada y cerrada! Se registraron ${count} trabajadores con Check en faena para el ${formatDate(
        selectedDate
      )}.`
    );
    setTimeout(() => setBatchSavedNotice(null), 5000);
  };

  // --- SUBTAB 2: Quick Mobile Entry State ---
  const [quickWorkerSearch, setQuickWorkerSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [quickLabor, setQuickLabor] = useState('');
  const [quickDays, setQuickDays] = useState<number>(1);
  const [quickNotes, setQuickNotes] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const availableWorkersForQuick = useMemo(() => {
    const activeOnly = workers.filter(w => w.status === 'ACTIVO');
    const branchFiltered =
      selectedBranchId ? activeOnly.filter(w => w.branchId === selectedBranchId) : activeOnly;

    if (!quickWorkerSearch.trim()) return branchFiltered.slice(0, 10);

    const term = quickWorkerSearch.toLowerCase();
    return branchFiltered.filter(
      w =>
        w.name.toLowerCase().includes(term) ||
        w.rut.toLowerCase().includes(term) ||
        w.id.toLowerCase().includes(term)
    );
  }, [workers, selectedBranchId, quickWorkerSearch]);

  const handleSelectWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setQuickLabor(worker.labor);
    setQuickDays(1);
    setQuickWorkerSearch('');
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || quickDays <= 0) return;

    const qty = Math.round(quickDays);
    const unitRate = selectedWorker.unitRate || 28000;
    const total = qty * unitRate;

    addProductionRecord({
      date: selectedDate,
      branchId: selectedBranchId || selectedWorker.branchId,
      workerId: selectedWorker.id,
      labor: quickLabor || selectedWorker.labor,
      paymentMode: selectedWorker.paymentMode || 'DÍA',
      quantity: qty,
      unitRate,
      totalCalculated: total,
      notes: quickNotes.trim() || undefined,
    });

    setSuccessToast(
      `Asistencia guardada: ${selectedWorker.name} (${qty} ${qty === 1 ? 'jornada' : 'jornadas'})`
    );
    setTimeout(() => setSuccessToast(null), 3000);

    setQuickNotes('');
  };

  // --- SUBTAB 3: Records History List & Inline Editing ---
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(1);
  const [editLabor, setEditLabor] = useState<string>('');

  const filteredProductionList = useMemo(() => {
    return production.filter(p => {
      const matchDate = !selectedDate || p.date === selectedDate;
      const matchBranch =
        activeBranchId === 'ALL'
          ? !selectedBranchId || p.branchId === selectedBranchId
          : p.branchId === activeBranchId;
      return matchDate && matchBranch;
    });
  }, [production, selectedDate, activeBranchId, selectedBranchId]);

  const branchObj = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="space-y-4">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-800" />
            <h1 className="text-lg font-bold text-slate-900">
              Control de Asistencia y Producción
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pase de lista con Check por trabajador, confirmación obligatoria de guardado y calendario de verificación.
          </p>
        </div>

        {/* Action Controls & Dual Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar Verification Button */}
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold transition-all border border-emerald-300 shadow-xs"
            title="Abrir calendario para verificar días con faena registrada (en verde)"
          >
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Calendario de Faenas</span>
          </button>

          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setActiveSubTab('batch')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'batch'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-700" />
              <span>Planilla con Check</span>
            </button>
            <button
              onClick={() => setActiveSubTab('quick')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'quick'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <span>Individual Móvil</span>
            </button>
            <button
              onClick={() => setActiveSubTab('list')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'list'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>Historial ({filteredProductionList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date & Branch Common Selector */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="font-bold text-slate-700">Fecha de Faena:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                if (e.target.value) {
                  setSelectedProductionDate(e.target.value);
                }
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-1 focus:ring-emerald-700"
            />
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-300 transition-colors shadow-xs"
              title="Abrir calendario para verificar días con faena registrada (en verde)"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ver Calendario</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-800" />
            <span className="font-bold text-slate-700">Faena:</span>
            <select
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:ring-1 focus:ring-emerald-700"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Attendance Counter & Status Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {hasSavedRecordsForDay ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-950 font-bold rounded-lg border border-emerald-300">
              <Lock className="w-3.5 h-3.5 text-emerald-800" />
              <span>Guardada y Bloqueada</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Nueva Faena Pendiente</span>
            </span>
          )}

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            <Users className="w-4 h-4 text-emerald-800" />
            <span className="text-slate-700">
              Checks de Asistencia:{' '}
              <strong className="text-emerald-900 font-mono font-bold text-sm">
                {presentCount} / {batchWorkers.length}
              </strong>{' '}
              presentes ({batchWorkers.length > 0 ? ((presentCount / batchWorkers.length) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: PLANILLA MASIVA CON CHECK (ATTENDANCE) */}
      {/* ========================================================= */}
      {activeSubTab === 'batch' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          {/* Quick Action Bar for Field Supervisor */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            {isLocked ? (
              /* LOCKED STATE: Prompt and button to enable edit */
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 bg-emerald-50 text-emerald-950 font-bold rounded-lg border border-emerald-300 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-800" />
                  <span>Faena Guardada y Bloqueada ({presentCount} presentes)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUnlockedForEdit(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-xs transition-colors"
                  title="Habilitar edición para modificar los Checks guardados de este día"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modificar Asistencia Guardada</span>
                </button>
              </div>
            ) : isUnlockedForEdit ? (
              /* EDITING STATE FOR ALREADY SAVED DAY */
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1 bg-amber-100 text-amber-950 font-bold rounded-lg border border-amber-300 flex items-center gap-1.5 text-xs">
                  <Unlock className="w-3.5 h-3.5 text-amber-800" />
                  <span>Modo Edición Habilitado</span>
                </div>
                <button
                  type="button"
                  onClick={markAllChecks}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Marcar Todos</span>
                </button>
                <button
                  type="button"
                  onClick={unmarkAllChecks}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
                >
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                  <span>Desmarcar Todos</span>
                </button>
              </div>
            ) : (
              /* NEW UNRECORDED DAY */
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={markAllChecks}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Marcar Todos los Checks (1 Día)</span>
                </button>
                <button
                  type="button"
                  onClick={unmarkAllChecks}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
                >
                  <Square className="w-4 h-4 text-slate-500" />
                  <span>Desmarcar Todos los Checks</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en la planilla..."
                  value={batchSearch}
                  onChange={e => setBatchSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              {/* Action Buttons depending on Lock/Edit state */}
              {isLocked ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Guardado ({presentCount})</span>
                </div>
              ) : isUnlockedForEdit ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsUnlockedForEdit(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handlePreSaveBatch}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Actualizar Faena ({presentCount})</span>
                  </button>
                </div>
              ) : (
                /* New Day Save */
                <button
                  type="button"
                  onClick={handlePreSaveBatch}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Asistencia ({presentCount})</span>
                </button>
              )}
            </div>
          </div>

          {batchSavedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-950 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{batchSavedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setBatchSavedNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs px-2 py-0.5 rounded"
              >
                Cerrar
              </button>
            </div>
          )}

          {batchWarningNotice && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-950 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />
                <span>{batchWarningNotice}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlockedForEdit(true);
                      setBatchWarningNotice(null);
                    }}
                    className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-md text-xs font-bold shadow-xs transition-colors"
                  >
                    Habilitar Edición Ahora
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setBatchWarningNotice(null)}
                  className="text-amber-800 hover:text-amber-950 text-xs px-1.5 py-0.5"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {displayedBatchWorkers.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No hay trabajadores activos en la sucursal seleccionada.
            </p>
          ) : (
            <div className="w-full border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200 table-fixed">
                <thead className="bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5 w-[14%] text-center">Check Asistencia</th>
                    <th className="px-3 py-2.5 w-[20%]">ID / RUT</th>
                    <th className="px-3 py-2.5 w-[26%]">Nombre Trabajador</th>
                    <th className="px-3 py-2.5 w-[22%]">Labor de Faena</th>
                    <th className="px-3 py-2.5 w-[18%]">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedBatchWorkers.map(w => {
                    const rowData = batchData[w.id] || {
                      isChecked: false,
                      quantity: 0,
                      labor: w.labor,
                      notes: '',
                    };
                    const isChecked = rowData.isChecked && rowData.quantity > 0;

                    return (
                      <tr
                        key={w.id}
                        className={`transition-colors ${
                          isChecked
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 font-medium'
                            : 'bg-white hover:bg-slate-50 opacity-75'
                        }`}
                      >
                        {/* High-speed CHECK BUTTON */}
                        <td className="px-3 py-1.5 text-center whitespace-nowrap">
                          {isLocked ? (
                            <div
                              className={`min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center mx-auto border select-none ${
                                isChecked
                                  ? 'bg-emerald-700 text-white border-emerald-800'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                              title="Faena guardada y bloqueada. Presione 'Modificar Asistencia Guardada' arriba para editar."
                            >
                              {isChecked ? (
                                <Check className="w-5 h-5 stroke-[3]" />
                              ) : (
                                <span className="text-[10px] font-bold">Ausente</span>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleWorkerCheck(w.id)}
                              className={`min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center transition-all mx-auto border ${
                                isChecked
                                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800 scale-105 shadow-xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-400 border-slate-300'
                              }`}
                              title={isChecked ? 'Marcar ausente' : 'Marcar presente con Check'}
                            >
                              {isChecked ? (
                                <Check className="w-5 h-5 stroke-[3]" />
                              ) : (
                                <span className="text-[10px] font-bold">Check</span>
                              )}
                            </button>
                          )}
                        </td>

                        {/* ID & RUT */}
                        <td className="px-3 py-1.5 font-mono truncate">
                          <span className="font-bold text-emerald-900 block leading-tight">
                            {w.id}
                          </span>
                          <span className="text-[11px] text-slate-500 block leading-tight">
                            {w.rut}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="px-3 py-1.5 truncate">
                          <span className="font-bold text-slate-900 block truncate" title={w.name}>
                            {w.name}
                          </span>
                          {isChecked ? (
                            <span className="text-[10px] text-emerald-800 font-bold">
                              ✓ Presente (1 Día)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Ausente</span>
                          )}
                        </td>

                        {/* Labor */}
                        <td className="px-3 py-1.5 truncate">
                          {isLocked ? (
                            <span className="text-slate-800 font-medium block truncate">{rowData.labor}</span>
                          ) : (
                            <input
                              type="text"
                              value={rowData.labor}
                              onChange={e => handleBatchLaborChange(w.id, e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-700"
                            />
                          )}
                        </td>

                        {/* Observation */}
                        <td className="px-3 py-1.5 truncate">
                          {isLocked ? (
                            <span className="text-slate-500 italic text-[11px] block truncate">
                              {rowData.notes || '-'}
                            </span>
                          ) : (
                            <input
                              type="text"
                              placeholder="Nota..."
                              value={rowData.notes || ''}
                              onChange={e => handleBatchNotesChange(w.id, e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-700"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <span className="text-xs text-slate-600">
              Total con Check de asistencia:{' '}
              <strong className="text-emerald-900 font-bold">{presentCount} trabajadores</strong>.
            </span>

            <button
              type="button"
              onClick={handlePreSaveBatch}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Asistencia de Cuadrilla</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: REGISTRO INDIVIDUAL RÁPIDO */}
      {/* ========================================================= */}
      {activeSubTab === 'quick' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-emerald-700" />
                1. Seleccionar Trabajador
              </h2>
              <p className="text-xs text-slate-500">
                Busque por RUT o nombre para ingresar asistencia individual.
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por RUT o nombre..."
                value={quickWorkerSearch}
                onChange={e => setQuickWorkerSearch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700 text-slate-900"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto border border-slate-200 rounded-lg">
              {availableWorkersForQuick.map(w => {
                const isSelected = selectedWorker?.id === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleSelectWorker(w)}
                    className={`w-full p-2.5 text-left transition-colors flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-bold border-l-4 border-emerald-700'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{w.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {w.rut} · {w.labor}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Día
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              2. Confirmar Jornada Individual
            </h2>

            {selectedWorker ? (
              <form onSubmit={handleQuickSubmit} className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold">
                      {selectedWorker.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{selectedWorker.name}</h3>
                    <p className="text-xs text-slate-600 font-mono">{selectedWorker.rut}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-900">
                    Día Asistido
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Labor de Faena
                  </label>
                  <input
                    type="text"
                    required
                    value={quickLabor}
                    onChange={e => setQuickLabor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Días Asistidos (Entero) *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="10"
                      required
                      value={quickDays}
                      onChange={e => setQuickDays(parseInt(e.target.value, 10) || 1)}
                      className="w-28 px-3 py-2 border-2 border-emerald-600 rounded-xl text-xl font-bold font-mono text-slate-900 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickDays(1)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold"
                    >
                      1 Jornada
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Observación (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Turno mañana, etc."
                    value={quickNotes}
                    onChange={e => setQuickNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Asistencia Individual</span>
                </button>

                {successToast && (
                  <p className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 text-center">
                    {successToast}
                  </p>
                )}
              </form>
            ) : (
              <p className="text-xs text-slate-400 py-10 text-center">
                Seleccione un trabajador de la lista izquierda.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: REGISTROS HISTÓRICOS Y EDICIÓN */}
      {/* ========================================================= */}
      {activeSubTab === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Registros Guardados para el {formatDate(selectedDate)}
            </h2>
          </div>

          {filteredProductionList.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">
              Sin registros para esta fecha. Use la pestaña "Planilla con Check" para registrar la faena.
            </p>
          ) : (
            <div className="w-full border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200 table-fixed">
                <thead className="bg-slate-50 font-bold text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5 w-[20%]">ID / RUT</th>
                    <th className="px-3 py-2.5 w-[30%]">Trabajador</th>
                    <th className="px-3 py-2.5 w-[25%]">Labor</th>
                    <th className="px-3 py-2.5 w-[12%] text-center">Jornadas</th>
                    <th className="px-3 py-2.5 w-[13%] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProductionList.map(rec => {
                    const worker = workers.find(w => w.id === rec.workerId);
                    const isEditing = editingRecordId === rec.id;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono truncate">
                          <span className="font-bold text-slate-900 block">{rec.workerId}</span>
                          <span className="text-[11px] text-slate-500">{worker?.rut}</span>
                        </td>

                        <td className="px-3 py-2 truncate font-bold text-slate-900">
                          {worker?.name || 'Trabajador'}
                        </td>

                        <td className="px-3 py-2 truncate">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editLabor}
                              onChange={e => setEditLabor(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs w-full"
                            />
                          ) : (
                            rec.labor
                          )}
                        </td>

                        <td className="px-3 py-2 text-center font-bold font-mono text-slate-900">
                          {isEditing ? (
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={editQty}
                              onChange={e => setEditQty(parseInt(e.target.value, 10) || 0)}
                              className="px-2 py-1 border border-slate-300 rounded text-xs w-16 text-center"
                            />
                          ) : (
                            `${Math.round(rec.quantity)} d`
                          )}
                        </td>

                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  updateProductionRecord(rec.id, {
                                    quantity: editQty,
                                    labor: editLabor,
                                  });
                                  setEditingRecordId(null);
                                }}
                                className="px-2 py-0.5 bg-emerald-800 text-white rounded text-xs font-bold"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingRecordId(null)}
                                className="px-2 py-0.5 border border-slate-300 rounded text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingRecordId(rec.id);
                                  setEditQty(Math.round(rec.quantity));
                                  setEditLabor(rec.labor);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800 rounded"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('¿Eliminar este registro de asistencia?')) {
                                    deleteProductionRecord(rec.id);
                                  }
                                }}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL BEFORE SAVING ATTENDANCE (MANDATORY CONFIRMATION) */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <HelpCircle className="w-5 h-5 text-emerald-800" />
                <h3>¿Confirmar Registro de Asistencia?</h3>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                Está a punto de guardar la asistencia de la faena con los siguientes datos:
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de Faena:</span>
                  <span className="font-bold text-slate-900">{formatDate(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sucursal / Fundo:</span>
                  <span className="font-bold text-slate-900">{branchObj?.name || selectedBranchId}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500">Trabajadores con Check:</span>
                  <span className="font-bold text-emerald-900 font-mono text-sm">
                    {presentCount} presentes ({batchWorkers.length - presentCount} ausentes)
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Al confirmar, el sistema almacenará permanentemente las jornadas asistidas y quedará registrado el evento en la bitácora de auditoría.
              </p>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar / Revisar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveBatch}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-xs"
                >
                  Sí, Confirmar y Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR VERIFICATION MODAL (DAYS WITH PRODUCTION IN GREEN) */}
      <ProductionCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedBranchId={selectedBranchId}
        currentSelectedDate={selectedDate}
        onSelectDate={(dateStr, branchId) => {
          setSelectedDate(dateStr);
          setSelectedProductionDate(dateStr);
          if (branchId && branches.some(b => b.id === branchId)) {
            setSelectedBranchId(branchId);
            setActiveBranchId(branchId);
          }
          setActiveSubTab('batch');
        }}
      />
    </div>
  );
};
