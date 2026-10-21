import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import {
  Worker,
  PaymentMode,
  WorkerStatus,
  WorkerDocument,
  DocumentCategory,
  ContractType,
  AFP_OPTIONS,
  HEALTH_OPTIONS,
  WEEKLY_HOURS_OPTIONS,
  DAILY_HOURS_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
} from '../types';
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  History,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Building2,
  Paperclip,
  FileText,
  FileCheck,
  FileMinus,
  Shield,
  Award,
  File,
  Plus,
  Calendar,
  Printer,
  AlertTriangle,
  Eye,
  Check,
} from 'lucide-react';
import { ContractPrintModal } from './ContractPrintModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { ErrorBoundary } from './ErrorBoundary';
import {
  formatCLP,
  formatRUT,
  validateRUT,
  formatDate,
  getTodayDateString,
  getUnitSymbol,
  getUnitName,
} from '../utils/formatters';

export const WorkersView: React.FC = () => {
  const {
    workers,
    branches,
    movements,
    activeBranchId,
    addWorker,
    updateWorker,
    retireWorker,
    rehireWorker,
    deleteWorker,
    addWorkerDocument,
    deleteWorkerDocument,
    markWorkerDocumentAsSigned,
    settings,
    getWorkerContractStatus,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkerStatus>('ACTIVO');
  const [activeTab, setActiveTab] = useState<'workers' | 'movements'>('workers');
  const [contractAlertFilter, setContractAlertFilter] = useState<'ALL' | 'ONLY_ALERTS'>('ALL');

  // Contract Print Modal State
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractModalWorker, setContractModalWorker] = useState<Partial<Worker> | null>(null);

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<WorkerDocument | null>(null);
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);

  // Modal State for Worker Ficha (Add/Edit)
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [fichaTab, setFichaTab] = useState<'info' | 'documents'>('info');

  // Document Management State
  const [docCategoryFilter, setDocCategoryFilter] = useState<'ALL' | DocumentCategory>('ALL');
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>('CONTRATO_FIRMADO');
  const [newDocName, setNewDocName] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [newDocFileData, setNewDocFileData] = useState<string>('');
  const [newDocFileSize, setNewDocFileSize] = useState<string>('');
  const [newDocFileType, setNewDocFileType] = useState<string>('');
  const [docNotice, setDocNotice] = useState<string | null>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Modal State for Departure (Retiro/Baja)
  const [retireModalWorker, setRetireModalWorker] = useState<Worker | null>(null);
  const [departureDate, setDepartureDate] = useState(getTodayDateString());
  const [departureReason, setDepartureReason] = useState('Fin de faena de temporada');

  // Modal State for Reintegro
  const [rehireModalWorker, setRehireModalWorker] = useState<Worker | null>(null);
  const [rehireDate, setRehireDate] = useState(getTodayDateString());

  // Modal State for Batch Import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importBranchId, setImportBranchId] = useState(
    activeBranchId !== 'ALL' ? activeBranchId : branches[0]?.id || 'SUC-01'
  );
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data for Worker Ficha
  const [workerForm, setWorkerForm] = useState<{
    rut: string;
    name: string;
    labor: string;
    branchId: string;
    age: number;
    birthDate: string;
    maritalStatus: string;
    address: string;
    afp: string;
    health: string;
    phone: string;
    hireDate: string;
    contractType: ContractType;
    contractEndDate: string;
    weeklyHours: string;
    dailySchedule: string;
    status: WorkerStatus;
    paymentMode: PaymentMode;
    unitRate: number;
    observation: string;
  }>({
    rut: '',
    name: '',
    labor: 'Cosecha y Recolección',
    branchId: branches[0]?.id || '',
    age: 30,
    birthDate: '',
    maritalStatus: 'Soltero(a)',
    address: '',
    afp: 'Habitat',
    health: 'Fonasa (Tramo B)',
    phone: '+56 9 ',
    hireDate: getTodayDateString(),
    contractType: 'FAENA',
    contractEndDate: '',
    weeklyHours: '40 Horas Semanales (Ley 40 Horas)',
    dailySchedule: '8 Horas Diarias (08:00 a 17:00 c/colación)',
    status: 'ACTIVO',
    paymentMode: 'DÍA',
    unitRate: 28000,
    observation: '',
  });

  const workersWithAlertsCount = workers.filter(w => {
    const matchBranch = activeBranchId === 'ALL' || w.branchId === activeBranchId;
    return matchBranch && getWorkerContractStatus(w).isBlinking;
  }).length;

  // Filtering
  const filteredWorkers = workers.filter(worker => {
    const matchBranch = activeBranchId === 'ALL' || worker.branchId === activeBranchId;
    const matchStatus = statusFilter === 'ALL' || worker.status === statusFilter;
    const contractStatus = getWorkerContractStatus(worker);
    const matchContractAlert =
      contractAlertFilter === 'ALL' || contractStatus.isBlinking;

    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      worker.name.toLowerCase().includes(term) ||
      worker.rut.toLowerCase().includes(term) ||
      worker.id.toLowerCase().includes(term) ||
      worker.labor.toLowerCase().includes(term);

    return matchBranch && matchStatus && matchContractAlert && matchSearch;
  });

  const filteredMovements = movements.filter(m => {
    return activeBranchId === 'ALL' || m.branchId === activeBranchId;
  });

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFichaTab('info');
    setDocNotice(null);
    setWorkerForm({
      rut: '',
      name: '',
      labor: 'Cosecha y Recolección',
      branchId: activeBranchId !== 'ALL' ? activeBranchId : branches[0]?.id || '',
      age: 28,
      birthDate: '',
      maritalStatus: 'Soltero(a)',
      address: '',
      afp: 'Habitat',
      health: 'Fonasa (Tramo B)',
      phone: '+56 9 ',
      hireDate: getTodayDateString(),
      contractType: 'FAENA',
      contractEndDate: '',
      weeklyHours: '40 Horas Semanales (Ley 40 Horas)',
      dailySchedule: '8 Horas Diarias (08:00 a 17:00 c/colación)',
      status: 'ACTIVO',
      paymentMode: 'DÍA',
      unitRate: 28000,
      observation: '',
    });
    setIsWorkerModalOpen(true);
  };

  const handleOpenEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFichaTab('info');
    setDocNotice(null);
    const obsField = worker.customFields?.find(f => f.name.toLowerCase() === 'observación');

    setWorkerForm({
      rut: worker.rut,
      name: worker.name,
      labor: worker.labor,
      branchId: worker.branchId,
      age: worker.age,
      birthDate: worker.birthDate || '',
      maritalStatus: worker.maritalStatus || 'Soltero(a)',
      address: worker.address || '',
      afp: worker.afp || 'Habitat',
      health: worker.health || 'Fonasa (Tramo B)',
      phone: worker.phone,
      hireDate: worker.hireDate,
      contractType: worker.contractType || 'FAENA',
      contractEndDate: worker.contractEndDate || '',
      weeklyHours: worker.weeklyHours || '40 Horas Semanales (Ley 40 Horas)',
      dailySchedule: worker.dailySchedule || '8 Horas Diarias (08:00 a 17:00 c/colación)',
      status: worker.status,
      paymentMode: worker.paymentMode || 'DÍA',
      unitRate: worker.unitRate || 28000,
      observation: obsField ? String(obsField.value) : '',
    });
    setIsWorkerModalOpen(true);
  };

  const handleOpenDocuments = (worker: Worker) => {
    handleOpenEdit(worker);
    setFichaTab('documents');
    setDocNotice(null);
  };

  const handleOpenContractPrint = (worker: Partial<Worker>) => {
    setContractModalWorker(worker);
    setIsContractModalOpen(true);
  };

  // Handler for Document File Input
  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let sizeStr = `${Math.round(file.size / 1024)} KB`;
    if (file.size > 1024 * 1024) {
      sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }
    setNewDocFileSize(sizeStr);
    setNewDocFileType(file.type || 'application/pdf');

    if (!newDocName.trim()) {
      setNewDocName(file.name);
    }

    const lower = file.name.toLowerCase();
    if (lower.includes('firmado')) setNewDocCategory('CONTRATO_FIRMADO');
    else if (lower.includes('plantilla')) setNewDocCategory('CONTRATO_PLANTILLA');
    else if (lower.includes('contrato')) setNewDocCategory('CONTRATO_FIRMADO');
    else if (lower.includes('papeleta') || lower.includes('permiso') || lower.includes('vacacion'))
      setNewDocCategory('PAPELETA');
    else if (lower.includes('finiquito') || lower.includes('renuncia'))
      setNewDocCategory('FINIQUITO');
    else if (lower.includes('cedula') || lower.includes('carnet') || lower.includes('rut'))
      setNewDocCategory('CEDULA');
    else if (lower.includes('certificado') || lower.includes('afp'))
      setNewDocCategory('CERTIFICADO');

    const reader = new FileReader();
    reader.onload = uploadEvt => {
      if (uploadEvt.target?.result) {
        setNewDocFileData(uploadEvt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler for Attaching Document to Worker
  const handleAttachDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;

    const docTitle =
      newDocName.trim() ||
      `${newDocCategory.toLowerCase()}_${editingWorker.name.replace(/\s+/g, '_')}.pdf`;

    const isSignedContract = newDocCategory === 'CONTRATO_FIRMADO';

    addWorkerDocument(editingWorker.id, {
      name: docTitle,
      category: newDocCategory,
      isSigned: isSignedContract,
      notes: newDocNotes.trim() || undefined,
      fileSize: newDocFileSize || '320 KB',
      fileType: newDocFileType || 'application/pdf',
      fileData: newDocFileData || undefined,
    });

    setDocNotice(`Documento "${docTitle}" adjuntado exitosamente al expediente.`);
    setNewDocName('');
    setNewDocNotes('');
    setNewDocFileData('');
    setNewDocFileSize('');
    setNewDocFileType('');
    if (docFileInputRef.current) docFileInputRef.current.value = '';
    setTimeout(() => setDocNotice(null), 4500);
  };

  // Handler for Downloading Document
  const handleDownloadDoc = (doc: WorkerDocument, worker: Worker) => {
    if (doc.fileData && doc.fileData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const company = settings?.companyName || 'SISTEMA DE GESTIÓN LABORAL';
      const content = `${company.toUpperCase()} - RECURSOS HUMANOS\n==========================================================\nEXPEDIENTE DIGITAL DE TRABAJADOR\n\nNombre: ${worker.name}\nRUT: ${worker.rut}\nCódigo: ${worker.id}\nFaena: ${worker.branchId}\n\nDOCUMENTO ADJUNTO:\nTipo / Categoría: ${doc.category}\nNombre Archivo: ${doc.name}\nFecha Registro: ${doc.uploadDate}\nTamaño: ${doc.fileSize || 'N/A'}\nObservaciones: ${doc.notes || 'Documento oficial en expediente de personal'}\n\n==========================================================\nCertificado digital emitido por ${company}.`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name.endsWith('.pdf') ? doc.name.replace('.pdf', '.txt') : doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Helper for Category Badges
  const getDocCategoryBadge = (category: DocumentCategory, isSigned?: boolean) => {
    switch (category) {
      case 'CONTRATO_FIRMADO':
        return {
          label: 'Contrato Vigente (Firmado)',
          bg: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold',
          icon: FileCheck,
        };
      case 'CONTRATO_PLANTILLA':
        return {
          label: 'Contrato Plantilla (Emitido)',
          bg: 'bg-amber-100 text-amber-950 border-amber-300 font-semibold',
          icon: FileText,
        };
      case 'CONTRATO':
        return isSigned
          ? {
              label: 'Contrato Vigente (Firmado)',
              bg: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold',
              icon: FileCheck,
            }
          : {
              label: 'Contrato Plantilla (Emitido)',
              bg: 'bg-amber-100 text-amber-950 border-amber-300 font-semibold',
              icon: FileText,
            };
      case 'PAPELETA':
        return {
          label: 'Papeleta / Permiso',
          bg: 'bg-sky-50 text-sky-800 border-sky-300',
          icon: FileCheck,
        };
      case 'FINIQUITO':
        return {
          label: 'Finiquito Laboral',
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: FileMinus,
        };
      case 'CEDULA':
        return {
          label: 'Cédula / Identidad',
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: Shield,
        };
      case 'CERTIFICADO':
        return {
          label: 'Certificado / AFP',
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          icon: Award,
        };
      default:
        return {
          label: 'Otro Documento',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: File,
        };
    }
  };

  const handleSubmitWorker = (e: React.FormEvent) => {
    e.preventDefault();

    const finalFields = workerForm.observation.trim()
      ? [
          {
            id: `cf-obs-${Date.now()}`,
            name: 'Observación',
            type: 'text' as const,
            value: workerForm.observation.trim(),
          },
        ]
      : [];

    const payload = {
      rut: workerForm.rut,
      name: workerForm.name,
      labor: workerForm.labor,
      branchId: workerForm.branchId,
      age: workerForm.age,
      birthDate: workerForm.birthDate || undefined,
      maritalStatus: workerForm.maritalStatus,
      address: workerForm.address || undefined,
      afp: workerForm.afp,
      health: workerForm.health,
      phone: workerForm.phone,
      hireDate: workerForm.hireDate,
      contractType: workerForm.contractType,
      contractEndDate: workerForm.contractEndDate || undefined,
      weeklyHours: workerForm.weeklyHours,
      dailySchedule: workerForm.dailySchedule,
      status: workerForm.status,
      paymentMode: workerForm.paymentMode,
      unitRate: workerForm.unitRate,
      customFields: finalFields,
    };

    if (editingWorker) {
      updateWorker(editingWorker.id, payload);
    } else {
      addWorker(payload);
    }
    setIsWorkerModalOpen(false);
  };

  const handleConfirmDeparture = (e: React.FormEvent) => {
    e.preventDefault();
    if (retireModalWorker) {
      retireWorker(retireModalWorker.id, departureDate, departureReason);
      setRetireModalWorker(null);
    }
  };

  const handleConfirmRehire = (e: React.FormEvent) => {
    e.preventDefault();
    if (rehireModalWorker) {
      rehireWorker(rehireModalWorker.id, rehireDate);
      setRehireModalWorker(null);
    }
  };

  // REAL EXCEL (.XLSX) TEMPLATE DOWNLOAD
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const templateRows = [
      {
        'RUT': '18.452.981-3',
        'Nombre Completo': 'Juan Carlos Pérez Soto',
        'Labor': 'Cosecha y Recolección',
        'Sucursal': 'SUC-01',
        'Edad': 34,
        'AFP': 'Habitat',
        'Salud': 'Fonasa B',
        'Teléfono': '+56 9 8412 3456',
        'Observación': 'Cuadrilla 1',
      },
      {
        'RUT': '17.892.114-5',
        'Nombre Completo': 'María Elena González Silva',
        'Labor': 'Poda y Amarre',
        'Sucursal': 'SUC-01',
        'Edad': 29,
        'AFP': 'Provida',
        'Salud': 'Fonasa B',
        'Teléfono': '+56 9 7654 3210',
        'Observación': 'Hilera 4',
      },
      {
        'RUT': '16.234.890-1',
        'Nombre Completo': 'Rodrigo Morales Tapia',
        'Labor': 'Riego Tecnificado',
        'Sucursal': 'SUC-02',
        'Edad': 42,
        'AFP': 'Modelo',
        'Salud': 'Isapre Colmena',
        'Teléfono': '+56 9 9123 4567',
        'Observación': 'Turno mañana',
      },
      {
        'RUT': '19.876.543-2',
        'Nombre Completo': 'Camila Andrea Torres Vega',
        'Labor': 'Selección y Empaque',
        'Sucursal': 'SUC-03',
        'Edad': 26,
        'AFP': 'PlanVital',
        'Salud': 'Fonasa A',
        'Teléfono': '+56 9 6543 2109',
        'Observación': 'Línea de packing',
      },
    ];

    const wsWorkers = XLSX.utils.json_to_sheet(templateRows);
    wsWorkers['!cols'] = [
      { wch: 15 },
      { wch: 32 },
      { wch: 25 },
      { wch: 15 },
      { wch: 8 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, wsWorkers, 'Plantilla Trabajadores');

    const branchRef = branches.map(b => ({
      'Código Sucursal': b.id,
      'Nombre Fundo / Sucursal': b.name,
      'Encargado': b.manager,
      'Ubicación': b.location,
    }));
    const wsBranches = XLSX.utils.json_to_sheet(branchRef);
    wsBranches['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 25 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsBranches, 'Sucursales Disponibles');

    XLSX.writeFile(wb, 'plantilla_trabajadores.xlsx');
  };

  // BATCH WORKERS IMPORT
  const handleProcessImport = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Por favor ingrese o pegue los datos de trabajadores.');
      return;
    }

    const lines = importText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    let importedCount = 0;
    const startIndex = lines[0].toLowerCase().includes('rut') || lines[0].toLowerCase().includes('nombre') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      let delimiter = ',';
      if (line.includes('\t')) delimiter = '\t';
      else if (line.includes(';')) delimiter = ';';

      const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 2) continue;

      const rut = formatRUT(parts[0]);
      const name = parts[1];
      const labor = parts[2] || 'Cosecha y Recolección';
      const branchVal = parts[3] || importBranchId;
      const matchedBranch = branches.find(
        b => b.id.toLowerCase() === branchVal.toLowerCase() || b.name.toLowerCase().includes(branchVal.toLowerCase())
      );
      const branchId = matchedBranch ? matchedBranch.id : importBranchId;
      const age = parseInt(parts[4], 10) || 30;
      const afp = parts[5] || 'Provida';
      const health = parts[6] || 'Fonasa B';
      const phone = parts[7] || '+56 9 ';
      const observation = parts[8] || '';

      const customFields = observation
        ? [{ id: `cf-imp-${Date.now()}-${i}`, name: 'Observación', type: 'text' as const, value: observation }]
        : [];

      addWorker({
        rut,
        name,
        labor,
        branchId,
        age,
        afp,
        health,
        phone,
        hireDate: getTodayDateString(),
        status: 'ACTIVO',
        paymentMode: 'DÍA',
        unitRate: 28000,
        customFields,
      });

      importedCount++;
    }

    if (importedCount > 0) {
      setImportNotice(`¡Importación exitosa! Se han agregado ${importedCount} trabajadores.`);
      setTimeout(() => {
        setImportNotice(null);
        setIsImportModalOpen(false);
        setImportText('');
      }, 1800);
    } else {
      setImportError('No se pudieron procesar filas válidas. Verifique que las columnas contengan RUT y Nombre.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const csvText = XLSX.utils.sheet_to_csv(firstSheet, { FS: ';' });
          setImportText(csvText);
        } catch (err) {
          setImportError('Error al leer el archivo Excel: ' + (err instanceof Error ? err.message : 'formato no válido'));
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        setImportText(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            <h1 className="text-lg font-bold text-slate-900">Nómina de Trabajadores</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de cuadrillas agrícolas, altas, bajas, reintegros e importación masiva.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tabs: Fichas vs Historial */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('workers')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'workers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nómina ({filteredWorkers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'movements'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Altas / Bajas ({filteredMovements.length})</span>
            </button>
          </div>

          {/* Download Excel Template Button */}
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            title="Descargar plantilla Excel (.xlsx) con columnas formateadas"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Plantilla Excel (.xlsx)</span>
          </button>

          {/* Batch Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-semibold transition-colors border border-emerald-300"
            title="Cargar archivo Excel (.xlsx) o CSV"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Importar Masivo</span>
          </button>

          {/* Add Worker Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Trabajador</span>
          </button>
        </div>
      </div>

      {activeTab === 'workers' ? (
        <>
          {/* Search and Filters Toolbar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nombre, RUT o Labor..."
                className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Segmented Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setStatusFilter('ACTIVO')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    statusFilter === 'ACTIVO'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Activos ({workers.filter(w => (activeBranchId === 'ALL' || w.branchId === activeBranchId) && w.status === 'ACTIVO').length})
                </button>
                <button
                  onClick={() => setStatusFilter('RETIRADO')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    statusFilter === 'RETIRADO'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Retirados ({workers.filter(w => (activeBranchId === 'ALL' || w.branchId === activeBranchId) && w.status === 'RETIRADO').length})
                </button>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({workers.filter(w => activeBranchId === 'ALL' || w.branchId === activeBranchId).length})
                </button>
              </div>

              {/* Quick Contract Compliance Filter */}
              <button
                type="button"
                onClick={() => setContractAlertFilter(prev => prev === 'ALL' ? 'ONLY_ALERTS' : 'ALL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                  contractAlertFilter === 'ONLY_ALERTS'
                    ? 'bg-red-50 text-red-800 border-red-300 shadow-xs ring-1 ring-red-400'
                    : workersWithAlertsCount > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Filtrar trabajadores que no tienen contrato o con fecha vencida"
              >
                <AlertTriangle className={`w-3.5 h-3.5 ${workersWithAlertsCount > 0 ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
                <span>Alertas Contrato</span>
                {workersWithAlertsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-mono animate-pulse">
                    {workersWithAlertsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* SCREEN-FITTING WORKERS TABLE (No horizontal scroll, fully fitted layout) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredWorkers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No se encontraron trabajadores</p>
                <p className="text-xs text-slate-500 mt-1">
                  Intente con otro filtro o agregue trabajadores mediante la plantilla.
                </p>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200 table-fixed">
                  <thead className="bg-slate-50 font-bold text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 w-[16%]">ID / RUT</th>
                      <th className="px-3 py-2.5 w-[22%]">Nombre del Trabajador</th>
                      <th className="px-3 py-2.5 w-[19%]">Labor / Faena</th>
                      <th className="px-3 py-2.5 w-[20%]">Contrato & Cumplimiento</th>
                      <th className="px-3 py-2.5 w-[23%] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWorkers.map(worker => {
                      const branch = branches.find(b => b.id === worker.branchId);
                      const isActivo = worker.status === 'ACTIVO';
                      const contractStatus = getWorkerContractStatus(worker);

                      return (
                        <tr key={worker.id} className="hover:bg-slate-50 transition-colors">
                          {/* ID / RUT */}
                          <td className="px-3 py-2 truncate">
                            <span className="font-mono font-bold text-emerald-900 block leading-tight">
                              {worker.id}
                            </span>
                            <span className="font-mono text-slate-600 text-[11px] block leading-tight">
                              {worker.rut}
                            </span>
                          </td>

                          {/* Name */}
                          <td className="px-3 py-2 truncate">
                            <span className="font-bold text-slate-900 block truncate" title={worker.name}>
                              {worker.name}
                            </span>
                            {isActivo ? (
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                ● Activo en faena
                              </span>
                            ) : (
                              <span className="text-[10px] text-rose-700 font-semibold">
                                ● Retirado ({formatDate(worker.departureDate || '')})
                              </span>
                            )}
                          </td>

                          {/* Labor / Faena */}
                          <td className="px-3 py-2 truncate">
                            <span className="font-semibold text-slate-800 block truncate" title={worker.labor}>
                              {worker.labor}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate" title={branch?.name}>
                              {branch?.name || worker.branchId}
                            </span>
                          </td>

                          {/* Contrato & Cumplimiento (Blinking Alert if missing or expired) */}
                          <td className="px-3 py-2 truncate">
                            {contractStatus.status === 'NO_CONTRACT' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse shadow-2xs"
                                title="Obligatorio: Falta contrato en el expediente"
                              >
                                <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                                <span>⚠️ Sin Contrato</span>
                              </span>
                            ) : contractStatus.status === 'PENDING_SIGNATURE' ? (
                              <div className="flex flex-col">
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                                  title="Plantilla oficial emitida al ingresar el trabajador. Pendiente de firma física."
                                >
                                  <FileText className="w-3 h-3 text-amber-700 shrink-0" />
                                  <span>Plantilla Emitida</span>
                                </span>
                                <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                  Pendiente Firma
                                </span>
                              </div>
                            ) : contractStatus.status === 'EXPIRED' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 animate-pulse shadow-2xs"
                                title="Contrato vencido según fecha de término"
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-700 shrink-0" />
                                <span>⏳ {contractStatus.label}</span>
                              </span>
                            ) : (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Contrato Vigente (Firmado)</span>
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {worker.contractType === 'INDEFINIDO'
                                    ? 'Indefinido'
                                    : worker.contractEndDate
                                    ? `Hasta ${worker.contractEndDate.slice(5).replace('-', '/')}`
                                    : 'Por faena'}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Print / View Contract Button */}
                              <button
                                onClick={() => handleOpenContractPrint(worker)}
                                className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded transition-colors border border-slate-300 flex items-center gap-1 shadow-2xs"
                                title="Generar e imprimir contrato de trabajo oficial"
                              >
                                <Printer className="w-3 h-3 text-slate-600" />
                                <span>Contrato</span>
                              </button>

                              {/* Ficha Button */}
                              <button
                                onClick={() => handleOpenEdit(worker)}
                                className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors border border-slate-200"
                                title="Ver Ficha Personal Completa"
                              >
                                Ficha
                              </button>

                              {/* Docs Button */}
                              <button
                                onClick={() => handleOpenDocuments(worker)}
                                className={`px-2 py-1 text-[11px] font-bold rounded transition-colors border flex items-center gap-1 ${
                                  (worker.documents?.length || 0) > 0
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Ver y adjuntar contratos, papeletas, finiquitos"
                              >
                                <Paperclip className="w-3 h-3 text-emerald-700" />
                                <span>Docs ({worker.documents?.length || 0})</span>
                              </button>

                              {isActivo ? (
                                <button
                                  onClick={() => {
                                    setRetireModalWorker(worker);
                                    setDepartureDate(getTodayDateString());
                                    setDepartureReason('Fin de faena de temporada');
                                  }}
                                  className="px-2 py-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors"
                                  title="Registrar Retiro / Baja"
                                >
                                  Baja
                                </button>
                              ) : (
                                /* Prominent REINTEGRO BUTTON requested by user */
                                <button
                                  onClick={() => {
                                    setRehireModalWorker(worker);
                                    setRehireDate(getTodayDateString());
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-all inline-flex items-center gap-1 shadow-xs"
                                  title="Reintegrar a cuadrilla activa"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reintegrar</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Eliminar definitivamente a ${worker.name}?`)) {
                                    deleteWorker(worker.id);
                                  }
                                }}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* History of Altas y Bajas */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900">Historial Oficial de Altas y Bajas</h2>
            <p className="text-xs text-slate-500">
              Registro inalterable de contrataciones, reintegros y salidas de temporada.
            </p>
          </div>

          {filteredMovements.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No hay movimientos registrados para el filtro actual.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
              {filteredMovements.map(mov => {
                const isIngreso = mov.type === 'INGRESO' || mov.type === 'REINCORPORACION';
                const branch = branches.find(b => b.id === mov.branchId);

                return (
                  <div key={mov.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{mov.workerName}</span>{' '}
                      <span className="font-mono text-slate-500 text-[11px]">({mov.workerRut})</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {branch?.name || mov.branchId} · {mov.reason || 'Sin motivo especificado'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isIngreso
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {mov.type === 'INGRESO'
                          ? 'Alta'
                          : mov.type === 'REINCORPORACION'
                          ? 'Reintegro'
                          : 'Baja'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {formatDate(mov.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: REINTEGRO CONFIRMATION */}
      {rehireModalWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <RotateCcw className="w-5 h-5" />
                <h3>Reintegrar Trabajador a Faena Activa</h3>
              </div>
              <button
                onClick={() => setRehireModalWorker(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRehire} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">{rehireModalWorker.name}</p>
                <p className="text-slate-500 font-mono mt-0.5">
                  RUT: {rehireModalWorker.rut} · ID: {rehireModalWorker.id}
                </p>
                <p className="text-slate-600 mt-1 font-medium">Labor: {rehireModalWorker.labor}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fecha Efectiva de Reintegro *
                </label>
                <input
                  type="date"
                  required
                  value={rehireDate}
                  onChange={e => setRehireDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-bold"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                El trabajador volverá al estado "ACTIVO", aparecerá inmediatamente en la planilla diaria para pasar asistencia y se guardará el evento en la bitácora.
              </p>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRehireModalWorker(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirmar Reintegro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR BAJA */}
      {retireModalWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <UserMinus className="w-5 h-5" />
                <h3>Registrar Salida / Baja Laboral</h3>
              </div>
              <button
                onClick={() => setRetireModalWorker(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDeparture} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">{retireModalWorker.name}</p>
                <p className="text-slate-500 font-mono mt-0.5">
                  RUT: {retireModalWorker.rut} · ID: {retireModalWorker.id}
                </p>
                <p className="text-slate-600 mt-1 font-medium">Labor: {retireModalWorker.labor}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fecha Efectiva de Salida *
                </label>
                <input
                  type="date"
                  required
                  value={departureDate}
                  onChange={e => setDepartureDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-600 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo o Causal de Salida *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Fin de faena de temporada, Renuncia voluntaria..."
                  value={departureReason}
                  onChange={e => setDepartureReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-600 text-slate-900"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRetireModalWorker(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Confirmar Retiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BATCH WORKER IMPORT (CSV OR TABULAR TEXT) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Importación Masiva de Trabajadores
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950">
                <p className="font-bold">Formato de Columnas:</p>
                <p className="text-slate-700 text-[11px] mt-0.5">
                  RUT, Nombre Completo, Labor, Sucursal, Edad, AFP, Salud, Teléfono, Observación
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sucursal de Destino
                </label>
                <select
                  value={importBranchId}
                  onChange={e => setImportBranchId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Subir Archivo Excel (.xlsx, .xls) o CSV
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-800 file:text-white hover:file:bg-emerald-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  O Pegue las Filas de Excel Directamente:
                </label>
                <textarea
                  rows={6}
                  placeholder={`17.892.431-5, José Henríquez, Cosecha, SUC-01, 34, Provida, Fonasa B, +56 9 6123 4567, Cuadrilla 1\n16.541.209-8, Marcela Soto, Cosecha, SUC-01, 29, Habitat, Fonasa B, +56 9 8234 5678, Cuadrilla 1`}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {importNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{importNotice}</span>
                </div>
              )}

              {importError && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-xs font-bold text-rose-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Plantilla Base</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs shadow-xs"
                >
                  Procesar e Importar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FICHA PERSONAL DETALLADA (VER / EDITAR & DOCUMENTOS ADJUNTOS) */}
      {isWorkerModalOpen && (() => {
        const currentWorkerInModal = editingWorker
          ? workers.find(w => w.id === editingWorker.id) || editingWorker
          : null;
        const workerDocs = currentWorkerInModal?.documents || [];

        const contratosCount = workerDocs.filter(
          d => d.category === 'CONTRATO' || d.category === 'CONTRATO_PLANTILLA' || d.category === 'CONTRATO_FIRMADO'
        ).length;
        const papeletasCount = workerDocs.filter(d => d.category === 'PAPELETA').length;
        const finiquitosCount = workerDocs.filter(d => d.category === 'FINIQUITO').length;
        const cedulasCount = workerDocs.filter(d => d.category === 'CEDULA').length;
        const certsCount = workerDocs.filter(d => d.category === 'CERTIFICADO').length;

        const displayedDocs =
          docCategoryFilter === 'ALL'
            ? workerDocs
            : docCategoryFilter === 'CONTRATO'
            ? workerDocs.filter(
                d => d.category === 'CONTRATO' || d.category === 'CONTRATO_PLANTILLA' || d.category === 'CONTRATO_FIRMADO'
              )
            : workerDocs.filter(d => d.category === docCategoryFilter);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {currentWorkerInModal
                      ? `Ficha Personal: ${currentWorkerInModal.name}`
                      : 'Registrar Nueva Ficha de Trabajador'}
                  </h3>
                  {currentWorkerInModal && (
                    <p className="text-[11px] font-mono text-emerald-800 font-bold">
                      Código: {currentWorkerInModal.id} · RUT: {currentWorkerInModal.rut}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-header Tabs: Ficha vs Documentos */}
              <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2.5 gap-2">
                <button
                  type="button"
                  onClick={() => setFichaTab('info')}
                  className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    fichaTab === 'info'
                      ? 'border-emerald-800 text-emerald-950 bg-white rounded-t-lg shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Datos Laborales & Personales</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFichaTab('documents')}
                  className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    fichaTab === 'documents'
                      ? 'border-emerald-800 text-emerald-950 bg-white rounded-t-lg shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Documentos Adjuntos ({workerDocs.length})</span>
                  {workerDocs.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                      {workerDocs.length}
                    </span>
                  )}
                </button>
              </div>

              {/* TAB 1: FORMULARIO DATOS LABORALES & PERSONALES */}
              {fichaTab === 'info' && (
                <form onSubmit={handleSubmitWorker} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                  {/* SECCION 1: DATOS OBLIGATORIOS PARA CONTRATO Y FAENA */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-700" />
                        1. Datos Obligatorios para Contrato y Faena
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Requeridos para emisión legal</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* RUT */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          RUT del Trabajador *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="12.345.678-9"
                          value={workerForm.rut}
                          onChange={e => setWorkerForm({ ...workerForm, rut: formatRUT(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-mono"
                        />
                        {workerForm.rut && !validateRUT(workerForm.rut) && (
                          <p className="text-[10px] text-amber-600 mt-1">
                            ⚠️ Verifique dígito verificador.
                          </p>
                        )}
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ej. Manuel Eduardo González Soto"
                          value={workerForm.name}
                          onChange={e => setWorkerForm({ ...workerForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-semibold"
                        />
                      </div>

                      {/* Faena Asignada */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Faena Asignada *
                        </label>
                        <select
                          value={workerForm.branchId}
                          onChange={e => setWorkerForm({ ...workerForm, branchId: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white font-medium"
                        >
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.location.split(',')[0]})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Labor */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Labor / Cargo Principal *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="ej. Cosecha y Recolección, Poda..."
                          value={workerForm.labor}
                          onChange={e => setWorkerForm({ ...workerForm, labor: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900"
                        />
                      </div>

                      {/* Modalidad de Contrato */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Modalidad de Contrato *
                        </label>
                        <select
                          value={workerForm.contractType}
                          onChange={e => setWorkerForm({ ...workerForm, contractType: e.target.value as ContractType })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white font-medium"
                        >
                          {CONTRACT_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Fecha de Ingreso */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Fecha de Ingreso *
                        </label>
                        <input
                          type="date"
                          required
                          value={workerForm.hireDate}
                          onChange={e => setWorkerForm({ ...workerForm, hireDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium"
                        />
                      </div>

                      {/* Fecha de Término / Caducidad */}
                      {workerForm.contractType !== 'INDEFINIDO' && (
                        <div>
                          <label className="block font-bold text-amber-900 mb-1 flex items-center justify-between">
                            <span>Fecha de Caducidad / Término *</span>
                            <span className="text-[10px] text-amber-700 font-normal">Control de vigencia</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={workerForm.contractEndDate}
                            onChange={e => setWorkerForm({ ...workerForm, contractEndDate: e.target.value })}
                            className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 font-medium"
                          />
                        </div>
                      )}

                      {/* Jornada Semanal */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Jornada Semanal *
                        </label>
                        <select
                          value={workerForm.weeklyHours}
                          onChange={e => setWorkerForm({ ...workerForm, weeklyHours: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                        >
                          {WEEKLY_HOURS_OPTIONS.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Jornada Diaria */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Jornada Diaria *
                        </label>
                        <select
                          value={workerForm.dailySchedule}
                          onChange={e => setWorkerForm({ ...workerForm, dailySchedule: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                        >
                          {DAILY_HOURS_OPTIONS.map(d => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Previsión AFP */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Previsión AFP *
                        </label>
                        <select
                          value={workerForm.afp}
                          onChange={e => setWorkerForm({ ...workerForm, afp: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                        >
                          {AFP_OPTIONS.map(afp => (
                            <option key={afp} value={afp}>
                              {afp}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Previsión Salud */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Previsión de Salud *
                        </label>
                        <select
                          value={workerForm.health}
                          onChange={e => setWorkerForm({ ...workerForm, health: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                        >
                          {HEALTH_OPTIONS.map(s => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Modo de Pago */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Modalidad de Pago *
                        </label>
                        <select
                          value={workerForm.paymentMode}
                          onChange={e =>
                            setWorkerForm({ ...workerForm, paymentMode: e.target.value as PaymentMode })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white font-medium"
                        >
                          <option value="DÍA">Por DÍA / JORNADA ASISTIDA (Estándar)</option>
                          <option value="KILO">Por KILO (Fruta / Cosecha)</option>
                          <option value="HORA">Por HORA (Packing / Faena)</option>
                          <option value="TAREA">Por TAREA / PAÑO (Poda)</option>
                        </select>
                      </div>

                      {/* Tarifa ($ CLP) */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Tarifa / Remuneración ($ CLP por {getUnitSymbol(workerForm.paymentMode)}) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={workerForm.unitRate}
                          onChange={e =>
                            setWorkerForm({
                              ...workerForm,
                              unitRate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Quick Contract Generation Action Banner */}
                    <div className="mt-2 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-800 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-950 text-xs">
                            Plantilla Oficial Art. 159 N°5 Configurada
                          </p>
                          <p className="text-[11px] text-emerald-800">
                            Previsualice o imprima el contrato con los datos actuales antes de guardar.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenContractPrint({ ...workerForm, id: currentWorkerInModal?.id })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs shrink-0 self-end sm:self-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir Contrato Ahora</span>
                      </button>
                    </div>
                  </div>

                  {/* SECCION 2: DATOS PERSONALES & DOMICILIO (COMPLEMENTARIOS) */}
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-600" />
                        2. Datos Personales & Domicilio (Se pueden completar después)
                      </span>
                      <span className="text-[11px] text-slate-400">Opcional para emitir contrato</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Estado Civil */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Estado Civil</label>
                        <select
                          value={workerForm.maritalStatus}
                          onChange={e => setWorkerForm({ ...workerForm, maritalStatus: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                        >
                          {MARITAL_STATUS_OPTIONS.map(m => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Fecha de Nacimiento / Edad */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          value={workerForm.birthDate}
                          onChange={e => {
                            const bDate = e.target.value;
                            let calculatedAge = workerForm.age;
                            if (bDate) {
                              const birthYear = new Date(bDate).getFullYear();
                              const currentYear = new Date().getFullYear();
                              calculatedAge = Math.max(18, currentYear - birthYear);
                            }
                            setWorkerForm({ ...workerForm, birthDate: bDate, age: calculatedAge });
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900"
                        />
                      </div>

                      {/* Domicilio Personal */}
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">
                          Domicilio Particular (Calle, Número, Población, Comuna)
                        </label>
                        <input
                          type="text"
                          placeholder="ej. Pasaje Los Aromos 124, Villa El Bosque, Curicó"
                          value={workerForm.address}
                          onChange={e => setWorkerForm({ ...workerForm, address: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900"
                        />
                      </div>

                      {/* Teléfono */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Teléfono de Contacto
                        </label>
                        <input
                          type="text"
                          value={workerForm.phone}
                          onChange={e => setWorkerForm({ ...workerForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900"
                        />
                      </div>

                      {/* Observaciones */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Observaciones / Cuadrilla
                        </label>
                        <input
                          type="text"
                          placeholder="ej. Cuadrilla norte, turno mañana, etc."
                          value={workerForm.observation}
                          onChange={e => setWorkerForm({ ...workerForm, observation: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-4 flex flex-wrap justify-between items-center gap-2 border-t border-slate-200">
                    {currentWorkerInModal && (
                      <button
                        type="button"
                        onClick={() => setFichaTab('documents')}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Ver Documentos Adjuntos ({workerDocs.length})</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenContractPrint({ ...workerForm, id: currentWorkerInModal?.id })}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Imprimir Contrato</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsWorkerModalOpen(false)}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-xs"
                      >
                        {editingWorker ? 'Guardar Cambios' : 'Registrar Trabajador'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: GESTIÓN DE DOCUMENTOS ADJUNTOS (CONTRATOS, PAPELETAS, FINIQUITOS, ETC.) */}
              {fichaTab === 'documents' && (
                <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                  {!currentWorkerInModal ? (
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="font-bold text-amber-900 text-sm">
                        Primero registre los datos del trabajador
                      </p>
                      <p className="text-amber-700 mt-1">
                        Guarde la ficha en la pestaña anterior para poder adjuntarle contratos, papeletas o finiquitos.
                      </p>
                      <button
                        type="button"
                        onClick={() => setFichaTab('info')}
                        className="mt-3 px-4 py-1.5 bg-amber-800 text-white rounded-lg font-bold"
                      >
                        Volver a Datos del Trabajador
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Document Notice Alert */}
                      {docNotice && (
                        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{docNotice}</span>
                        </div>
                      )}

                      {/* UPLOAD FORM CARD */}
                      <form
                        onSubmit={handleAttachDocument}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-200">
                          <Plus className="w-4 h-4 text-emerald-700" />
                          <span>Adjuntar Nuevo Documento al Expediente</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* File input */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Seleccionar Archivo (PDF, Imagen, Word, Excel)
                            </label>
                            <input
                              type="file"
                              ref={docFileInputRef}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,application/pdf,image/*"
                              onChange={handleDocFileSelect}
                              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-800 file:text-white hover:file:bg-emerald-900 cursor-pointer"
                            />
                            {newDocFileSize && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Tamaño detectado: <strong className="font-mono">{newDocFileSize}</strong>
                              </p>
                            )}
                          </div>

                          {/* Category selector */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Categoría del Documento *
                            </label>
                            <select
                              value={newDocCategory}
                              onChange={e => setNewDocCategory(e.target.value as DocumentCategory)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                            >
                              <option value="CONTRATO_FIRMADO">Contrato Vigente (Firmado)</option>
                              <option value="CONTRATO_PLANTILLA">Contrato Plantilla (Emitido / Borrador)</option>
                              <option value="PAPELETA">Papeleta (Vacaciones / Permiso / Licencia)</option>
                              <option value="FINIQUITO">Finiquito Laboral</option>
                              <option value="CEDULA">Cédula de Identidad / Pasaporte</option>
                              <option value="CERTIFICADO">Certificado (AFP / Antecedentes / Mutual)</option>
                              <option value="OTRO">Otro Documento</option>
                            </select>
                          </div>

                          {/* Document Name */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Nombre o Título del Documento *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="ej. Contrato_Faena_2026.pdf"
                              value={newDocName}
                              onChange={e => setNewDocName(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-medium"
                            />
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Notas / Observaciones del Documento
                            </label>
                            <input
                              type="text"
                              placeholder="ej. Firmado ante notario, autorizado por supervisor..."
                              value={newDocNotes}
                              onChange={e => setNewDocNotes(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir y Adjuntar Documento</span>
                          </button>
                        </div>
                      </form>

                      {/* CATEGORY FILTER PILLS */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-500 mr-1">Filtrar:</span>
                        <button
                          type="button"
                          onClick={() => setDocCategoryFilter('ALL')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            docCategoryFilter === 'ALL'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Todos ({workerDocs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocCategoryFilter('CONTRATO')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            docCategoryFilter === 'CONTRATO'
                              ? 'bg-emerald-800 text-white'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          Contratos ({contratosCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocCategoryFilter('PAPELETA')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            docCategoryFilter === 'PAPELETA'
                              ? 'bg-sky-800 text-white'
                              : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                          }`}
                        >
                          Papeletas ({papeletasCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocCategoryFilter('FINIQUITO')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            docCategoryFilter === 'FINIQUITO'
                              ? 'bg-rose-800 text-white'
                              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          Finiquitos ({finiquitosCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocCategoryFilter('CEDULA')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            docCategoryFilter === 'CEDULA'
                              ? 'bg-amber-800 text-white'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          Cédula ({cedulasCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocCategoryFilter('CERTIFICADO')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            docCategoryFilter === 'CERTIFICADO'
                              ? 'bg-purple-800 text-white'
                              : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                          }`}
                        >
                          Certificados ({certsCount})
                        </button>
                      </div>

                      {/* DOCUMENT LIST */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 text-xs">
                            Expediente Digital del Trabajador ({displayedDocs.length} documentos)
                          </h4>
                        </div>

                        {displayedDocs.length === 0 ? (
                          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-bold text-slate-700 text-xs">
                              No hay documentos adjuntos en esta categoría
                            </p>
                            <p className="text-slate-400 text-[11px] mt-0.5">
                              Adjunte el contrato, papeleta o finiquito utilizando el formulario de arriba.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {displayedDocs.map(doc => {
                              const badge = getDocCategoryBadge(doc.category);
                              const BadgeIcon = badge.icon;

                              return (
                                <div
                                  key={doc.id}
                                  className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-colors flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                      <BadgeIcon className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-xs truncate max-w-[240px] sm:max-w-md" title={doc.name}>
                                          {doc.name}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badge.bg}`}
                                        >
                                          {badge.label}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                        <span>Fecha: {formatDate(doc.uploadDate)}</span>
                                        {doc.fileSize && <span>· {doc.fileSize}</span>}
                                        {doc.notes && (
                                          <span className="italic text-slate-600 truncate max-w-[200px]">
                                            · "{doc.notes}"
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Botón Ver Documento */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingDoc(doc);
                                        setViewingWorker(currentWorkerInModal);
                                      }}
                                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                      title="Visualizar documento en pantalla"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                                      <span>Ver</span>
                                    </button>

                                    {/* Botón Marcar Firmado (para contratos plantilla o no firmados) */}
                                    {(doc.category === 'CONTRATO_PLANTILLA' || (doc.category === 'CONTRATO' && !doc.isSigned)) && (
                                      <button
                                        type="button"
                                        onClick={() => markWorkerDocumentAsSigned(currentWorkerInModal.id, doc.id)}
                                        className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-xs border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Marcar este contrato como firmado y vigente"
                                      >
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="hidden sm:inline">Firmar</span>
                                      </button>
                                    )}

                                    {/* Botón Descargar */}
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadDoc(doc, currentWorkerInModal)}
                                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Descargar archivo a tu equipo"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Descargar</span>
                                    </button>

                                    {/* Botón Eliminar */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`¿Eliminar el documento "${doc.name}" del expediente?`)) {
                                          deleteWorkerDocument(currentWorkerInModal.id, doc.id);
                                        }
                                      }}
                                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                      title="Eliminar documento"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Close Footer */}
                  <div className="pt-4 flex justify-end border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsWorkerModalOpen(false)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Cerrar Expediente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL DE GENERACIÓN E IMPRESIÓN DE CONTRATO OFICIAL */}
      <ErrorBoundary
        isModal={true}
        viewName="Emisión y Lectura de Contrato"
        onClose={() => setIsContractModalOpen(false)}
      >
        <ContractPrintModal
          isOpen={isContractModalOpen}
          onClose={() => setIsContractModalOpen(false)}
          worker={contractModalWorker}
          branchId={contractModalWorker?.branchId}
          onContractAttached={() => {
            setIsContractModalOpen(false);
          }}
        />
      </ErrorBoundary>

      {/* MODAL DE VISUALIZACIÓN DE DOCUMENTOS (VER ARCHIVO / PDF / FOTO / CONTRATO) */}
      <ErrorBoundary
        isModal={true}
        viewName="Visor de Documentos del Expediente"
        onClose={() => {
          setViewingDoc(null);
          setViewingWorker(null);
        }}
      >
        <DocumentViewerModal
          isOpen={!!viewingDoc}
          doc={viewingDoc}
          worker={viewingWorker}
          companyName={settings?.companyName}
          onClose={() => {
            setViewingDoc(null);
            setViewingWorker(null);
          }}
          onMarkAsSigned={docId => {
            if (viewingWorker) {
              markWorkerDocumentAsSigned(viewingWorker.id, docId);
              setViewingDoc(null);
              setViewingWorker(null);
            }
          }}
        />
      </ErrorBoundary>
    </div>
  );
};
