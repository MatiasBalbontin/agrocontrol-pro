import { Branch, Worker, WorkerMovement, ProductionRecord, AppSettings, ContractType } from '../types';
import { getTodayDateString, getDateDaysAgo } from '../utils/formatters';
import { DEFAULT_CONTRACT_TEMPLATE } from './contractDefaultTemplate';

const today = getTodayDateString();
const yesterday = getDateDaysAgo(1);
const twoDaysAgo = getDateDaysAgo(2);
const fiveDaysAgo = getDateDaysAgo(5);
const tenDaysAgo = getDateDaysAgo(10);
const thirtyDaysAgo = getDateDaysAgo(30);

export const initialBranches: Branch[] = [
  {
    id: 'SUC-01',
    name: 'Faena Fundo Los Aromos (Curicó)',
    location: 'Camino Los Niches Km 8.5, Curicó, Región del Maule',
    manager: 'Manuel Valenzuela Rojas',
    phone: '+56 9 8451 2233',
    active: true,
  },
  {
    id: 'SUC-02',
    name: 'Faena Fundo San Francisco (Rancagua)',
    location: 'Ruta H-30 Sector El Olivar, Rancagua, Región de O\'Higgins',
    manager: 'Carmen Gloria Fuentes M.',
    phone: '+56 9 7612 9044',
    active: true,
  },
  {
    id: 'SUC-03',
    name: 'Faena Packing Central El Roble (Paine)',
    location: 'Camino El Tránsito 1420, Paine, Región Metropolitana',
    manager: 'Patricio Araya Sandoval',
    phone: '+56 9 9123 4455',
    active: true,
  },
];

