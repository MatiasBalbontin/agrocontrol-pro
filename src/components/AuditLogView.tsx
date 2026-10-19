import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  Archive,
  Download,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const AuditLogView: React.FC = () => {
  const { auditLogs, archiveAuditLog, deleteAuditLogsAfterBackup, exportDataCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchArchived = showArchived ? true : !log.archived;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        log.action.toLowerCase().includes(term) ||
        log.description.toLowerCase().includes(term) ||
        log.user.toLowerCase().includes(term);
      return matchArchived && matchSearch;
    });
  }, [auditLogs, showArchived, searchTerm]);

  const handleConfirmClear = () => {
    deleteAuditLogsAfterBackup();
    setIsConfirmDeleteOpen(false);
  };

  const getActionColor = (action: string) => {
    if (action.includes('ALTA') || action.includes('CREAR') || action.includes('REINTEGRO')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (action.includes('BAJA') || action.includes('ELIMINAR')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (action.includes('ASISTENCIA')) {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-slate-900">
              Bitácora Inmutable de Operaciones (Auditoría CRUD)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico obligatorio de altas, bajas, reintegros, asistencias y modificaciones. No puede eliminarse sin previo respaldo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download CSV Backup Button */}
          <button
            onClick={exportDataCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Descargar Respaldo</span>
          </button>

          {/* Clean with Prior Backup Button */}
          <button
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold transition-colors border border-rose-200"
            title="Descarga respaldo automático y libera memoria de registros antiguos"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Liberar Memoria</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar en bitácora por acción, trabajador o usuario..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="rounded text-emerald-800 focus:ring-emerald-600 w-4 h-4"
            />
            <span>Mostrar registros archivados</span>
          </label>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <p className="p-12 text-center text-xs text-slate-400">
            No se encontraron eventos en la bitácora para los filtros seleccionados.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {filteredLogs.map(log => {
              const dateObj = new Date(log.timestamp);
              const dateFormatted = dateObj.toLocaleDateString('es-CL');
              const timeFormatted = dateObj.toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                    log.archived ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 mt-0.5 ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>

                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{log.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {log.user}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {dateFormatted} {timeFormatted}
                        </span>
                        {log.archived && (
                          <span className="text-amber-700 font-semibold">[Archivado]</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {!log.archived && (
                      <button
                        onClick={() => archiveAuditLog(log.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                        title="Archivar registro"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal to Clear Audit after Backup */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm">
                Descargar Respaldo y Liberar Memoria
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Por norma de seguridad laboral, antes de vaciar la bitácora activa el sistema descargará automáticamente el archivo de respaldo <strong>.CSV para Excel</strong> con todos los eventos registrados.
            </p>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
              ¿Desea proceder a descargar el respaldo y limpiar la bitácora activa?
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Descargar y Liberar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
