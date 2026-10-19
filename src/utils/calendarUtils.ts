import { getTodayDateString } from './formatters';

export interface CalendarDay {
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  month: number; // 0-11
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  dayOfWeek: number; // 0=Lunes ... 6=Domingo
}

export const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const DAYS_OF_WEEK_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAYS_OF_WEEK_FULL = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

/**
 * Computes a standard 35 or 42-day calendar grid starting on Monday.
 * Handles month transitions, leap years, and boundaries cleanly without NaN.
 */
export function getMonthCalendarDays(year: number, month: number): CalendarDay[] {
  // First day of current month (at noon to avoid timezone daylight saving shifts)
  const firstDay = new Date(year, month, 1, 12, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // (firstDay.getDay() + 6) % 7 maps:
  // Sunday (0) -> 6
  // Monday (1) -> 0
  // Tuesday (2) -> 1 ... Saturday (6) -> 5
  const startingDay = (firstDay.getDay() + 6) % 7;

  const todayStr = getTodayDateString();
  const days: CalendarDay[] = [];

  // Preceding days from previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    const dNum = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, dNum, 12, 0, 0);
    const pYear = prevDate.getFullYear();
    const pMonth = prevDate.getMonth();
    const dateStr = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    const dayOfWeek = (prevDate.getDay() + 6) % 7;

    days.push({
      dateStr,
      dayNum: dNum,
      month: pMonth,
      year: pYear,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
      dayOfWeek,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d, 12, 0, 0);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = (curDate.getDay() + 6) % 7;

    days.push({
      dateStr,
      dayNum: d,
      month,
      year,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
      dayOfWeek,
    });
  }

  // Trailing days from next month to complete the row or grid
  const totalCells = days.length <= 35 ? 35 : 42;
  const remaining = totalCells - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d, 12, 0, 0);
    const nYear = nextDate.getFullYear();
    const nMonth = nextDate.getMonth();
    const dateStr = `${nYear}-${String(nMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = (nextDate.getDay() + 6) % 7;

    days.push({
      dateStr,
      dayNum: d,
      month: nMonth,
      year: nYear,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6,
      dayOfWeek,
    });
  }

  return days;
}

/**
 * Get date of previous day (YYYY-MM-DD)
 */
export function getPreviousDay(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get date of next day (YYYY-MM-DD)
 */
export function getNextDay(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