// 49 Chilean Workers distributed in 3 branches for the real field pilot
// SUC-01: 18 workers | SUC-02: 16 workers | SUC-03: 15 workers (Total = 49)
const rawWorkersData = [
  // --- SUC-01: Fundo Los Aromos (18 trabajadores) ---
  { rut: '17.892.431-5', name: 'José Ignacio Henríquez Silva', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 34, afp: 'Provida', health: 'Fonasa B', obs: 'Cuadrilla 1' },
  { rut: '16.541.209-8', name: 'Marcela Viviana Soto Navarrete', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 29, afp: 'Habitat', health: 'Fonasa B', obs: 'Jefa de hilera' },
  { rut: '18.349.112-2', name: 'Claudio Andrés Mellado Garrido', labor: 'Poda y Amarre', branchId: 'SUC-01', age: 41, afp: 'Modelo', health: 'Isapre Colmena', obs: 'Tijera electrocoup #14' },
  { rut: '15.981.304-4', name: 'Rodrigo Esteban Morales Tapia', labor: 'Riego Tecnificado', branchId: 'SUC-01', age: 46, afp: 'Cuprum', health: 'Fonasa C', obs: 'Turno diurno' },
  { rut: '14.238.901-7', name: 'Pedro Antonio Carvajal Muñoz', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 52, afp: 'Habitat', health: 'Fonasa D', obs: '' },
  { rut: '19.452.189-3', name: 'Gonzalo Alexis Urzúa Becerra', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 23, afp: 'Uno', health: 'Fonasa A', obs: '' },
  { rut: '17.112.564-9', name: 'Camila Andrea Poblete Castro', labor: 'Selección de Fruta', branchId: 'SUC-01', age: 31, afp: 'Provida', health: 'Fonasa B', obs: '' },
  { rut: '16.890.342-1', name: 'Jorge Hernán Cornejo Bravo', labor: 'Tractorista y Maquinaria', branchId: 'SUC-01', age: 39, afp: 'Modelo', health: 'Fonasa C', obs: 'Licencia D' },
  { rut: '18.776.432-6', name: 'Daniela Paz Valenzuela Riquelme', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 27, afp: 'PlanVital', health: 'Fonasa B', obs: '' },
  { rut: '13.987.654-2', name: 'Segundo Manuel Osses Díaz', labor: 'Mantención de Cuarteles', branchId: 'SUC-01', age: 57, afp: 'Habitat', health: 'Fonasa C', obs: '' },
  { rut: '19.231.879-0', name: 'Matías Ignacio Flores San Martín', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 24, afp: 'Provida', health: 'Fonasa A', obs: '' },
  { rut: '15.654.321-8', name: 'Margarita Rosa Lizama Pinto', labor: 'Selección de Fruta', branchId: 'SUC-01', age: 45, afp: 'Modelo', health: 'Fonasa B', obs: '' },
  { rut: '18.120.459-K', name: 'Sebastián Patricio Gajardo Olea', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 33, afp: 'Habitat', health: 'Fonasa B', obs: '' },
  { rut: '17.439.012-4', name: 'Álvaro Javier Céspedes Loyola', labor: 'Poda y Amarre', branchId: 'SUC-01', age: 36, afp: 'Cuprum', health: 'Isapre Banmédica', obs: '' },
  { rut: '20.109.843-1', name: 'Valentina Soledad Mena Godoy', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 21, afp: 'Uno', health: 'Fonasa A', obs: '' },
  { rut: '16.329.871-3', name: 'Raúl Alfonso Barahona Vidal', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 42, afp: 'Provida', health: 'Fonasa C', obs: '' },
  { rut: '18.904.321-7', name: 'Francisca Elena Sepúlveda Toro', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 28, afp: 'PlanVital', health: 'Fonasa B', obs: '' },
  { rut: '17.332.654-1', name: 'Carolina Paz Albornoz Mena', labor: 'Cosecha y Recolección', branchId: 'SUC-01', age: 31, afp: 'Modelo', health: 'Fonasa B', obs: 'Retirada fin faena' },

  // --- SUC-02: Fundo San Francisco (16 trabajadores) ---
  { rut: '19.882.115-7', name: 'Franco Nicolás Carrasco Pino', labor: 'Raleo y Poda Verde', branchId: 'SUC-02', age: 24, afp: 'Habitat', health: 'Fonasa A', obs: 'Cuadrilla 2 Norte' },
  { rut: '13.411.902-6', name: 'Héctor Ramón Aguilera Fuentes', labor: 'Aplicación Fitosanitaria', branchId: 'SUC-02', age: 53, afp: 'Provida', health: 'Fonasa C', obs: 'Carnet SAG' },
  { rut: '18.543.210-9', name: 'Diego Alonso Miranda Herrera', labor: 'Raleo y Poda Verde', branchId: 'SUC-02', age: 30, afp: 'Modelo', health: 'Fonasa B', obs: '' },
  { rut: '16.782.901-4', name: 'Loreto Alejandra Vergara Peña', labor: 'Control de Malezas', branchId: 'SUC-02', age: 40, afp: 'PlanVital', health: 'Fonasa B', obs: '' },
  { rut: '17.654.389-2', name: 'Cristian Eduardo Salazar Soto', labor: 'Tractorista y Maquinaria', branchId: 'SUC-02', age: 35, afp: 'Provida', health: 'Fonasa C', obs: 'Tractor New Holland' },
  { rut: '15.340.112-8', name: 'Juan Bautista Farías Morales', labor: 'Riego por Goteo', branchId: 'SUC-02', age: 48, afp: 'Cuprum', health: 'Fonasa D', obs: '' },
  { rut: '19.012.345-6', name: 'Bastián Ignacio Rojas Lara', labor: 'Raleo y Poda Verde', branchId: 'SUC-02', age: 25, afp: 'Uno', health: 'Fonasa A', obs: '' },
  { rut: '18.234.567-K', name: 'Patricia Andrea Bustos Gómez', labor: 'Raleo y Poda Verde', branchId: 'SUC-02', age: 32, afp: 'Habitat', health: 'Fonasa B', obs: '' },
  { rut: '14.890.123-5', name: 'Víctor Manuel Concha Abarca', labor: 'Mantención General', branchId: 'SUC-02', age: 51, afp: 'Provida', health: 'Fonasa C', obs: '' },
  { rut: '17.901.234-8', name: 'Macarena Belén Silva Bravo', labor: 'Raleo y Poda Verde', branchId: 'SUC-02', age: 29, afp: 'Modelo', health: 'Fonasa B', obs: '' },
  { rut: '16.234.890-1', name: 'Andrés Felipe Leiva Guzmán', labor: 'Raleo y Poda Verde', branchId: 'SUC-02', age: 43, afp: 'PlanVital', health: 'Fonasa C', obs: '' },
  { rut: '19.456.789-2', name: 'Javiera Ignacia Cordero Ortiz', labor: 'Control de Calidad en Campo', branchId: 'SUC-02', age: 26, afp: 'Habitat', health: 'Isapre Colmena', obs: '' },
  { rut: '18.678.901-3', name: 'Gabriel Alejandro Palma Núñez', labor: 'Raleo y Poda Verde', branchId: 'SUC-02', age: 31, afp: 'Provida', health: 'Fonasa B', obs: '' },
  { rut: '15.890.123-7', name: 'Rosa Ester Maldonado Reyes', labor: 'Control de Malezas', branchId: 'SUC-02', age: 47, afp: 'Modelo', health: 'Fonasa B', obs: '' },
  { rut: '20.345.678-0', name: 'Felipe Andrés Venegas Toledo', labor: 'Raleo y Poda Verde', branchId: 'SUC-02', age: 22, afp: 'Uno', health: 'Fonasa A', obs: '' },
  { rut: '16.118.992-K', name: 'Luis Fernando Oyarzún Díaz', labor: 'Poda y Desyeme', branchId: 'SUC-02', age: 43, afp: 'Habitat', health: 'Fonasa C', obs: 'Retirado fin faena' },

  // --- SUC-03: Packing Central El Roble (15 trabajadores) ---
  { rut: '19.124.876-0', name: 'Yaritza Camila Valdés Parra', labor: 'Selección y Empaque', branchId: 'SUC-03', age: 26, afp: 'PlanVital', health: 'Fonasa B', obs: 'Línea Clamshell' },
  { rut: '14.773.201-9', name: 'Guillermo Enrique Bravo Llanos', labor: 'Paletizado y Despacho', branchId: 'SUC-03', age: 50, afp: 'Uno', health: 'Fonasa D', obs: 'Grúa horquilla' },
  { rut: '18.912.345-4', name: 'Tamara Nicole Fuentes Espinoza', labor: 'Selección y Empaque', branchId: 'SUC-03', age: 28, afp: 'Habitat', health: 'Fonasa B', obs: '' },
  { rut: '17.234.567-8', name: 'Mauricio Alejandro Quezada Pino', labor: 'Recepción y Pesaje', branchId: 'SUC-03', age: 37, afp: 'Provida', health: 'Fonasa C', obs: 'Báscula central' },
  { rut: '16.890.123-2', name: 'Claudia Marcela Garrido Rivas', labor: 'Selección y Empaque', branchId: 'SUC-03', age: 41, afp: 'Modelo', health: 'Fonasa B', obs: '' },
  { rut: '19.678.901-5', name: 'Benjamín Ignacio Araya Soto', labor: 'Paletizado y Despacho', branchId: 'SUC-03', age: 24, afp: 'Uno', health: 'Fonasa A', obs: '' },
  { rut: '15.456.789-0', name: 'Gladys del Carmen Vargas Toro', labor: 'Selección y Empaque', branchId: 'SUC-03', age: 49, afp: 'Provida', health: 'Fonasa C', obs: '' },
  { rut: '18.123.456-7', name: 'Nicolás Eduardo Morales Campos', labor: 'Control de Temperatura y Frío', branchId: 'SUC-03', age: 32, afp: 'Habitat', health: 'Isapre CruzBlanca', obs: 'Túnel frío' },
  { rut: '17.890.123-9', name: 'Romina Andrea Alarcón Baeza', labor: 'Selección y Empaque', branchId: 'SUC-03', age: 35, afp: 'Modelo', health: 'Fonasa B', obs: '' },
  { rut: '20.012.345-8', name: 'Tomás Vicente Santibáñez Lepe', labor: 'Enzunchado y Sellado', branchId: 'SUC-03', age: 22, afp: 'Uno', health: 'Fonasa A', obs: '' },
  { rut: '16.567.890-3', name: 'Lorena Patricia Guzmán Correa', labor: 'Selección y Empaque', branchId: 'SUC-03', age: 44, afp: 'PlanVital', health: 'Fonasa B', obs: '' },
  { rut: '18.456.789-1', name: 'Hernán Esteban Pacheco Mellado', labor: 'Paletizado y Despacho', branchId: 'SUC-03', age: 33, afp: 'Provida', health: 'Fonasa C', obs: '' },
  { rut: '19.789.012-6', name: 'Constanza Paz Valenzuela Neira', labor: 'Etiquetado y Trazabilidad', branchId: 'SUC-03', age: 25, afp: 'Habitat', health: 'Fonasa B', obs: '' },
  { rut: '15.123.456-2', name: 'Óscar Manuel Cárdenas Silva', labor: 'Mantención de Cámaras', branchId: 'SUC-03', age: 52, afp: 'Cuprum', health: 'Fonasa D', obs: '' },
  { rut: '17.678.901-0', name: 'Evelyn Soledad Caroca Fuentes', labor: 'Selección y Empaque', branchId: 'SUC-03', age: 36, afp: 'Modelo', health: 'Fonasa B', obs: '' },
];

