# Arquitectura y Hoja de Ruta para Adaptación Móvil (Android & iOS)
## Legión / AgroControl Pro Mobile

Este documento técnico establece las directrices de ingeniería, diseño de base de datos local y sincronización para la futura adaptación de **Legión / AgroControl Pro** a dispositivos móviles (smartphones y tablets Android / iOS) mediante **React Native con Expo**.

---

## 1. Principios de Diseño en Terreno

Las faenas agrícolas presentan condiciones extremas de operación:
1. **Conectividad Nula o Intermitente**: El 80% de la jornada en fundos, cerros y huertos se realiza sin cobertura 4G/5G ni WiFi. La app debe ser **100% operativa Offline-First**.
2. **Alta Velocidad de Captura**: El supervisor o capataz necesita pasar lista y registrar rendimientos de cuadrillas de 30 a 60 trabajadores en menos de 3 minutos.
3. **Persistencia Local Ultrarrápida**: Transacciones instantáneas en disco mediante **SQLite embebido** (`.db`).
4. **Resguardo Físico de Archivos**: Los documentos (fotos de cédulas, contratos firmados) se guardan en el sistema de archivos local del dispositivo (`FileSystem`), registrando únicamente la ruta relativa en la base de datos para no degradar el rendimiento del motor SQL.

---

## 2. Reutilización de Código Core del Proyecto Web

El proyecto móvil compartirá directamente los módulos agnósticos a la plataforma ubicados en el repositorio:

```
agrocontrol-pro/
├── src/
│   ├── types/index.ts            --> Modelos de datos TypeScript (100% reutilizables)
│   ├── utils/formatters.ts       --> Validación RUT Módulo 11 y formateos CLP
│   ├── utils/calendarUtils.ts    --> Lógica de calendario operacional
│   └── data/contractDefaultTemplate.ts --> Plantilla oficial Art. 159 N°5
```

### Elementos Compartidos:
- **Algoritmo de Validación de RUT**: Misma función `validateRUT` (módulo 11) para evitar discrepancias entre la versión de escritorio y la móvil.
- **Interpolador de Contratos**: La función `generateContractText` funciona sin cambios en React Native.
- **Tipado Estricto**: Las interfaces `Worker`, `Branch`, `ProductionRecord`, `WorkerMovement` y `WorkerDocument` son la fuente única de verdad.

---

## 3. Esquema Relacional SQLite (`agrocontrol.db`)

El esquema SQLite en el dispositivo móvil será idéntico en estructura al archivo `.db` de la versión de escritorio, facilitando respaldos directos, exportaciones e importaciones de base de datos sin transformación.

