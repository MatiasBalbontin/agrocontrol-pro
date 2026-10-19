import {
  Branch,
  Worker,
  ProductionRecord,
  WorkerMovement,
  AuditLogEntry,
  AppSettings,
  WorkerDocument,
} from '../../types';

/**
 * Interfaz universal para el acceso a datos en AgroControl Pro.
 * Permite alternar de manera transparente entre:
 * 1. Modo Escritorio (Electron + SQLite .db local en disco + carpeta de documentos).
 * 2. Modo Web / Desarrollo (Persistencia local en navegador).
 */
export interface IDatabaseService {
  // Faenas
  getBranches(): Promise<Branch[]>;
  saveBranch(branch: Branch): Promise<void>;

  // Trabajadores
  getWorkers(): Promise<Worker[]>;
  saveWorker(worker: Worker): Promise<void>;
  deleteWorker(id: string): Promise<void>;

  // Documentos adjuntos (Metadatos en SQLite, archivo en carpeta local)
  saveWorkerDocument(
    workerId: string,
    document: Omit<WorkerDocument, 'id'>,
    fileBufferOrBase64?: string
  ): Promise<WorkerDocument>;
  deleteWorkerDocument(workerId: string, documentId: string): Promise<void>;

  // Asistencia y Rendimiento
  getProductionRecords(filter?: { date?: string; branchId?: string }): Promise<ProductionRecord[]>;
  saveProductionRecord(record: ProductionRecord): Promise<void>;
  batchSaveProduction(records: ProductionRecord[]): Promise<void>;
  deleteProductionRecord(id: string): Promise<void>;

  // Movimientos de Personal (Altas / Bajas)
  getMovements(): Promise<WorkerMovement[]>;
  saveMovement(movement: WorkerMovement): Promise<void>;

  // Auditoría
  getAuditLogs(): Promise<AuditLogEntry[]>;
  saveAuditLog(log: AuditLogEntry): Promise<void>;
  clearAuditLogs(): Promise<void>;

  // Configuración
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;

  // Mantenimiento de Base de Datos .db
  exportDatabaseFile(): Promise<Uint8Array | Blob>;
  importDatabaseFile(fileData: Uint8Array | Blob): Promise<boolean>;
}
