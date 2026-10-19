import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Save,
  Download,
  Upload,
  RotateCcw,
  Building,
  DollarSign,
  CheckCircle2,
  Folder,
  FileSpreadsheet,
  FileText,
  Copy,
  Sparkles,
  MapPin,
  UserCheck,
  Database,
  GitBranch,
  RefreshCw,
  ExternalLink,
  Terminal,
  AlertCircle,
  Check,
} from 'lucide-react';
import { CONTRACT_KEYS_BY_CATEGORY, DEFAULT_CONTRACT_TEMPLATE } from '../data/contractDefaultTemplate';
import { checkRepositoryUpdates, UpdateCheckResult } from '../services/updateService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    exportDataJSON,
    exportDataCSV,
    importDataJSON,
    resetToDefaults,
    addAuditLog,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'company' | 'contract' | 'backup' | 'updates'>('company');

  const [formData, setFormData] = useState({
    companyName: settings.companyName,
    companyRut: settings.companyRut,
    companyAddress: settings.companyAddress,
    companyPhone: settings.companyPhone,
    companyRepresentative: settings.companyRepresentative || 'Juan Ignacio Valenzuela Prieto',
    companyRepresentativeRut: settings.companyRepresentativeRut || '12.345.678-9',
    signatureCity: settings.signatureCity || 'Curicó',
    contractTemplate: settings.contractTemplate || DEFAULT_CONTRACT_TEMPLATE,
    enableMonetaryValuation: settings.enableMonetaryValuation,
    companyLogoUrl: settings.companyLogoUrl || '',
    localDocumentsPath: settings.localDocumentsPath || 'C:\\AgroControl\\Documentos',
    githubRepoUrl: settings.githubRepoUrl || 'https://github.com/MatiasBalbontin/agrocontrol-pro',
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // GitHub Updates State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [copiedPullCmd, setCopiedPullCmd] = useState(false);
  const [copiedPushCmd, setCopiedPushCmd] = useState(false);

  // Ejecución directa de git pull en entorno Electron (Modo Escritorio)
  const [isPullingGit, setIsPullingGit] = useState(false);
  const [pullExecutionResult, setPullExecutionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sincronizar formData cada vez que se abra el modal o cambien los settings
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        companyName: settings?.companyName || '',
        companyRut: settings?.companyRut || '',
        companyAddress: settings?.companyAddress || '',
        companyPhone: settings?.companyPhone || '',
        companyRepresentative: settings?.companyRepresentative || 'Juan Ignacio Valenzuela Prieto',
        companyRepresentativeRut: settings?.companyRepresentativeRut || '12.345.678-9',
        signatureCity: settings?.signatureCity || 'Curicó',
        contractTemplate: settings?.contractTemplate || DEFAULT_CONTRACT_TEMPLATE,
        enableMonetaryValuation: settings?.enableMonetaryValuation ?? false,
        companyLogoUrl: settings?.companyLogoUrl || '',
        localDocumentsPath: settings?.localDocumentsPath || 'C:\\AgroControl\\Documentos',
        githubRepoUrl: settings?.githubRepoUrl || 'https://github.com/MatiasBalbontin/agrocontrol-pro',
      });
      setUpdateResult(null);
      setPullExecutionResult(null);
    }
  }, [isOpen, settings]);


  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1000);
  };

  const handleInsertKey = (key: string) => {
    // Append or copy
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResetContract = () => {
    if (window.confirm('¿Desea restablecer el texto del contrato al modelo oficial legal (Art. 159 N°5)?')) {
      setFormData(prev => ({
        ...prev,
        contractTemplate: DEFAULT_CONTRACT_TEMPLATE,
      }));
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setImportStatus('Datos importados exitosamente.');
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1200);
      } else {
        setImportStatus('Error: Archivo de respaldo no válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await checkRepositoryUpdates(
        formData.githubRepoUrl || 'https://github.com/MatiasBalbontin/agrocontrol-pro',
        settings.lastCommitSha
      );
      setUpdateResult(result);
      if (result.success) {
        updateSettings({
          lastUpdateCheck: result.checkedAt,
          lastCommitSha: result.latestCommit?.shortSha || settings.lastCommitSha,
          lastCommitMessage: result.latestCommit?.message || settings.lastCommitMessage,
          lastCommitDate: result.latestCommit?.date || settings.lastCommitDate,
        });
        addAuditLog(
          'VERIFICAR_ACTUALIZACION_GITHUB',
          `Verificación con repositorio MatiasBalbontin/agrocontrol-pro: ${result.status} (${result.checkedAt})`
        );
      }
    } catch (e: any) {
      setUpdateResult({
        success: false,
        status: 'ERROR',
        repoUrl: formData.githubRepoUrl || 'https://github.com/MatiasBalbontin/agrocontrol-pro',
        message: e?.message || 'Error inesperado al conectar con GitHub.',
        checkedAt: new Date().toLocaleString('es-CL'),
        pullCommand: 'git pull origin main',
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleCopyPull = () => {
    navigator.clipboard.writeText('git pull origin main');
    setCopiedPullCmd(true);
    setTimeout(() => setCopiedPullCmd(false), 2500);
  };

  const handleCopyPush = () => {
    const cmd = 'git init && git remote add origin https://github.com/MatiasBalbontin/agrocontrol-pro.git && git add . && git commit -m "feat: version inicial AgroControl Pro" && git branch -M main && git push -u origin main';
    navigator.clipboard.writeText(cmd);
    setCopiedPushCmd(true);
    setTimeout(() => setCopiedPushCmd(false), 2500);
  };

  const handleExecutePullElectron = async () => {
    if (!window.electronAPI?.executeGitPull) return;
    setIsPullingGit(true);
    setPullExecutionResult(null);
    try {
      const res = await window.electronAPI.executeGitPull();
      if (res.success) {
        setPullExecutionResult({
          success: true,
          message: '¡Código actualizado exitosamente desde GitHub! La aplicación se reiniciará en 3 segundos para aplicar los cambios...',
        });
        addAuditLog('PULL_GITHUB_EXITOSO', `Actualización automática de código desde GitHub ejecutada`);
        setTimeout(() => {
          window.electronAPI?.restartApp();
        }, 3000);
      } else {
        setPullExecutionResult({
          success: false,
          message: `Error al ejecutar git pull: ${res.message || 'Fallo desconocido'}`,
        });
      }
    } catch (e: any) {
      setPullExecutionResult({
        success: false,
        message: `Error: ${e?.message || 'Error de ejecución'}`,
      });
    } finally {
      setIsPullingGit(false);
    }
  };

  const handlePickFolder = async () => {
    if (window.electronAPI?.selectFolder) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setFormData(prev => ({ ...prev, localDocumentsPath: folder }));
      }
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        '¿Desea restablecer todos los datos a la muestra inicial de faena (49 trabajadores / 3 faenas)?'
      )
    ) {
      resetToDefaults();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Configuración de la Empresa
              </h2>
              <p className="text-xs text-slate-500">
                Perfil de empresa, plantilla oficial de contratos y gestión de respaldos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Header Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 pt-2.5 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'company'
                ? 'border-emerald-800 text-emerald-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Perfil de Empresa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contract'
                ? 'border-emerald-800 text-emerald-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plantilla de Contrato</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-emerald-800 text-emerald-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Respaldos & Base .db</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('updates')}
            className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'updates'
                ? 'border-emerald-800 text-emerald-950 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-700" />
            <span>Actualizaciones (GitHub)</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
          {/* TAB 1: COMPANY & REPRESENTATIVE PROFILE */}
          {activeTab === 'company' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-2.5">
                    <DollarSign className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                    <div>
                      <label htmlFor="enableMonetaryValuation" className="font-bold text-slate-900 cursor-pointer text-xs">
                        Habilitar Valorización Monetaria en Interfaz ($ CLP)
                      </label>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Si está desactivado, el sistema prioriza asistencias físicas y unidades de obra. Si se activa, muestra montos y subtotales en las vistas de producción.
                      </p>
                    </div>
                  </div>
                  <input
                    id="enableMonetaryValuation"
                    type="checkbox"
                    checked={formData.enableMonetaryValuation}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        enableMonetaryValuation: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 rounded text-emerald-800 focus:ring-emerald-600 border-slate-300 cursor-pointer mt-1"
                  />
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <Building className="w-3.5 h-3.5 text-slate-600" />
                  <span>Datos de la Empresa Contratista</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Razón Social de la Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      RUT Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyRut}
                      onChange={e => setFormData({ ...formData, companyRut: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Domicilio Legal de la Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyAddress}
                      onChange={e => setFormData({ ...formData, companyAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Teléfono Institucional
                    </label>
                    <input
                      type="text"
                      value={formData.companyPhone}
                      onChange={e => setFormData({ ...formData, companyPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Representative & Signature City */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Representación Legal y Lugar de Firma</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Esta información se inyecta automáticamente en los contratos de trabajo generados para todos los trabajadores.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Representante Legal *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Juan Ignacio Valenzuela Prieto"
                      value={formData.companyRepresentative}
                      onChange={e => setFormData({ ...formData, companyRepresentative: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      RUT del Representante *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="12.345.678-9"
                      value={formData.companyRepresentativeRut}
                      onChange={e => setFormData({ ...formData, companyRepresentativeRut: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ciudad de Firma de Contratos *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Curicó, Rancagua..."
                      value={formData.signatureCity}
                      onChange={e => setFormData({ ...formData, signatureCity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRACT TEMPLATE EDITOR & KEYS */}
          {activeTab === 'contract' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">
                    Plantilla Maestra de Contrato (Art. 159 N°5 Código del Trabajo)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Haga clic en cualquiera de las llaves abajo para copiarla y usarla en las cláusulas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetContract}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                    title="Restaurar el texto modelo de 10 cláusulas legales"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" />
                    <span>Restablecer Modelo Oficial</span>
                  </button>
                </div>
              </div>

              {/* Categorized Keys Toolbar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                    Marcadores Disponibles por Categoría:
                  </span>
                  {copiedKey && (
                    <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Copiado: {copiedKey}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {CONTRACT_KEYS_BY_CATEGORY.map(group => (
                    <div key={group.category} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-bold text-slate-700 min-w-[110px] text-[10px] uppercase">
                        {group.category}:
                      </span>
                      {group.keys.map(k => (
                        <button
                          key={k.key}
                          type="button"
                          onClick={() => handleInsertKey(k.key)}
                          className="px-2 py-0.5 font-mono text-[10px] bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded shadow-2xs transition-colors"
                          title={`${k.label} (Ej: ${k.example}) - Clic para copiar`}
                        >
                          {k.key}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Textarea for Template */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Texto del Contrato de Trabajo
                </label>
                <textarea
                  rows={14}
                  value={formData.contractTemplate}
                  onChange={e => setFormData({ ...formData, contractTemplate: e.target.value })}
                  className="w-full px-4 py-3 font-mono text-[12px] leading-relaxed border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* TAB 3: BACKUPS, RESTORE & GITHUB */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              {/* Respaldo y Restauración de Datos */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-200">
                  <Database className="w-3.5 h-3.5 text-slate-600" />
                  <span>Respaldo y Seguridad de Datos</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Exporte el respaldo completo de faenas, trabajadores, asistencia y contratos en formato JSON para resguardo o en Excel (.CSV) para el área de contabilidad.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={exportDataCSV}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Descargar para Excel (.CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportDataJSON}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors border border-slate-300"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Respaldo Completo (.JSON)</span>
                  </button>

                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors border border-slate-300 cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Restaurar Respaldo JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus && (
                  <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-300">
                    {importStatus}
                  </p>
                )}
              </div>

              {/* Ruta Local de Almacenamiento de Documentos */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-emerald-800" />
                  <h3 className="font-bold text-slate-800 text-xs">
                    Carpeta Local de Documentos Adjuntos (Modo Escritorio)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ubicación física en el disco local donde se guardan los archivos PDF y fotos de contratos/cédulas (la base de datos .db solo guarda la referencia y metadatos).
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.localDocumentsPath}
                    onChange={e => setFormData({ ...formData, localDocumentsPath: e.target.value })}
                    placeholder="C:\AgroControl\Documentos"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                  {window.electronAPI?.selectFolder && (
                    <button
                      type="button"
                      onClick={handlePickFolder}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs border border-slate-300 transition-colors shrink-0 cursor-pointer"
                    >
                      Examinar...
                    </button>
                  )}
                </div>
              </div>

              {/* Restablecimiento */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Restablecer Datos de Demostración</h4>
                  <p className="text-[11px] text-slate-500">Reinicia la base de datos a los 49 trabajadores y 3 faenas modelo.</p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-lg font-semibold text-xs border border-rose-200 transition-colors"
                >
                  Restablecer Faena Inicial
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: GITHUB UPDATES & CODE SYNCHRONIZATION */}
          {activeTab === 'updates' && (
            <div className="space-y-5">
              {/* Repo Information Banner */}
              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">
                        Repositorio Oficial del Sistema
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        MatiasBalbontin / agrocontrol-pro · Rama main
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://github.com/MatiasBalbontin/agrocontrol-pro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700 self-start sm:self-auto"
                  >
                    <span>Ver en GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block">URL Anclada:</span>
                    <span className="font-mono text-xs text-emerald-400 select-all">
                      https://github.com/MatiasBalbontin/agrocontrol-pro
                    </span>
                  </div>

                  {/* Main Action Button */}
                  <button
                    type="button"
                    onClick={handleCheckUpdate}
                    disabled={isCheckingUpdate}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-md transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? 'Consultando GitHub...' : 'Comprobar Actualizaciones (Pull)'}</span>
                  </button>
                </div>
              </div>

              {/* Status & Latest Commit Info */}
              {updateResult && (
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    updateResult.status === 'UP_TO_DATE'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : updateResult.status === 'UPDATE_AVAILABLE'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : updateResult.status === 'EMPTY_REPO'
                      ? 'bg-sky-50 border-sky-300 text-sky-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {updateResult.status === 'UP_TO_DATE' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )}
                      {updateResult.status === 'UPDATE_AVAILABLE' && (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      {updateResult.status === 'EMPTY_REPO' && (
                        <CheckCircle2 className="w-5 h-5 text-sky-600" />
                      )}
                      {updateResult.status === 'ERROR' && (
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider">
                          {updateResult.status === 'UP_TO_DATE' && '✓ Sistema Sincronizado'}
                          {updateResult.status === 'UPDATE_AVAILABLE' && '⚡ Nueva Versión Disponible en GitHub'}
                          {updateResult.status === 'EMPTY_REPO' && 'ℹ️ Repositorio Vinculado Exitosamente'}
                          {updateResult.status === 'ERROR' && '✕ Error al Consultar Repositorio'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {updateResult.checkedAt}
                        </span>
                      </div>
                      <p className="text-xs">{updateResult.message}</p>

                      {updateResult.latestCommit && (
                        <div className="mt-2 p-2.5 bg-white/80 rounded-lg border border-slate-200 space-y-1 text-slate-800 font-sans">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              Commit: {updateResult.latestCommit.shortSha}
                            </span>
                            <span className="text-slate-500 text-[10px]">
                              {updateResult.latestCommit.date}
                            </span>
                          </div>
                          <p className="font-medium text-xs text-slate-900 truncate">
                            "{updateResult.latestCommit.message}"
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span>Autor: {updateResult.latestCommit.author}</span>
                            <a
                              href={updateResult.latestCommit.htmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span>Ver cambios</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 1-Click Pull for Electron Desktop Mode */}
              {window.electronAPI?.executeGitPull && (
                <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-emerald-700" />
                      <span>Sincronización Automática (Modo Escritorio)</span>
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Electron Nativo
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Descarga los últimos cambios del repositorio GitHub y reinicia la aplicación automáticamente con un solo clic, sin necesidad de abrir la consola ni escribir comandos.
                  </p>
                  <button
                    type="button"
                    onClick={handleExecutePullElectron}
                    disabled={isPullingGit}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPullingGit ? 'animate-spin' : ''}`} />
                    <span>{isPullingGit ? 'Descargando actualización...' : 'Descargar y Aplicar Actualización Ahora (Git Pull & Reinicio)'}</span>
                  </button>

                  {pullExecutionResult && (
                    <p className={`text-xs p-2.5 rounded-lg font-medium ${pullExecutionResult.success ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                      {pullExecutionResult.message}
                    </p>
                  )}
                </div>
              )}

              {/* Instructions and Git Commands */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Terminal className="w-4 h-4 text-emerald-800" />
                  <h4 className="font-bold text-xs">Instrucción para Sincronizar Cambios Locales</h4>
                </div>
                <p className="text-[11px] text-slate-600">
                  Para traer (pull) y fusionar la última versión del repositorio hacia tu entorno local o de escritorio, ejecuta:
                </p>

                <div className="flex items-center gap-2 bg-slate-900 text-emerald-300 p-2.5 rounded-lg font-mono text-xs">
                  <span className="select-all flex-1">git pull origin main</span>
                  <button
                    type="button"
                    onClick={handleCopyPull}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-sans font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPullCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPullCmd ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    ¿Primera vez conectando tu carpeta local a GitHub?
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Si aún no has vinculado esta carpeta con el repositorio remoto, ejecuta una sola vez:
                  </p>
                  <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg font-mono text-[11px] text-slate-700 border border-slate-200">
                    <span className="select-all flex-1 truncate">
                      git init && git remote add origin https://github.com/MatiasBalbontin/agrocontrol-pro.git
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPush}
                      className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-[10px] font-sans font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedPushCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPushCmd ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {settings.lastUpdateCheck && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
                  <span>Última comprobación registrada:</span>
                  <span className="font-semibold text-slate-700">{settings.lastUpdateCheck}</span>
                </div>
              )}
            </div>
          )}

          {/* Save Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {savedNotice ? (
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Configuración guardada correctamente
              </span>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
