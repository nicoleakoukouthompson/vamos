import { describe, expect, it } from 'vitest';
import { S } from '../../src/i18n/strings';
import { interpretSpoken } from '../../src/voice/speech';
import { buildIcs } from '../../src/core/ics';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('interface strings', () => {
  it('every key has non-empty English and Spanish text with matching placeholders', () => {
    for (const [k, v] of Object.entries(S)) {
      expect(v[0].length > 0 && v[1].length > 0, k).toBe(true);
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      expect(ph(v[1]), k).toBe(ph(v[0]));
      expect(/—/.test(v[0] + v[1]), k).toBe(false);
      expect(/\p{Extended_Pictographic}/u.test(v[0] + v[1]), k).toBe(false);
    }
  });
  it('every t("key") used in source exists', () => {
    const files: string[] = [];
    const walk = (d: string) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && files.push(p); });
    walk('src');
    const missing: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)) if (!(m[1] in S)) missing.push(`${f}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });
});

describe('spoken answer interpretation', () => {
  it('maps letters, numbers and true/false in both languages', () => {
    expect(interpretSpoken(['B'], 3, false)).toEqual({ position: 2 });
    expect(interpretSpoken(['option three'], 3, false)).toEqual({ position: 3 });
    expect(interpretSpoken(['la segunda'], 3, false)).toEqual({ position: 2 });
    expect(interpretSpoken(['opción uno'], 3, false)).toEqual({ position: 1 });
    expect(interpretSpoken(['verdadero'], 2, true)).toEqual({ tf: 'true' });
    expect(interpretSpoken(['false'], 2, true)).toEqual({ tf: 'false' });
    expect(interpretSpoken(['purple monkey dishwasher'], 3, false)).toBeNull();
    expect(interpretSpoken(['five'], 3, false)).toBeNull();
  });
});

describe('calendar reminders', () => {
  it('builds a weekly recurring event on selected days in the learner time zone', () => {
    const ics = buildIcs({ today: '2026-11-17', studyDays: [1, 3, 5], time: '19:30', minutes: 20, until: '2026-12-17', tz: 'America/Chicago', title: 'Vamos', description: 'x', uidSeed: 'p1' });
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261217T235959Z');
    expect(ics).toContain('DTSTART;TZID=America/Chicago:20261117T193000');
    expect(ics).toContain('DTEND;TZID=America/Chicago:20261117T195000');
    expect(ics).toContain('BEGIN:VALARM');
  });
});