export const initialWorkers: Worker[] = rawWorkersData.map((w, index) => {
  const isRetired = w.obs.includes('Retirad');
  const workerId = `TRAB-${String(index + 1).padStart(3, '0')}`;
  return {
    id: workerId,
    rut: w.rut,
    name: w.name,
    labor: w.labor,
    branchId: w.branchId,
    age: w.age,
    afp: w.afp,
    health: w.health,
    phone: `+56 9 ${Math.floor(5000 + Math.random() * 4000)} ${Math.floor(1000 + Math.random() * 9000)}`,
    hireDate: thirtyDaysAgo,
    status: isRetired ? 'RETIRADO' : 'ACTIVO',
    departureDate: isRetired ? getDateDaysAgo(4) : undefined,
    departureReason: isRetired ? 'Término de faena acordada' : undefined,
    // Production by Day (Asistencia / Jornada diaria) as requested by user
    // Initial attached documents for HR dossier (Contratos, Papeletas, Finiquitos, Cédulas)
    documents:
      index === 0
        ? [
            {
              id: 'DOC-001',
              name: 'Contrato_Trabajo_Temporada_2026.pdf',
              category: 'CONTRATO',
              uploadDate: thirtyDaysAgo,
              fileSize: '420 KB',
              fileType: 'application/pdf',
              notes: 'Contrato faena agrícola firmado',
            },
            {
              id: 'DOC-002',
              name: 'Cedula_Identidad_Anverso_Reverso.jpg',
              category: 'CEDULA',
              uploadDate: thirtyDaysAgo,
              fileSize: '1.2 MB',
              fileType: 'image/jpeg',
              notes: 'Cédula vigente hasta 2028',
            },
            {
              id: 'DOC-003',
              name: 'Papeleta_Permiso_Compensatorio.pdf',
              category: 'PAPELETA',
              uploadDate: getDateDaysAgo(6),
              fileSize: '185 KB',
              fileType: 'application/pdf',
              notes: 'Papeleta de permiso autorizada por encargado de fundo',
            },
          ]
        : index === 1
        ? [
            {
              id: 'DOC-004',
              name: 'Contrato_Faena_Jefa_Hilera.pdf',
              category: 'CONTRATO',
              uploadDate: thirtyDaysAgo,
              fileSize: '390 KB',
              fileType: 'application/pdf',
            },
            {
              id: 'DOC-005',
              name: 'Certificado_Cotizaciones_AFP.pdf',
              category: 'CERTIFICADO',
              uploadDate: getDateDaysAgo(15),
              fileSize: '210 KB',
              fileType: 'application/pdf',
            },
          ]
        : isRetired
        ? [
            {
              id: `DOC-FIN-${index}`,
              name: 'Finiquito_Laboral_Firmado_Notaria.pdf',
              category: 'FINIQUITO',
              uploadDate: getDateDaysAgo(4),
              fileSize: '890 KB',
              fileType: 'application/pdf',
              notes: 'Ratificado en Notaría de Curicó. Pago efectuado.',
            },
            {
              id: `DOC-CON-${index}`,
              name: 'Contrato_Trabajo_Historico.pdf',
              category: 'CONTRATO',
              uploadDate: thirtyDaysAgo,
              fileSize: '410 KB',
              fileType: 'application/pdf',
            },
          ]
        : (index === 2 || index === 6)
        ? [
            {
              id: `DOC-CED-${index}`,
              name: 'Cedula_Identidad.jpg',
              category: 'CEDULA',
              uploadDate: thirtyDaysAgo,
              fileSize: '310 KB',
              fileType: 'image/jpeg',
              notes: 'Cédula registrada. Contrato pendiente de firma y carga.',
            },
          ]
        : [
            {
              id: `DOC-BASE-${index}`,
              name: 'Contrato_Trabajo_Agricola.pdf',
              category: 'CONTRATO',
              uploadDate: thirtyDaysAgo,
              fileSize: '380 KB',
              fileType: 'application/pdf',
            },
          ],
    contractType: (index % 7 === 0 ? 'INDEFINIDO' : index % 3 === 0 ? 'PLAZO_FIJO' : 'FAENA') as ContractType,
    contractEndDate: index === 4 ? getDateDaysAgo(3) : index % 7 === 0 ? undefined : getDateDaysAgo(-45),
    weeklyHours: '40 Horas Semanales (Ley 40 Horas)',
    dailySchedule: '8 Horas Diarias (08:00 a 17:00 c/colación)',
    maritalStatus: 'Soltero(a)',
    address: 'Sector Rural s/n',
    birthDate: `19${85 + (index % 15)}-05-14`,
    paymentMode: 'DÍA' as const,
    unitRate: 28000,
    customFields: [],
  };
});

