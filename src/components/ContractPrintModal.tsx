import React, { useState } from 'react';
import { Printer, Copy, Check, X, FileCheck, Building2, User, MapPin, Calendar } from 'lucide-react';
import { Worker, Branch } from '../types';
import { useApp } from '../context/AppContext';

interface ContractPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Partial<Worker> | null;
  branchId?: string;
  onContractAttached?: () => void;
}

export const ContractPrintModal: React.FC<ContractPrintModalProps> = ({
  isOpen,
  onClose,
  worker,
  branchId,
  onContractAttached,
}) => {
  const { generateContractText, branches, addWorkerDocument, settings } = useApp();
  const [copied, setCopied] = useState(false);
  const [attached, setAttached] = useState(false);

  if (!isOpen || !worker) return null;

  const targetBranchId = branchId || worker.branchId || branches[0]?.id;
  const branch = branches.find(b => b.id === targetBranchId) || branches[0];
  const contractText = generateContractText(worker, targetBranchId);

  const handleCopy = () => {
    navigator.clipboard.writeText(contractText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAttachToWorker = () => {
    if (!worker.id) return;

    // Convert text to a plain data URL for downloadable preview
    const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' });
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      addWorkerDocument(worker.id!, {
        name: `Contrato_${(worker.name || 'Trabajador').replace(/\s+/g, '_')}_Art159.txt`,
        category: 'CONTRATO',
        fileSize: `${Math.round(blob.size / 1024)} KB`,
        fileType: 'text/plain',
        fileData: dataUrl,
        notes: `Generado desde plantilla oficial (${settings.companyName || 'Empresa'}) para faena ${branch?.name || ''}`,
      });
      setAttached(true);
      if (onContractAttached) {
        onContractAttached();
      }
      setTimeout(() => setAttached(false), 3000);
    };
    reader.readAsDataURL(blob);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Contrato de Trabajo Oficial (Art. 159 N°5)
              </h2>
              <p className="text-xs text-slate-500">
                {worker.name || 'Nuevo Trabajador'} · RUT: {worker.rut || 'Pendiente'} · Faena: {branch?.name || 'General'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            {worker.id && (
              <button
                onClick={handleAttachToWorker}
                disabled={attached}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors shadow-xs disabled:opacity-50"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{attached ? '¡Vinculado a Ficha!' : 'Vincular como Contrato Vigente'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info strip - Hidden on Print */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <strong className="text-slate-800">Empleador:</strong> {settings.companyName}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <strong className="text-slate-800">Faena:</strong> {branch?.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <strong className="text-slate-800">Modalidad:</strong> {worker.contractType === 'INDEFINIDO' ? 'Indefinido' : 'Faena / Plazo Fijo'}
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">
            * Listo para firmar. Se puede imprimir en tamaño Carta / A4.
          </span>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-200/50 print:p-0 print:bg-white print:overflow-visible">
          <div className="max-w-2xl mx-auto bg-white p-8 sm:p-12 shadow-md rounded-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none text-slate-900 text-sm leading-relaxed font-sans">
            <div className="whitespace-pre-wrap font-serif text-[13px] sm:text-[14px] leading-relaxed text-slate-800 selection:bg-amber-100">
              {contractText}
            </div>
          </div>
        </div>

        {/* Footer - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl print:hidden">
          <p className="text-xs text-slate-500">
            Al vincular el contrato como documento, el trabajador pasará a estado de <strong className="text-emerald-700">Contrato Vigente</strong>.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Documento</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
