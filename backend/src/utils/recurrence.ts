import { RecurrenceInterval } from '../types';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const dayOfMonth = d.getDate();
  d.setMonth(d.getMonth() + months);
  // Handle month-end edge cases (e.g., Jan 31 + 1 month = Feb 28)
  if (d.getDate() !== dayOfMonth) {
    d.setDate(0); // last day of previous month
  }
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getOccurrences(
  rangeStart: string,
  rangeEnd: string,
  recurrence: RecurrenceInterval,
  recurrenceStart: string,
  recurrenceEnd: string | null
): string[] {
  const start = parseDate(rangeStart);
  const end = parseDate(rangeEnd);
  const recStart = parseDate(recurrenceStart);
  const recEnd = recurrenceEnd ? parseDate(recurrenceEnd) : null;
  const dates: string[] = [];

  let cursor = new Date(recStart);

  while (cursor <= end) {
    if (cursor >= start && (!recEnd || cursor <= recEnd)) {
      dates.push(toDateStr(cursor));
    }

    // If cursor is past recEnd, we can stop
    if (recEnd && cursor > recEnd) break;

    switch (recurrence) {
      case 'weekly':
        cursor = addDays(cursor, 7);
        break;
      case 'biweekly':
        cursor = addDays(cursor, 14);
        break;
      case 'monthly':
        cursor = addMonths(cursor, 1);
        break;
      case 'yearly':
        cursor = addYears(cursor, 1);
        break;
    }
  }

  return dates;
}

export function getNextOccurrence(
  recurrence: RecurrenceInterval,
  recurrenceStart: string,
  recurrenceEnd: string | null,
  afterDate: string
): string | null {
  const after = parseDate(afterDate);
  const recStart = parseDate(recurrenceStart);
  const recEnd = recurrenceEnd ? parseDate(recurrenceEnd) : null;

  let cursor = new Date(recStart);

  // Fast-forward to near afterDate
  while (cursor <= after) {
    switch (recurrence) {
      case 'weekly': cursor = addDays(cursor, 7); break;
      case 'biweekly': cursor = addDays(cursor, 14); break;
      case 'monthly': cursor = addMonths(cursor, 1); break;
      case 'yearly': cursor = addYears(cursor, 1); break;
    }
  }

  if (recEnd && cursor > recEnd) return null;
  return toDateStr(cursor);
}