```sql
-- Habilitar claves foráneas y modo WAL para alta concurrencia y velocidad
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. Faenas / Predios
CREATE TABLE IF NOT EXISTS faenas (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    manager TEXT NOT NULL,
    phone TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 2. Trabajadores
CREATE TABLE IF NOT EXISTS trabajadores (
    id TEXT PRIMARY KEY NOT NULL,
    rut TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    labor TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES faenas(id),
    age INTEGER NOT NULL,
    birth_date TEXT,
    marital_status TEXT,
    address TEXT,
    afp TEXT NOT NULL,
    health TEXT NOT NULL,
    phone TEXT,
    hire_date TEXT NOT NULL,
    contract_type TEXT NOT NULL DEFAULT 'FAENA',
    contract_end_date TEXT,
    weekly_hours TEXT DEFAULT '40',
    daily_schedule TEXT DEFAULT '8',
    payment_mode TEXT NOT NULL DEFAULT 'DÍA',
    unit_rate REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVO', -- ACTIVO, INACTIVO, RETIRADO
    departure_date TEXT,
    departure_reason TEXT,
    sync_status TEXT NOT NULL DEFAULT 'SYNCED', -- SYNCED, PENDING_INSERT, PENDING_UPDATE
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 3. Documentos Adjuntos (Contratos, Cédulas, Finiquitos)
-- REGLA CLAVE: El archivo físico se almacena en el FileSystem local.
-- En la base de datos se guarda solo el path local relativo y metadatos.
CREATE TABLE IF NOT EXISTS documentos_adjuntos (
    id TEXT PRIMARY KEY NOT NULL,
    worker_id TEXT NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- CONTRATO, CEDULA, FINIQUITO, PAPELETA, OTRO
    file_path TEXT NOT NULL, -- Ej: "documents/trab_001_contrato_159.pdf"
    file_size TEXT,
    file_type TEXT,
    upload_date TEXT NOT NULL,
    notes TEXT,
    sync_status TEXT NOT NULL DEFAULT 'PENDING_UPLOAD',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 4. Asistencia y Rendimiento Diario en Terreno
CREATE TABLE IF NOT EXISTS asistencia_produccion (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    branch_id TEXT NOT NULL REFERENCES faenas(id),
    worker_id TEXT NOT NULL REFERENCES trabajadores(id),
    labor TEXT NOT NULL,
    payment_mode TEXT NOT NULL, -- DÍA, KILO, HORA, TAREA
    quantity REAL NOT NULL DEFAULT 1,
    unit_rate REAL NOT NULL,
    total_calculated REAL NOT NULL,
    notes TEXT,
    is_locked INTEGER NOT NULL DEFAULT 0, -- 1 = Jornada cerrada por supervisor
    sync_status TEXT NOT NULL DEFAULT 'PENDING_SYNC',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    UNIQUE(date, branch_id, worker_id, labor)
);

-- 5. Movimientos de Personal (Altas y Bajas)
CREATE TABLE IF NOT EXISTS movimientos_personal (
    id TEXT PRIMARY KEY NOT NULL,
    worker_id TEXT NOT NULL REFERENCES trabajadores(id),
    worker_name TEXT NOT NULL,
    worker_rut TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES faenas(id),
    type TEXT NOT NULL, -- INGRESO, RETIRO, REINCORPORACION
    date TEXT NOT NULL,
    reason TEXT,
    sync_status TEXT NOT NULL DEFAULT 'PENDING_SYNC',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 6. Bitácora de Auditoría Local
CREATE TABLE IF NOT EXISTS bitacora_auditoria (
    id TEXT PRIMARY KEY NOT NULL,
    timestamp TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    user TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'PENDING_SYNC'
);

-- 7. Cola de Mutaciones Offline (Offline Mutation Queue)
CREATE TABLE IF NOT EXISTS cola_mutaciones_offline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_table TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    payload_json TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    retry_count INTEGER NOT NULL DEFAULT 0
);
```

---

## 4. Motor de Sincronización Bidireccional (Delta Sync Engine)

```
┌────────────────────────────────────────────────────────┐
│             SUPERVISOR EN FAENA (MÓVIL)                │
│                                                        │
│  [Pasa Asistencia / Enrola] ──► SQLite Local (.db)     │
│                                      │                 │
│                                      ▼                 │
│                          cola_mutaciones_offline       │
└──────────────────────────────────────┬─────────────────┘
                                       │
                      ¿Hay cobertura 4G/WiFi?
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
                 [ NO ]                                 [ SÍ ]
             Espera en cola                       Envío por lotes
            (Cero bloqueo UI)                 (Delta Sync comprimido)
                                                          │
                                                          ▼
                                              ┌────────────────────────┐
                                              │ SERVIDOR CENTRAL / PC  │
                                              │  Base de Datos Maestra │
                                              └────────────────────────┘
```

### Reglas de Sincronización:
1. **Prioridad Local**: Cada inserción o actualización escribe en `SQLite` en menos de 5 ms. La UI jamás espera una respuesta de red.
2. **Resolución de Conflictos**:
   - En **Asistencia diaria**: *Last-Write-Wins* con marca de tiempo del dispositivo. Una vez que la jornada se marca como bloqueada (`is_locked = 1`), no puede ser sobreescrita por otro supervisor.
   - En **Trabajadores**: Identificación unívoca por RUT. Si el trabajador ya existe en otra faena, se sugiere un traspaso/reincorporación.
