import React, { createContext, useContext, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Branch,
  Worker,
  WorkerMovement,
  ProductionRecord,
  AppSettings,
  UserRole,
  AuditLogEntry,
  WorkerDocument,
} from '../types';
import {
  initialBranches,
  initialWorkers,
  initialMovements,
  initialProduction,
  initialSettings,
  initialAuditLogs,
} from '../data/mockData';
import { getTodayDateString, formatDate } from '../utils/formatters';
import { DEFAULT_CONTRACT_TEMPLATE } from '../data/contractDefaultTemplate';

export interface WorkerContractCompliance {
  status: 'NO_CONTRACT' | 'EXPIRED' | 'VALID';
  label: string;
  isBlinking: boolean;
  daysDiff?: number;
}

interface AppContextType {
  branches: Branch[];
  workers: Worker[];
  movements: WorkerMovement[];
  production: ProductionRecord[];
  auditLogs: AuditLogEntry[];
  settings: AppSettings;
  activeBranchId: string;
  currentRole: UserRole;
  selectedProductionDate: string;
  setSelectedProductionDate: (date: string) => void;
  setActiveBranchId: (id: string) => void;
  setCurrentRole: (role: UserRole) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addBranch: (branch: Omit<Branch, 'id'>) => string;
  updateBranch: (id: string, branch: Partial<Branch>) => void;
  addWorker: (worker: Omit<Worker, 'id'>) => string;
  updateWorker: (id: string, worker: Partial<Worker>) => void;
  retireWorker: (id: string, departureDate: string, departureReason: string) => void;
  rehireWorker: (id: string, rehireDate?: string) => void;
  deleteWorker: (id: string) => void;
  addWorkerDocument: (
    workerId: string,
    doc: Omit<WorkerDocument, 'id' | 'uploadDate'> & { uploadDate?: string }
  ) => void;
  deleteWorkerDocument: (workerId: string, documentId: string) => void;
  addProductionRecord: (record: Omit<ProductionRecord, 'id' | 'createdAt'>) => string;
  batchAddProduction: (
    records: Omit<ProductionRecord, 'id' | 'createdAt'>[],
    targetDate?: string,
    branchId?: string
  ) => number;
  updateProductionRecord: (id: string, record: Partial<ProductionRecord>) => void;
  deleteProductionRecord: (id: string) => void;
  adjustPeriodProduction: (
    workerId: string,
    labor: string,
    newQuantity: number,
    startDate: string,
    endDate: string,
    branchId: string,
    reason?: string
  ) => void;
  batchAdjustPeriodProduction: (
    adjustments: Array<{
      workerId: string;
      labor: string;
      newQuantity: number;
      startDate: string;
      endDate: string;
      branchId: string;
      reason?: string;
    }>
  ) => void;
  exportDataJSON: () => void;
  exportDataCSV: () => void;
  exportDataExcel: () => void;
  importDataJSON: (jsonString: string) => boolean;
  addAuditLog: (action: string, description: string) => void;
  archiveAuditLog: (id: string) => void;
  deleteAuditLogsAfterBackup: () => boolean;
  resetToDefaults: () => void;
  getWorkerContractStatus: (worker: Worker) => WorkerContractCompliance;
  generateContractText: (worker: Partial<Worker>, branchId?: string) => string;
  resetContractTemplate: () => void;
}