export const initialAuditLogs = [
  {
    id: 'LOG-001',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    action: 'INICIALIZACION_SISTEMA',
    description: 'Apertura de faena agrícola y alta de cuadrilla inicial (49 trabajadores en 3 sucursales)',
    user: 'Administrador General',
    archived: false,
  },
  {
    id: 'LOG-002',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    action: 'REGISTRO_ASISTENCIA',
    description: 'Cierre de asistencia de faena diaria Fundo Los Aromos (17 presentes)',
    user: 'Supervisor Manuel Valenzuela',
    archived: false,
  },
  {
    id: 'LOG-003',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    action: 'REGISTRO_ASISTENCIA',
    description: 'Registro de asistencia diaria en terreno (45 trabajadores presentes)',
    user: 'Supervisor de Faena',
    archived: false,
  },
];

export const initialMovements: WorkerMovement[] = [
  {
    id: 'MOV-01',
    workerId: 'TRAB-001',
    workerName: 'José Ignacio Henríquez Silva',
    workerRut: '17.892.431-5',
    branchId: 'SUC-01',
    type: 'INGRESO',
    date: thirtyDaysAgo,
    reason: 'Inicio faena de temporada agrícola',
  },
  {
    id: 'MOV-02',
    workerId: 'TRAB-019',
    workerName: 'Franco Nicolás Carrasco Pino',
    workerRut: '19.882.115-7',
    branchId: 'SUC-02',
    type: 'INGRESO',
    date: fiveDaysAgo,
    reason: 'Incorporación cuadrilla raleo',
  },
  {
    id: 'MOV-03',
    workerId: 'TRAB-018',
    workerName: 'Carolina Paz Albornoz Mena',
    workerRut: '17.332.654-1',
    branchId: 'SUC-01',
    type: 'RETIRO',
    date: getDateDaysAgo(4),
    reason: 'Término de faena acordada',
  },
  {
    id: 'MOV-04',
    workerId: 'TRAB-034',
    workerName: 'Luis Fernando Oyarzún Díaz',
    workerRut: '16.118.992-K',
    branchId: 'SUC-02',
    type: 'RETIRO',
    date: getDateDaysAgo(4),
    reason: 'Término de faena acordada',
  },
];

