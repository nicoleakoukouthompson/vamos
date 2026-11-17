/**
 * Calendar-date helpers. All study scheduling uses calendar dates (YYYY-MM-DD)
 * in the learner's time zone, never timestamps, so daylight-saving changes and
 * late-night sessions cannot create duplicate or skipped study days.
 */

export type ISODate = string; // YYYY-MM-DD

export const DEFAULT_TZ = 'America/Chicago';

export function todayIn(tz: string = DEFAULT_TZ, now: Date = new Date()): ISODate {
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: DEFAULT_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  }
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function isISODate(s: unknown): s is ISODate {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function toUTC(d: ISODate): number {
  return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
}

function fromUTC(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(d: ISODate, n: number): ISODate {
  return fromUTC(toUTC(d) + n * 86400000);
}

export function addMonths(d: ISODate, n: number): ISODate {
  const y = +d.slice(0, 4);
  const m = +d.slice(5, 7) - 1 + n;
  const day = +d.slice(8, 10);
  const target = new Date(Date.UTC(y, m, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / 86400000);
}

/** 0 = Sunday ... 6 = Saturday */
export function weekday(d: ISODate): number {
  return new Date(toUTC(d)).getUTCDay();
}

export function startOfWeek(d: ISODate): ISODate {
  return addDays(d, -weekday(d));
}

export function formatDate(d: ISODate, lang: 'en' | 'es', opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'en-US', { ...opts, timeZone: 'UTC' }).format(new Date(toUTC(d)));
}
