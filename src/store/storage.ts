import { todayIn } from '../core/dates';
import { appDataSchema, freshData, MAX_IMPORT_BYTES, SCHEMA_VERSION, STORAGE_KEY, type AppData } from './schema';

/**
 * Browser-local persistence. Everything is saved on this device only.
 * The interface (load/save) is kept small so a cloud sync adapter can be
 * added later without touching the UI.
 */

export type LoadStatus = 'ok' | 'fresh' | 'recovered-corrupt' | 'unavailable';

/** Ordered migrations: index i upgrades version i to i+1. */
const MIGRATIONS: Array<(d: any) => any> = [
  // v0 (pre-release prototypes, no schemaVersion) -> v1: not supported; start fresh.
  () => null,
];

export function migrate(raw: any): AppData | null {
  if (!raw || typeof raw !== 'object') return null;
  let v: number = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  let data = raw;
  if (v > SCHEMA_VERSION) return null; // from a newer app version; do not guess
  while (v < SCHEMA_VERSION) {
    data = MIGRATIONS[v]?.(data);
    if (!data) return null;
    v++;
  }
  const parsed = appDataSchema.safeParse(data);
  return parsed.success ? (parsed.data as AppData) : null;
}

function storageAvailable(): Storage | null {
  try {
    const s = window.localStorage;
    const k = '__vamos_probe__';
    s.setItem(k, '1');
    s.removeItem(k);
    return s;
  } catch {
    return null;
  }
}

export function loadData(): { data: AppData; status: LoadStatus } {
  const today = todayIn();
  const s = storageAvailable();
  if (!s) return { data: freshData(today), status: 'unavailable' };
  let raw: string | null = null;
  try { raw = s.getItem(STORAGE_KEY); } catch { return { data: freshData(today), status: 'unavailable' }; }
  if (!raw) return { data: freshData(today), status: 'fresh' };
  try {
    const migrated = migrate(JSON.parse(raw));
    if (migrated) return { data: migrated, status: 'ok' };
  } catch { /* fall through */ }
  // Keep the unreadable copy so nothing is silently destroyed.
  try { s.setItem(`${STORAGE_KEY}:unreadable:${Date.now()}`, raw.slice(0, MAX_IMPORT_BYTES)); } catch { /* ignore */ }
  return { data: freshData(today), status: 'recovered-corrupt' };
}

export function saveData(data: AppData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Backups
// ---------------------------------------------------------------------------

export interface BackupFile {
  app: 'vamos';
  exportedAt: string;
  data: AppData;
}

export function makeBackup(data: AppData): string {
  const file: BackupFile = { app: 'vamos', exportedAt: new Date().toISOString(), data };
  return JSON.stringify(file, null, 2);
}

export type ImportError = 'too-large' | 'not-json' | 'not-vamos' | 'invalid' | 'newer-version';

export function parseBackup(text: string): { ok: true; data: AppData } | { ok: false; error: ImportError } {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'too-large' };
  let obj: any;
  try { obj = JSON.parse(text); } catch { return { ok: false, error: 'not-json' }; }
  if (!obj || obj.app !== 'vamos' || typeof obj.data !== 'object') return { ok: false, error: 'not-vamos' };
  if (typeof obj.data.schemaVersion === 'number' && obj.data.schemaVersion > SCHEMA_VERSION) return { ok: false, error: 'newer-version' };
  const data = migrate(obj.data);
  if (!data) return { ok: false, error: 'invalid' };
  return { ok: true, data };
}