const STORAGE_KEY = 'legion_rrhh_state_v4';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_branches`);
      return saved ? JSON.parse(saved) : initialBranches;
    } catch {
      return initialBranches;
    }
  });

  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_workers`);
      return saved ? JSON.parse(saved) : initialWorkers;
    } catch {
      return initialWorkers;
    }
  });

  const [movements, setMovements] = useState<WorkerMovement[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_movements`);
      return saved ? JSON.parse(saved) : initialMovements;
    } catch {
      return initialMovements;
    }
  });

  const [production, setProduction] = useState<ProductionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_production`);
      return saved ? JSON.parse(saved) : initialProduction;
    } catch {
      return initialProduction;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_audit_logs`);
      return saved ? JSON.parse(saved) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      return saved ? { ...initialSettings, ...JSON.parse(saved) } : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [activeBranchId, setActiveBranchIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_activeBranch`) || 'ALL';
    } catch {
      return 'ALL';
    }
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    try {
      return (localStorage.getItem(`${STORAGE_KEY}_currentRole`) as UserRole) || 'ADMIN';
    } catch {
      return 'ADMIN';
    }
  });

  const [selectedProductionDate, setSelectedProductionDate] = useState<string>(() => {
    return getTodayDateString();
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_branches`, JSON.stringify(branches));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [branches]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_workers`, JSON.stringify(workers));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [workers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_movements`, JSON.stringify(movements));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_production`, JSON.stringify(production));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [production]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_audit_logs`, JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [settings]);

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    localStorage.setItem(`${STORAGE_KEY}_activeBranch`, id);
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    localStorage.setItem(`${STORAGE_KEY}_currentRole`, role);
    if (role === 'SUPERVISOR' && activeBranchId === 'ALL' && branches.length > 0) {
      setActiveBranchId(branches[0].id);
    }
  };

  const addAuditLog = (action: string, description: string) => {
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      description,
      user: currentRole === 'ADMIN' ? 'Administrador General' : 'Supervisor de Faena',
      archived: false,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const archiveAuditLog = (id: string) => {
    setAuditLogs(prev =>
      prev.map(l => (l.id === id ? { ...l, archived: true } : l))
    );
  };

  const deleteAuditLogsAfterBackup = (): boolean => {
    // Generate and download backup before clearing
    exportDataCSV();
    setAuditLogs([]);
    localStorage.removeItem(`${STORAGE_KEY}_audit_logs`);
    return true;
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog('CONFIGURACION_EMPRESA', 'Actualización de datos y parámetros de la empresa');
  };

  const addBranch = (branchData: Omit<Branch, 'id'>): string => {
    const id = `SUC-0${branches.length + 1}`;
    const newBranch: Branch = { ...branchData, id };
    setBranches(prev => [...prev, newBranch]);
    addAuditLog('CREAR_SUCURSAL', `Creación de sucursal/fundo "${branchData.name}" (${id})`);
    return id;
  };

  const updateBranch = (id: string, branchData: Partial<Branch>) => {
    setBranches(prev => prev.map(b => (b.id === id ? { ...b, ...branchData } : b)));
    addAuditLog('EDITAR_SUCURSAL', `Edición de sucursal ${id}`);
  };

  const addWorker = (workerData: Omit<Worker, 'id'>): string => {
    const maxNum = workers.reduce((acc, w) => {
      const match = w.id.match(/TRAB-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > acc ? num : acc;
      }
      return acc;
    }, 0);
    const nextId = `TRAB-${String(maxNum + 1).padStart(3, '0')}`;
    const newWorker: Worker = { ...workerData, id: nextId, paymentMode: workerData.paymentMode || 'DÍA' };

    setWorkers(prev => [newWorker, ...prev]);

    const newMovement: WorkerMovement = {
      id: `MOV-${Date.now()}`,
      workerId: nextId,
      workerName: newWorker.name,
      workerRut: newWorker.rut,
      branchId: newWorker.branchId,
      type: 'INGRESO',
      date: newWorker.hireDate || getTodayDateString(),
      reason: 'Incorporación a faena',
    };
    setMovements(prev => [newMovement, ...prev]);
    addAuditLog('ALTA_TRABAJADOR', `Alta de trabajador ${newWorker.name} (${newWorker.rut}, ${nextId})`);

    return nextId;
  };

  const updateWorker = (id: string, workerData: Partial<Worker>) => {
    setWorkers(prev => prev.map(w => (w.id === id ? { ...w, ...workerData } : w)));
    addAuditLog('EDITAR_TRABAJADOR', `Edición de ficha de trabajador ${id}`);
  };

  const retireWorker = (id: string, departureDate: string, departureReason: string) => {
    const worker = workers.find(w => w.id === id);
    if (!worker) return;

    setWorkers(prev =>
      prev.map(w =>
        w.id === id
          ? {
              ...w,
              status: 'RETIRADO',
              departureDate,
              departureReason,
            }
          : w
      )
    );

    const movement: WorkerMovement = {
      id: `MOV-${Date.now()}`,
      workerId: id,
      workerName: worker.name,
      workerRut: worker.rut,
      branchId: worker.branchId,
      type: 'RETIRO',
      date: departureDate,
      reason: departureReason,
    };
    setMovements(prev => [movement, ...prev]);
    addAuditLog('BAJA_TRABAJADOR', `Baja de trabajador ${worker.name} (${worker.rut}). Motivo: ${departureReason}`);
  };

  const rehireWorker = (id: string, rehireDate?: string) => {
    const worker = workers.find(w => w.id === id);
    if (!worker) return;

    const targetDate = rehireDate || getTodayDateString();
    setWorkers(prev =>
      prev.map(w =>
        w.id === id
          ? {
              ...w,
              status: 'ACTIVO',
              departureDate: undefined,
              departureReason: undefined,
              hireDate: targetDate,
            }
          : w
      )
    );

    const movement: WorkerMovement = {
      id: `MOV-${Date.now()}`,
      workerId: id,
      workerName: worker.name,
      workerRut: worker.rut,
      branchId: worker.branchId,
      type: 'REINCORPORACION',
      date: targetDate,
      reason: 'Reintegro / Reincorporación a faena',
    };
    setMovements(prev => [movement, ...prev]);
    addAuditLog('REINTEGRO_TRABAJADOR', `Reintegro a faena activa de ${worker.name} (${worker.rut})`);
  };

  const deleteWorker = (id: string) => {
    const worker = workers.find(w => w.id === id);
    setWorkers(prev => prev.filter(w => w.id !== id));
    setMovements(prev => prev.filter(m => m.workerId !== id));
    addAuditLog('ELIMINAR_TRABAJADOR', `Eliminación de trabajador ${worker?.name || id}`);
  };

  const addWorkerDocument = (
    workerId: string,
    docData: Omit<WorkerDocument, 'id' | 'uploadDate'> & { uploadDate?: string }
  ) => {
    const docId = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newDoc: WorkerDocument = {
      ...docData,
      id: docId,
      uploadDate: docData.uploadDate || getTodayDateString(),
    };

    setWorkers(prev =>
      prev.map(w => {
        if (w.id === workerId) {
          const currentDocs = w.documents || [];
          return {
            ...w,
            documents: [newDoc, ...currentDocs],
          };
        }
        return w;
      })
    );

    const worker = workers.find(w => w.id === workerId);
    addAuditLog(
      'ADJUNTAR_DOCUMENTO',
      `Documento adjuntado: "${newDoc.name}" (${newDoc.category}) para el trabajador ${worker?.name || workerId}`
    );
  };

  const deleteWorkerDocument = (workerId: string, documentId: string) => {
    setWorkers(prev =>
      prev.map(w => {
        if (w.id === workerId) {
          const updated = (w.documents || []).filter(d => d.id !== documentId);
          return { ...w, documents: updated };
        }
        return w;
      })
    );

    const worker = workers.find(w => w.id === workerId);
    addAuditLog(
      'ELIMINAR_DOCUMENTO',
      `Eliminación de documento adjunto de ${worker?.name || workerId}`
    );
  };

  const addProductionRecord = (record: Omit<ProductionRecord, 'id' | 'createdAt'>): string => {
    const id = `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRecord: ProductionRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString(),
    };
    setProduction(prev => [newRecord, ...prev]);
    addAuditLog('REGISTRO_ASISTENCIA', `Registro individual de jornada para ${record.workerId} (${record.quantity} día(s))`);
    return id;
  };

  const batchAddProduction = (
    records: Omit<ProductionRecord, 'id' | 'createdAt'>[],
    targetDate?: string,
    branchId?: string
  ): number => {
    const effDate = targetDate || (records.length > 0 ? records[0].date : '');
    const effBranch = branchId || (records.length > 0 ? records[0].branchId : '');

    // Remove existing records for this day and branch so only those checked remain present
    const cleanPrevious = production.filter(p => {
      if (effDate && effBranch) {
        return !(p.date === effDate && p.branchId === effBranch);
      }
      if (records.length > 0) {
        const workerIdsSet = new Set(records.map(r => r.workerId));
        return !(p.date === records[0].date && workerIdsSet.has(p.workerId));
      }
      return true;
    });

    const newRecords: ProductionRecord[] = records.map((r, i) => ({
      ...r,
      id: `PROD-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    }));

    const finalProduction = [...newRecords, ...cleanPrevious];
    setProduction(finalProduction);
    try {
      localStorage.setItem(`${STORAGE_KEY}_production`, JSON.stringify(finalProduction));
    } catch (e) {
      console.warn('Storage sync error', e);
    }

    addAuditLog(
      'REGISTRO_ASISTENCIA_MASIVO',
      `Asistencia guardada para ${newRecords.length} trabajadores en ${effBranch || 'faena'} fecha ${effDate || ''}`
    );
    return newRecords.length;
  };

  const updateProductionRecord = (id: string, recordData: Partial<ProductionRecord>) => {
    setProduction(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...recordData };
          if (recordData.quantity !== undefined || recordData.unitRate !== undefined) {
            updated.totalCalculated = (updated.quantity || 0) * (updated.unitRate || 0);
          }
          return updated;
        }
        return p;
      })
    );
    addAuditLog('EDITAR_ASISTENCIA', `Modificación de registro de faena ${id}`);
  };

  const deleteProductionRecord = (id: string) => {
    setProduction(prev => prev.filter(p => p.id !== id));
    addAuditLog('ELIMINAR_ASISTENCIA', `Eliminación de registro de faena ${id}`);
  };

  /**
   * Adjusts the consolidated production for a worker in a specific period (e.g. monthly report adjustment).
   * Modifies production records accordingly and logs the audit trail.
   */
  const adjustPeriodProduction = (
    workerId: string,
    labor: string,
    newQuantity: number,
    startDate: string,
    endDate: string,
    branchId: string,
    reason?: string
  ) => {
    const validQty = Math.max(0, isNaN(newQuantity) ? 0 : Number(newQuantity));
    const worker = workers.find(w => w.id === workerId);

    // Matching records in the period
    const matchingIndices: number[] = [];
    production.forEach((p, idx) => {
      const matchWorker = p.workerId === workerId;
      const matchLabor = p.labor === labor;
      const matchDate = (!startDate || p.date >= startDate) && (!endDate || p.date <= endDate);
      const matchBranch = branchId === 'ALL' || p.branchId === branchId;
      if (matchWorker && matchLabor && matchDate && matchBranch) {
        matchingIndices.push(idx);
      }
    });

    const currentTotal = matchingIndices.reduce((sum, idx) => sum + production[idx].quantity, 0);
    if (Math.abs(validQty - currentTotal) < 0.0001) {
      return; // No change needed
    }

    const diff = validQty - currentTotal;
    const updatedProduction = [...production];

    if (matchingIndices.length > 0) {
      // Sort matching indices by record date ascending
      matchingIndices.sort((a, b) => production[a].date.localeCompare(production[b].date));

      if (diff > 0) {
        // Increase: add the difference to the most recent record
        const lastIdx = matchingIndices[matchingIndices.length - 1];
        const prev = updatedProduction[lastIdx];
        const newRecordQty = prev.quantity + diff;
        updatedProduction[lastIdx] = {
          ...prev,
          quantity: newRecordQty,
          totalCalculated: newRecordQty * (prev.unitRate || 0),
          notes: (prev.notes ? `${prev.notes} | ` : '') + (reason ? `Ajuste mensual: ${reason}` : 'Ajuste en informe mensual'),
        };
      } else {
        // Decrease: deduct diff backwards from latest records until fulfilled
        let remainingToDeduct = Math.abs(diff);
        for (let i = matchingIndices.length - 1; i >= 0 && remainingToDeduct > 0; i--) {
          const idx = matchingIndices[i];
          const prev = updatedProduction[idx];
          if (prev.quantity >= remainingToDeduct) {
            const newRecordQty = prev.quantity - remainingToDeduct;
            updatedProduction[idx] = {
              ...prev,
              quantity: newRecordQty,
              totalCalculated: newRecordQty * (prev.unitRate || 0),
              notes: (prev.notes ? `${prev.notes} | ` : '') + (reason ? `Ajuste mensual: ${reason}` : 'Ajuste en informe mensual'),
            };
            remainingToDeduct = 0;
          } else {
            remainingToDeduct -= prev.quantity;
            updatedProduction[idx] = {
              ...prev,
              quantity: 0,
              totalCalculated: 0,
              notes: (prev.notes ? `${prev.notes} | ` : '') + (reason ? `Ajuste mensual: ${reason}` : 'Ajuste en informe mensual'),
            };
          }
        }
      }
    } else {
      // No records existed in the period, create one on endDate
      const effectiveBranch = branchId !== 'ALL' ? branchId : (worker?.branchId || branches[0]?.id || 'SUC-01');
      const unitRate = worker?.unitRate || 28000;
      const paymentMode = worker?.paymentMode || 'DÍA';
      const newRec: ProductionRecord = {
        id: `PROD-AJUSTE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: endDate || getTodayDateString(),
        branchId: effectiveBranch,
        workerId,
        labor,
        paymentMode,
        quantity: validQty,
        unitRate,
        totalCalculated: validQty * unitRate,
        notes: reason ? `Ajuste mensual: ${reason}` : 'Ajuste directo en informe mensual',
        createdAt: new Date().toISOString(),
      };
      updatedProduction.unshift(newRec);
    }

    setProduction(updatedProduction);
    try {
      localStorage.setItem(`${STORAGE_KEY}_production`, JSON.stringify(updatedProduction));
    } catch (e) {
      console.warn('Storage sync error', e);
    }

    addAuditLog(
      'AJUSTE_INFORME_MENSUAL',
      `Ajuste de producción en informe para ${worker?.name || workerId} (${worker?.rut || ''}) [${labor}]: de ${currentTotal} a ${validQty}. Motivo: ${reason || 'Ajuste directo de informe mensual'}`
    );
  };

  const batchAdjustPeriodProduction = (
    adjustments: Array<{
      workerId: string;
      labor: string;
      newQuantity: number;
      startDate: string;
      endDate: string;
      branchId: string;
      reason?: string;
    }>
  ) => {
    if (adjustments.length === 0) return;
    adjustments.forEach(adj => {
      adjustPeriodProduction(
        adj.workerId,
        adj.labor,
        adj.newQuantity,
        adj.startDate,
        adj.endDate,
        adj.branchId,
        adj.reason
      );
    });
  };

  // Real Excel (.xlsx) Export with formatted worksheets
  const exportDataExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Production Records
    const prodRows = production.map(p => {
      const w = workers.find(work => work.id === p.workerId);
      const b = branches.find(br => br.id === p.branchId);
      return {
        'Fecha': p.date,
        'ID Trabajador': p.workerId,
        'RUT': w?.rut || '',
        'Nombre Trabajador': w?.name || '',
        'Sucursal': b?.name || p.branchId,
        'Labor': p.labor,
        'Modo': p.paymentMode,
        'Cantidad Producida': p.quantity,
        'Tarifa ($)': p.unitRate,
        'Total ($)': p.totalCalculated,
        'Observaciones': p.notes || '',
      };
    });
    const wsProd = XLSX.utils.json_to_sheet(prodRows);
    XLSX.utils.book_append_sheet(wb, wsProd, 'Asistencias y Producción');

    // Sheet 2: Workers Roster
    const workerRows = workers.map(w => {
      const b = branches.find(br => br.id === w.branchId);
      return {
        'ID': w.id,
        'RUT': w.rut,
        'Nombre Completo': w.name,
        'Labor': w.labor,
        'Sucursal': b?.name || w.branchId,
        'Edad': w.age,
        'AFP': w.afp,
        'Salud': w.health,
        'Teléfono': w.phone,
        'Fecha Ingreso': w.hireDate,
        'Estado': w.status,
        'Fecha Salida': w.departureDate || '',
        'Motivo Salida': w.departureReason || '',
        'Modo Pago': w.paymentMode,
        'Tarifa': w.unitRate,
      };
    });
    const wsWorkers = XLSX.utils.json_to_sheet(workerRows);
    XLSX.utils.book_append_sheet(wb, wsWorkers, 'Nómina Trabajadores');

    // Sheet 3: Branches
    const branchRows = branches.map(b => ({
      'ID': b.id,
      'Nombre': b.name,
      'Ubicación': b.location,
      'Encargado': b.manager,
      'Teléfono': b.phone,
      'Activa': b.active ? 'SÍ' : 'NO',
    }));
    const wsBranches = XLSX.utils.json_to_sheet(branchRows);
    XLSX.utils.book_append_sheet(wb, wsBranches, 'Sucursales');

    // Write file
    XLSX.writeFile(wb, `respaldo_agrocontrol_${getTodayDateString()}.xlsx`);
    addAuditLog('EXPORTAR_EXCEL', 'Descarga de respaldo total en formato Excel nativo (.xlsx)');
  };

  // CSV / Excel Export for Chile (UTF-8 with BOM for Excel compatibility)
  const exportDataCSV = () => {
    const headers = [
      'Fecha',
      'ID Trabajador',
      'RUT',
      'Nombre Trabajador',
      'Sucursal',
      'Labor',
      'Unidad',
      'Cantidad (Días / Prod)',
      'Tarifa Referencial',
      'Total ($)',
      'Observaciones',
    ];

    const rows = production.map(p => {
      const w = workers.find(work => work.id === p.workerId);
      const b = branches.find(br => br.id === p.branchId);
      return [
        p.date,
        p.workerId,
        w?.rut || '',
        `"${(w?.name || '').replace(/"/g, '""')}"`,
        `"${(b?.name || p.branchId).replace(/"/g, '""')}"`,
        `"${p.labor.replace(/"/g, '""')}"`,
        p.paymentMode,
        p.quantity,
        p.unitRate,
        p.totalCalculated,
        `"${(p.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo_asistencias_excel_${getTodayDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addAuditLog('EXPORTAR_CSV', 'Descarga de respaldo completo en formato Excel / CSV');
  };

  const exportDataJSON = () => {
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      branches,
      workers,
      movements,
      production,
      auditLogs,
      settings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo_completo_agrocontrol_${getTodayDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addAuditLog('EXPORTAR_JSON', 'Descarga de respaldo total JSON');
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.branches && data.workers && data.production) {
        setBranches(data.branches);
        setWorkers(data.workers);
        setMovements(data.movements || []);
        setProduction(data.production);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.settings) setSettings(data.settings);
        addAuditLog('IMPORTAR_DATOS', 'Restauración exitosa de respaldo completo');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error importing JSON data', e);
      return false;
    }
  };

  const resetToDefaults = () => {
    setBranches(initialBranches);
    setWorkers(initialWorkers);
    setMovements(initialMovements);
    setProduction(initialProduction);
    setAuditLogs(initialAuditLogs);
    setSettings(initialSettings);
    setActiveBranchId('ALL');
    setCurrentRole('ADMIN');
    localStorage.clear();
  };

  const generateContractText = (worker: Partial<Worker>, branchId?: string): string => {
    const template = settings.contractTemplate || DEFAULT_CONTRACT_TEMPLATE;
    const targetBranchId = branchId || worker.branchId || (activeBranchId !== 'ALL' ? activeBranchId : branches[0]?.id);
    const branch = branches.find(b => b.id === targetBranchId) || branches[0];

    const rep = settings.companyRepresentative || 'Juan Ignacio Valenzuela Prieto';
    const repRut = settings.companyRepresentativeRut || '12.345.678-9';
    const city = settings.signatureCity || (branch?.location ? branch.location.split(',')[1]?.trim() : 'Curicó') || 'Curicó';

    let nacString = '';
    if (worker.birthDate) {
      nacString = `${worker.birthDate}${worker.age ? ` (${worker.age} años)` : ''}`;
    } else if (worker.age) {
      nacString = `${worker.age} años de edad`;
    } else {
      nacString = '[Fecha de nacimiento no informada]';
    }

    const modalidadContratoMap: Record<string, string> = {
      FAENA: 'contrato de trabajo por faena determinada',
      PLAZO_FIJO: 'contrato de trabajo a plazo fijo',
      INDEFINIDO: 'contrato de trabajo indefinido',
    };
    const modalidadContratoStr = worker.contractType
      ? modalidadContratoMap[worker.contractType] || 'contrato de trabajo por faena determinada'
      : 'contrato de trabajo por faena determinada';

    const modalidadPagoStr = worker.paymentMode
      ? worker.paymentMode === 'DÍA'
        ? 'diaria a razón'
        : worker.paymentMode === 'HORA'
        ? 'por hora a razón'
        : worker.paymentMode === 'KILO'
        ? 'a trato por kilo a razón'
        : 'por tarea a razón'
      : 'diaria a razón';

    const tarifaStr = (worker.unitRate || 28000).toLocaleString('es-CL');

    const replacements: Record<string, string> = {
      '{{EMPRESA_NOMBRE}}': settings.companyName || 'Agrícola & Servicios del Valle SpA',
      '{{EMPRESA_RUT}}': settings.companyRut || '76.890.123-K',
      '{{EMPRESA_DOMICILIO}}': settings.companyAddress || "Av. Libertador Bernardo O'Higgins 450, Of. 602, Curicó",
      '{{EMPRESA_REPRESENTANTE}}': rep,
      '{{EMPRESA_REPRESENTANTE_RUT}}': repRut,
      '{{TRABAJADOR_NOMBRE}}': worker.name || '[NOMBRE DEL TRABAJADOR]',
      '{{TRABAJADOR_RUT}}': worker.rut || '[RUT DEL TRABAJADOR]',
      '{{TRABAJADOR_NACIMIENTO}}': nacString,
      '{{TRABAJADOR_ESTADO_CIVIL}}': worker.maritalStatus || 'Soltero(a)',
      '{{TRABAJADOR_DOMICILIO}}': worker.address || '[Domicilio registrado en ficha]',
      '{{TRABAJADOR_TELEFONO}}': worker.phone || '[Teléfono no registrado]',
      '{{LABOR}}': worker.labor || 'Cosecha y Recolección',
      '{{FAENA_NOMBRE}}': branch?.name || 'Faena Fundo Los Aromos',
      '{{FAENA_UBICACION}}': branch?.location || 'Camino Los Niches Km 8.5, Curicó',
      '{{CIUDAD_FIRMA}}': city,
      '{{FECHA_INGRESO}}': worker.hireDate ? formatDate(worker.hireDate) : formatDate(getTodayDateString()),
      '{{FECHA_TERMINO}}': worker.contractEndDate ? formatDate(worker.contractEndDate) : 'Conclusión total de la faena asignada',
      '{{MODALIDAD_CONTRATO}}': modalidadContratoStr,
      '{{MODALIDAD_PAGO}}': modalidadPagoStr,
      '{{VALOR_TARIFA}}': tarifaStr,
      '{{JORNADA_SEMANAL}}': worker.weeklyHours ? worker.weeklyHours.replace(/[^0-9]/g, '') || '40' : '40',
      '{{JORNADA_DIARIA}}': worker.dailySchedule ? worker.dailySchedule.replace(/[^0-9]/g, '')?.slice(0, 1) || '8' : '8',
      '{{AFP}}': worker.afp || 'AFP Habitat',
      '{{SALUD}}': worker.health || 'Fonasa Tramo B',
    };

    let result = template;
    for (const [tag, val] of Object.entries(replacements)) {
      result = result.split(tag).join(val);
    }
    return result;
  };

  const getWorkerContractStatus = (worker: Worker): WorkerContractCompliance => {
    const hasContractDoc = (worker.documents || []).some(d => d.category === 'CONTRATO');
    if (!hasContractDoc) {
      return {
        status: 'NO_CONTRACT',
        label: 'Sin Contrato',
        isBlinking: true,
      };
    }
    if (worker.contractType !== 'INDEFINIDO' && worker.contractEndDate) {
      const todayStr = getTodayDateString();
      if (worker.contractEndDate < todayStr) {
        return {
          status: 'EXPIRED',
          label: `Vencido (${worker.contractEndDate.slice(5).replace('-', '/')})`,
          isBlinking: true,
        };
      }
    }
    return {
      status: 'VALID',
      label: 'Contrato Vigente',
      isBlinking: false,
    };
  };

  const resetContractTemplate = () => {
    updateSettings({ contractTemplate: DEFAULT_CONTRACT_TEMPLATE });
    addAuditLog('REINICIO_PLANTILLA_CONTRATO', 'Se restableció la plantilla de contrato al modelo oficial');
  };

  return (
    <AppContext.Provider
      value={{
        branches,
        workers,
        movements,
        production,
        auditLogs,
        settings,
        activeBranchId,
        currentRole,
        selectedProductionDate,
        setSelectedProductionDate,
        setActiveBranchId,
        setCurrentRole,
        updateSettings,
        addBranch,
        updateBranch,
        addWorker,
        updateWorker,
        retireWorker,
        rehireWorker,
        deleteWorker,
        addWorkerDocument,
        deleteWorkerDocument,
        addProductionRecord,
        batchAddProduction,
        updateProductionRecord,
        deleteProductionRecord,
        adjustPeriodProduction,
        batchAdjustPeriodProduction,
        exportDataJSON,
        exportDataCSV,
        exportDataExcel,
        importDataJSON,
        addAuditLog,
        archiveAuditLog,
        deleteAuditLogsAfterBackup,
        resetToDefaults,
        getWorkerContractStatus,
        generateContractText,
        resetContractTemplate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