3. **Subida Asíncrona de Documentos**:
   - Los registros de base de datos se sincronizan primero (pocos kilobytes).
   - Los archivos de fotos y PDFs se transfieren en segundo plano cuando la señal supera un umbral de ancho de banda estable.

---

## 5. Módulos Nativos Clave en Expo / React Native

### A. Escáner y OCR de Cédula de Identidad Chilena
- **Tecnología recomendada**: `expo-camera` junto con `react-native-vision-camera` y detector de texto OCR local (sin enviar imágenes a servidores externos).
- **Flujo de Enrolamiento en 10 Segundos**:
  1. El supervisor enfoca la cédula chilena.
  2. El OCR detecta el patrón `RUN / RUT: XX.XXX.XXX-X` y los apellidos/nombres.
  3. Ejecuta la validación Módulo 11 en memoria.
  4. Autocompleta la ficha técnica; el supervisor solo selecciona Faena, Labor y Tarifa.

### B. Firma Táctil y Sellado de Contratos
- **Tecnología recomendada**: `react-native-signature-canvas` + `expo-print`.
- **Flujo Operativo**:
  1. Se genera la previsualización del contrato Art. 159 N°5 interpolado.
  2. El trabajador firma con su dedo o lápiz óptico en la pantalla.
  3. La app captura la firma en formato PNG transparente y obtiene las coordenadas GPS del predio (`expo-location`).
  4. Se compila el PDF final, se almacena en `documents/contratos/` y se registra la ruta en `documentos_adjuntos`.

---

## 6. Stack de Librerías Recomendado para la App Móvil

| Dominio | Librería Seleccionada | Justificación |
| :--- | :--- | :--- |
| **Framework Base** | `Expo` (SDK 52+) / `React Native` | Soporte multi-plataforma robusto, TypeScript nativo y fácil despliegue. |
| **Base de Datos Local** | `expo-sqlite` (Next API) | Motor SQLite directo con soporte para transacciones WAL y compatibilidad con el esquema `.db`. |
| **Manejo de Estado** | `Zustand` | Estado reactivo ultraligero (< 2 KB) con selectores para evitar re-renders. |
| **Navegación** | `Expo Router` | Enrutamiento basado en archivos con navegación por pestañas nativas fluidas. |
| **Almacenamiento Físico** | `expo-file-system` | Guardado de PDFs y fotos de cédulas en carpetas locales seguras. |
| **Firma Digital** | `react-native-signature-canvas` | Captura ológrafa en pantalla táctil con exportación en alta resolución. |
| **Generación Documental** | `expo-print` + `expo-sharing` | Creación de contratos membretados en PDF para impresión bluetooth o compartir por WhatsApp. |

---

## 7. Estructura de Proyecto Recomendada (`apps/mobile`)

```
apps/mobile/
├── app/                          # Rutas Expo Router
│   ├── (tabs)/
│   │   ├── index.tsx             # Dashboard móvil
│   │   ├── asistencia.tsx        # Captura rápida de cuadrilla
│   │   ├── trabajadores.tsx      # Fichas y alertas de contrato
│   │   └── configuracion.tsx     # Estado de sincronización y faena
│   ├── trabajador/[id].tsx       # Ficha técnica y legajo documental
│   └── contrato/firmar.tsx       # Módulo de firma táctil y generación PDF
├── src/
│   ├── db/
│   │   ├── schema.sql            # Definición del esquema SQLite local
│   │   ├── database.ts           # Inicialización y migraciones expo-sqlite
│   │   └── repositories/         # Operaciones CRUD tipadas
│   ├── sync/
│   │   ├── syncEngine.ts         # Procesador de la cola offline
│   │   └── conflictResolver.ts   # Reglas de resolución
│   └── shared/                   # Enlace simbólico o paquete a core web
│       ├── types/
│       ├── formatters/
│       └── templates/
```
