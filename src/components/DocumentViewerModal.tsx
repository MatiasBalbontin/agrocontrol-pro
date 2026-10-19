import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  FileText,
  FileCheck,
  Shield,
  Award,
  FileMinus,
  File,
  Eye,
  Calendar,
  Building2,
  User,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { Worker, WorkerDocument, DocumentCategory } from '../types';
import { formatDate } from '../utils/formatters';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: WorkerDocument | null;
  worker: Worker | null;
  companyName?: string;
  onMarkAsSigned?: (docId: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  doc,
  worker,
  companyName = 'Agrícola & Servicios del Valle SpA',
  onMarkAsSigned,
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!isOpen || !doc || !worker) return null;

  // Determine file type category
  const isImage =
    doc.fileType?.startsWith('image/') ||
    doc.fileData?.startsWith('data:image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc.name);

  const isPdf =
    doc.fileType === 'application/pdf' ||
    doc.fileData?.startsWith('data:application/pdf') ||
    /\.pdf$/i.test(doc.name);

  const isText =
    doc.fileType?.startsWith('text/') ||
    doc.fileData?.startsWith('data:text/') ||
    /\.(txt|md)$/i.test(doc.name);

  // Extract plain text content if data URL is text
  let decodedTextContent: string | null = null;
  if (doc.fileData && doc.fileData.startsWith('data:text/')) {
    try {
      const commaIndex = doc.fileData.indexOf(',');
      if (commaIndex !== -1) {
        const payload = doc.fileData.slice(commaIndex + 1);
        decodedTextContent = decodeURIComponent(payload);
      }
    } catch {
      decodedTextContent = null;
    }
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (doc.fileData && doc.fileData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const content = `${companyName.toUpperCase()} - RECURSOS HUMANOS\n==========================================================\nEXPEDIENTE DIGITAL DE TRABAJADOR\n\nNombre: ${worker.name}\nRUT: ${worker.rut}\nCódigo: ${worker.id}\nFaena: ${worker.branchId}\n\nDOCUMENTO ADJUNTO:\nTipo: ${doc.category}\nNombre Archivo: ${doc.name}\nFecha Registro: ${doc.uploadDate}\nTamaño: ${doc.fileSize || 'N/A'}\nObservaciones: ${doc.notes || 'Documento oficial en expediente de personal'}\n\n==========================================================\nCertificado digital emitido por ${companyName}.`;
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

  const handlePrint = () => {
    window.print();
  };

  const getCategoryDetails = (cat: DocumentCategory, isSigned?: boolean) => {
    switch (cat) {
      case 'CONTRATO_FIRMADO':
        return {
          label: 'Contrato Vigente (Firmado)',
          bg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
          icon: FileCheck,
          desc: 'Documento laboral formal con firma ratificada del trabajador.',
        };
      case 'CONTRATO_PLANTILLA':
        return {
          label: 'Contrato Plantilla (Emitido)',
          bg: 'bg-amber-100 text-amber-950 border-amber-300',
          icon: FileText,
          desc: 'Borrador oficial emitido para firma presencial del trabajador.',
        };
      case 'CONTRATO':
        return isSigned
          ? {
              label: 'Contrato Vigente (Firmado)',
              bg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
              icon: FileCheck,
              desc: 'Contrato de trabajo con firma vigente.',
            }
          : {
              label: 'Contrato Plantilla / Emitido',
              bg: 'bg-amber-100 text-amber-950 border-amber-300',
              icon: FileText,
              desc: 'Contrato generado desde plantilla del sistema.',
            };
      case 'PAPELETA':
        return {
          label: 'Papeleta / Permiso',
          bg: 'bg-sky-100 text-sky-950 border-sky-300',
          icon: FileCheck,
          desc: 'Permiso administrativo, compensatorio o médico.',
        };
      case 'FINIQUITO':
        return {
          label: 'Finiquito Laboral',
          bg: 'bg-rose-100 text-rose-950 border-rose-300',
          icon: FileMinus,
          desc: 'Acta de finiquito ratificada con término de faena.',
        };
      case 'CEDULA':
        return {
          label: 'Cédula de Identidad',
          bg: 'bg-indigo-100 text-indigo-950 border-indigo-300',
          icon: Shield,
          desc: 'Fotocopia o escaneo de cédula de identidad / carnet.',
        };
      case 'CERTIFICADO':
        return {
          label: 'Certificado / AFP',
          bg: 'bg-purple-100 text-purple-950 border-purple-300',
          icon: Award,
          desc: 'Certificado de afiliación previsional, salud o antecedentes.',
        };
      default:
        return {
          label: 'Documento General',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: File,
          desc: 'Documento anexo en el expediente del trabajador.',
        };
    }
  };

  const catDetails = getCategoryDetails(doc.category, doc.isSigned);
  const CatIcon = catDetails.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header - Hidden on Print */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CatIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm truncate" title={doc.name}>
                  {doc.name}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${catDetails.bg}`}>
                  {catDetails.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {worker.name} · RUT: {worker.rut} · Faena: {worker.branchId} · Subido el {formatDate(doc.uploadDate)}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mark as Signed button if it's currently a template */}
            {(doc.category === 'CONTRATO_PLANTILLA' || (doc.category === 'CONTRATO' && !doc.isSigned)) && onMarkAsSigned && (
              <button
                type="button"
                onClick={() => onMarkAsSigned(doc.id)}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                title="Marcar este contrato como firmado y vigente"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Marcar como Firmado</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors border border-slate-200"
              title="Imprimir documento"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              title="Descargar archivo a tu equipo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-1"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex items-center justify-center min-h-[350px]">
          {/* CASE 1: IMAGE (JPG, PNG, CEDULA, FOTO) */}
          {isImage && doc.fileData && (
            <div className="flex flex-col items-center justify-center max-w-full">
              <div className="bg-slate-900 p-2 sm:p-4 rounded-xl shadow-xl border border-slate-800 flex items-center justify-center">
                <img
                  src={doc.fileData}
                  alt={doc.name}
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg transition-transform duration-150"
                />
              </div>
              <div className="flex items-center gap-2 mt-3 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                  className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Alejar"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-700">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))}
                  className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
                  title="Acercar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="text-[10px] text-emerald-700 font-semibold hover:underline ml-1"
                >
                  Restablecer
                </button>
              </div>
            </div>
          )}

          {/* CASE 2: RAW TEXT / CONTRATO TEXTUAL */}
          {decodedTextContent && (
            <div className="w-full max-w-2xl bg-white p-6 sm:p-10 shadow-lg rounded-xl border border-slate-200 text-slate-800 font-serif leading-relaxed text-[13px] sm:text-[14px]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 font-sans">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Vista de Lectura / Documento Digital
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(decodedTextContent!)}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
                </button>
              </div>

              <div className="whitespace-pre-wrap selection:bg-amber-100 max-h-[60vh] overflow-y-auto pr-2">
                {decodedTextContent}
              </div>
            </div>
          )}

          {/* CASE 3: REAL PDF WITH DATA URL */}
          {isPdf && doc.fileData && doc.fileData.startsWith('data:application/pdf') && (
            <div className="w-full h-[70vh] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <iframe
                src={doc.fileData}
                title={doc.name}
                className="w-full h-full border-0 rounded-xl"
              />
            </div>
          )}

          {/* CASE 4: CERTIFICADO / COMPROBANTE DIGITAL MOCK O METADATOS */}
          {!isImage && !decodedTextContent && !(isPdf && doc.fileData?.startsWith('data:application/pdf')) && (
            <div className="w-full max-w-2xl bg-white p-8 sm:p-12 shadow-xl rounded-2xl border border-slate-200 space-y-6">
              <div className="text-center pb-5 border-b border-slate-200 space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
                  <CatIcon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900">{companyName}</h4>
                <p className="text-xs uppercase tracking-wider font-semibold text-emerald-800">
                  Expediente de Personal & Gestión Laboral
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Registro Digital Oficial · Código: {doc.id}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Trabajador
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{worker.name}</p>
                  <p className="font-mono text-slate-600">RUT: {worker.rut}</p>
                  <p className="text-slate-500">Labor: {worker.labor}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Detalles del Archivo
                  </span>
                  <p className="font-bold text-slate-900 truncate" title={doc.name}>{doc.name}</p>
                  <p className="text-slate-600">Categoría: {catDetails.label}</p>
                  <p className="text-slate-500">Tamaño: {doc.fileSize || 'Estándar'}</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span>Estado del Registro Digital</span>
                </span>
                <p className="text-emerald-900 text-[11px] leading-relaxed">
                  {doc.notes || catDetails.desc}
                </p>
                <div className="pt-2 text-[10px] font-mono text-slate-500 border-t border-emerald-200/60 flex items-center justify-between">
                  <span>Fecha de alta en sistema: {formatDate(doc.uploadDate)}</span>
                  <span>Faena: {worker.branchId}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
                <span className="text-slate-400 text-[11px]">
                  Documento resguardado conforme a normativa laboral.
                </span>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Copia Digital</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 text-[11px]">
            <span><strong>Tipo:</strong> {doc.fileType || 'Documento Digital'}</span>
            <span>·</span>
            <span><strong>Tamaño:</strong> {doc.fileSize || 'N/A'}</span>
            {doc.notes && (
              <>
                <span>·</span>
                <span className="truncate max-w-xs italic text-slate-600">"{doc.notes}"</span>
              </>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            ID: {doc.id}
          </span>
        </div>
      </div>
    </div>
  );
};
