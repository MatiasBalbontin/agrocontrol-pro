export type PaymentMode = 'DÍA' | 'KILO' | 'HORA' | 'TAREA';

export type WorkerStatus = 'ACTIVO' | 'INACTIVO' | 'RETIRADO';

export type CustomFieldType = 'text' | 'number' | 'date';

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  value: string | number;
}

export type DocumentCategory =
  | 'CONTRATO'
  | 'PAPELETA'
  | 'FINIQUITO'
  | 'CEDULA'
  | 'CERTIFICADO'
  | 'OTRO';

export interface WorkerDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  uploadDate: string; // YYYY-MM-DD
  fileSize?: string;
  fileType?: string;
  fileData?: string; // Data URL for download / preview
  notes?: string;
}

export type ContractType = 'FAENA' | 'PLAZO_FIJO' | 'INDEFINIDO';

export interface Worker {
  id: string;
  rut: string;
  name: string;
  labor: string;
  branchId: string; // Faena ID
  age: number;
  birthDate?: string;
  maritalStatus?: string;
  address?: string;
  afp: string;
  health: string;
  phone: string;
  hireDate: string; // YYYY-MM-DD
  status: WorkerStatus;
  contractType?: ContractType;
  contractEndDate?: string; // YYYY-MM-DD (caducidad del contrato si no es indefinido)
  weeklyHours?: string;
  dailySchedule?: string;
  departureDate?: string;
  departureReason?: string;
  paymentMode: PaymentMode;
  unitRate: number; // $ CLP per unit
  customFields: CustomField[];
  documents?: WorkerDocument[];
}

export interface WorkerContractCompliance {
  status: 'NO_CONTRACT' | 'EXPIRED' | 'EXPIRING_SOON' | 'VALID' | 'RETIRED';
  label: string;
  isBlinking: boolean;
  message?: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
  active: boolean;
}

// Alias for domain consistency
export type Faena = Branch;

export type MovementType = 'INGRESO' | 'RETIRO' | 'REINCORPORACION';

export interface WorkerMovement {
  id: string;
  workerId: string;
  workerName: string;
  workerRut: string;
  branchId: string;
  type: MovementType;
  date: string; // YYYY-MM-DD
  reason?: string;
  note?: string;
}

export interface ProductionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  branchId: string;
  workerId: string;
  labor: string;
  paymentMode: PaymentMode;
  quantity: number;
  unitRate: number;
  totalCalculated: number;
  notes?: string;
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'SUPERVISOR';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO String
  action: string;
  description: string;
  user: string;
  archived?: boolean;
}

export interface AppSettings {
  companyName: string;
  companyRut: string;
  companyAddress: string;
  companyPhone: string;
  companyRepresentative?: string;
  companyRepresentativeRut?: string;
  signatureCity?: string;
  contractTemplate?: string;
  companyLogoUrl?: string;
  enableMonetaryValuation: boolean; // Default false
  localDocumentsPath?: string; // Ruta de almacenamiento local de documentos adjuntos
  githubRepoUrl: string; // Repositorio oficial anclado
  lastUpdateCheck?: string;
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCommitDate?: string;
}

export const AFP_OPTIONS = [
  'Habitat',
  'Provida',
  'Capital',
  'Cuprum',
  'Modelo',
  'PlanVital',
  'Uno',
  'Sin Previsión (Exento)',
];

export const HEALTH_OPTIONS = [
  'Fonasa (Tramo A)',
  'Fonasa (Tramo B)',
  'Fonasa (Tramo C)',
  'Fonasa (Tramo D)',
  'Isapre Banmédica',
  'Isapre Colmena',
  'Isapre Consalud',
  'Isapre CruzBlanca',
  'Isapre Nueva Masvida',
  'Isapre Vida Tres',
  'Particular / Otro',
];

export const WEEKLY_HOURS_OPTIONS = [
  '40 Horas Semanales (Ley 40 Horas)',
  '44 Horas Semanales',
  '45 Horas Semanales',
  '30 Horas Semanales (Parcial)',
  'Por Turnos / Excepcional',
];

export const DAILY_HOURS_OPTIONS = [
  '8 Horas Diarias (08:00 a 17:00 c/colación)',
  '9 Horas Diarias (08:00 a 18:00 c/colación)',
  'Jornada Flexible según Faena',
  'Turno Rotativo Día/Noche',
];

export const MARITAL_STATUS_OPTIONS = [
  'Soltero(a)',
  'Casado(a)',
  'Conviviente Civil',
  'Viudo(a)',
  'Divorciado(a)',
];

export const CONTRACT_TYPE_OPTIONS: { label: string; value: ContractType }[] = [
  { label: 'Por Obra o Faena Determinada (Art. 159 N°5)', value: 'FAENA' },
  { label: 'Plazo Fijo', value: 'PLAZO_FIJO' },
  { label: 'Indefinido', value: 'INDEFINIDO' },
];

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      executeGitPull: () => Promise<{ success: boolean; message: string; output?: string }>;
      restartApp: () => Promise<void>;
      getAppVersion: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      selectFolder: () => Promise<string | null>;
    };
  }
}
