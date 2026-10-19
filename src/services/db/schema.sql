-- =========================================================================
-- ESQUEMA SQLITE MAESTRO - AGROCONTROL PRO / LEGIÓN (MODO ESCRITORIO .DB)
-- Compatible con SQLite 3 / better-sqlite3 / expo-sqlite
-- =========================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. Faenas Operativas (Fundos, Huertos, Packings)
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    manager TEXT NOT NULL,
    phone TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 2. Trabajadores y Fichas Laborales
CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY NOT NULL,
    rut TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    labor TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES branches(id),
    age INTEGER NOT NULL,
    birth_date TEXT,
    marital_status TEXT,
    address TEXT,
    afp TEXT NOT NULL,
    health TEXT NOT NULL,
    phone TEXT,
    hire_date TEXT NOT NULL,
    contract_type TEXT NOT NULL DEFAULT 'FAENA', -- FAENA, PLAZO_FIJO, INDEFINIDO
    contract_end_date TEXT,
    weekly_hours TEXT DEFAULT '40',
    daily_schedule TEXT DEFAULT '8',
    payment_mode TEXT NOT NULL DEFAULT 'DÍA', -- DÍA, KILO, HORA, TAREA
    unit_rate REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVO', -- ACTIVO, INACTIVO, RETIRADO
    departure_date TEXT,
    departure_reason TEXT,
    custom_fields_json TEXT DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 3. Documentos Adjuntos (Contratos, Cédulas, Finiquitos)
-- Los archivos físicos (PDFs, imágenes) se almacenan en la carpeta de documentos de la aplicación.
-- En esta tabla se almacena únicamente la ruta local del archivo y sus metadatos.
CREATE TABLE IF NOT EXISTS worker_documents (
    id TEXT PRIMARY KEY NOT NULL,
    worker_id TEXT NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- CONTRATO, PAPELETA, FINIQUITO, CEDULA, CERTIFICADO, OTRO
    file_path TEXT NOT NULL, -- Ruta relativa dentro de la carpeta local de documentos
    file_size TEXT,
    file_type TEXT,
    upload_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 4. Asistencia Diaria y Rendimientos en Terreno
CREATE TABLE IF NOT EXISTS production_records (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    branch_id TEXT NOT NULL REFERENCES branches(id),
    worker_id TEXT NOT NULL REFERENCES workers(id),
    labor TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit_rate REAL NOT NULL,
    total_calculated REAL NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE(date, branch_id, worker_id, labor)
);

-- 5. Movimientos de Personal (Altas, Bajas y Reintegros)
CREATE TABLE IF NOT EXISTS worker_movements (
    id TEXT PRIMARY KEY NOT NULL,
    worker_id TEXT NOT NULL REFERENCES workers(id),
    worker_name TEXT NOT NULL,
    worker_rut TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES branches(id),
    type TEXT NOT NULL, -- INGRESO, RETIRO, REINCORPORACION
    date TEXT NOT NULL,
    reason TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 6. Bitácora de Auditoría (Registro Inmutable CRUD)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY NOT NULL,
    timestamp TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    user TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 7. Configuración Corporativa y Plantilla Legal
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT NOT NULL,
    company_rut TEXT NOT NULL,
    company_address TEXT NOT NULL,
    company_phone TEXT NOT NULL,
    company_representative TEXT,
    company_representative_rut TEXT,
    signature_city TEXT,
    contract_template TEXT,
    company_logo_url TEXT,
    enable_monetary_valuation INTEGER NOT NULL DEFAULT 0,
    local_documents_path TEXT DEFAULT 'documents',
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Índices de alto rendimiento para búsquedas y filtros en tiempo real
CREATE INDEX IF NOT EXISTS idx_workers_rut ON workers(rut);
CREATE INDEX IF NOT EXISTS idx_workers_branch ON workers(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_production_date_branch ON production_records(date, branch_id);
CREATE INDEX IF NOT EXISTS idx_documents_worker ON worker_documents(worker_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON worker_movements(date, branch_id);