// Initial Attendance Records: yesterday and twoDaysAgo recorded for historical reports & calendar green days.
// TODAY starts completely clean (0 asistentes), so workers are added additively as they arrive in the field.
export const initialProduction: ProductionRecord[] = [
  // Yesterday's attendance for reference (all except TRAB-015 attended)
  ...initialWorkers
    .filter(w => w.status === 'ACTIVO' && w.id !== 'TRAB-015')
    .map(w => ({
      id: `PROD-YEST-${w.id}`,
      date: yesterday,
      branchId: w.branchId,
      workerId: w.id,
      labor: w.labor,
      paymentMode: 'DÍA' as const,
      quantity: 1, // 1 día asistido
      unitRate: w.unitRate,
      totalCalculated: 1 * w.unitRate,
      notes: 'Asistencia confirmada en faena',
      createdAt: new Date().toISOString(),
    })),
  // Two days ago attendance
  ...initialWorkers
    .filter(w => w.status === 'ACTIVO' && w.id !== 'TRAB-008' && w.id !== 'TRAB-022')
    .map(w => ({
      id: `PROD-2DAYS-${w.id}`,
      date: twoDaysAgo,
      branchId: w.branchId,
      workerId: w.id,
      labor: w.labor,
      paymentMode: 'DÍA' as const,
      quantity: 1,
      unitRate: w.unitRate,
      totalCalculated: 1 * w.unitRate,
      notes: 'Jornada normal de faena',
      createdAt: new Date().toISOString(),
    })),
];

export const initialSettings: AppSettings = {
  companyName: 'Agrícola & Servicios del Valle SpA',
  companyRut: '76.890.123-K',
  companyAddress: 'Av. Libertador Bernardo O\'Higgins 450, Of. 602, Curicó',
  companyPhone: '+56 75 233 4400',
  companyRepresentative: 'Juan Ignacio Valenzuela Prieto',
  companyRepresentativeRut: '12.345.678-9',
  signatureCity: 'Curicó',
  contractTemplate: DEFAULT_CONTRACT_TEMPLATE,
  companyLogoUrl: '',
  // Disabled by default for direct physical production/attendance log for accounting
  enableMonetaryValuation: false,
  localDocumentsPath: 'documents',
  githubRepoUrl: 'https://github.com/MatiasBalbontin/agrocontrol-pro',
};
