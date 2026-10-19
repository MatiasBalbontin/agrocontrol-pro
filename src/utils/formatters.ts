import { PaymentMode } from '../types';

/**
 * Formats a number as Chilean Pesos ($ 12.500)
 */
export function formatCLP(amount: number): string {
  if (isNaN(amount)) return '$ 0';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats quantities with sensible decimals (e.g., 14.5 o 120)
 */
export function formatQuantity(qty: number, mode?: PaymentMode): string {
  if (isNaN(qty)) return '0';
  const formatted = new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 2,
  }).format(qty);

  if (!mode) return formatted;
  return `${formatted} ${getUnitSymbol(mode)}`;
}

/**
 * Returns the short symbol for the payment/measurement mode
 */
export function getUnitSymbol(mode: PaymentMode): string {
  switch (mode) {
    case 'KILO':
      return 'kg';
    case 'HORA':
      return 'hrs';
    case 'DÍA':
      return 'días';
    case 'TAREA':
      return 'tareas';
    default:
      return 'unid';
  }
}

/**
 * Returns human readable full unit name
 */
export function getUnitName(mode: PaymentMode): string {
  switch (mode) {
    case 'KILO':
      return 'Kilos';
    case 'HORA':
      return 'Horas';
    case 'DÍA':
      return 'Días / Jornadas';
    case 'TAREA':
      return 'Tareas / Paños';
    default:
      return mode;
  }
}

/**
 * Cleans and formats a Chilean RUT into XX.XXX.XXX-X
 */
export function formatRUT(rut: string): string {
  if (!rut) return '';
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  let formatted = '';
  for (let i = body.length - 1, j = 1; i >= 0; i--, j++) {
    formatted = body.charAt(i) + formatted;
    if (j % 3 === 0 && i !== 0) {
      formatted = '.' + formatted;
    }
  }

  return `${formatted}-${dv}`;
}

/**
 * Validates Chilean RUT check digit
 */
export function validateRUT(rut: string): boolean {
  if (!rut) return false;
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8 || clean.length > 9) return false;

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let expectedDv = '';
  if (remainder === 11) expectedDv = '0';
  else if (remainder === 10) expectedDv = 'K';
  else expectedDv = remainder.toString();

  return dv === expectedDv;
}

/**
 * Formats ISO YYYY-MM-DD into human-friendly Chilean date
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Get today's date in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date N days ago in YYYY-MM-DD
 */
export function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Formats YYYY-MM-DD into "15 de octubre de 2026"
 */
export function formatFullChileanDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthName = MONTH_NAMES_ES[monthIdx] || parts[1];
    return `${day} de ${monthName} de ${year}`;
  }
  return dateStr;
}
