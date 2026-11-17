import { describe, expect, it } from 'vitest';
import { lessons, questions, units, questionById, lessonById } from '../../src/content';
import { scenarios, places } from '../../src/content/scenarios';
import { glossary } from '../../src/content/sources';
import type { T } from '../../src/content/types';

const EMOJI = /\p{Extended_Pictographic}/u;
const EM_DASH = /—/;

function allText(obj: unknown, out: string[] = []): string[] {
  if (typeof obj === 'string') out.push(obj);
  else if (Array.isArray(obj)) obj.forEach((o) => allText(o, out));
  else if (obj && typeof obj === 'object') Object.values(obj).forEach((o) => allText(o, out));
  return out;
}
const bothLangs = (t: T | undefined) => !!t && t[0].trim().length > 0 && t[1].trim().length > 0 && t[0] !== t[1];

describe('curriculum content', () => {
  it('has at least 150 distinct questions with unique IDs', () => {
    expect(questions.length).toBeGreaterThanOrEqual(150);
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  });

  it('every question has English and Spanish prompt, explanation and notice', () => {
    for (const q of questions) {
      expect(bothLangs(q.prompt), q.id).toBe(true);
      expect(bothLangs(q.explanation), q.id).toBe(true);
      expect(bothLangs(q.notice), q.id).toBe(true);
    }
  });

  it('choice questions have a valid correct answer and bilingual choices', () => {
    for (const q of questions) {
      if (q.kind === 'order') {
        expect(q.steps.length, q.id).toBeGreaterThanOrEqual(3);
        q.steps.forEach((s) => expect(s.text[0] && s.text[1], q.id).toBeTruthy());
        continue;
      }
      expect(q.choices.some((c) => c.id === q.correct), q.id).toBe(true);
      expect(new Set(q.choices.map((c) => c.id)).size, q.id).toBe(q.choices.length);
      for (const c of q.choices) {
        expect(c.text[0].length > 0 && c.text[1].length > 0, `${q.id}/${c.id}`).toBe(true);
        if (q.kind !== 'tf' && c.id !== q.correct) expect(bothLangs(c.why), `${q.id}/${c.id} needs why`).toBe(true);
      }
    }
  });

  it('true/false items explain the wrong choice', () => {
    for (const q of questions) {
      if (q.kind !== 'tf') continue;
      const wrong = q.choices.find((c) => c.id !== q.correct)!;
      expect(bothLangs(wrong.why), q.id).toBe(true);
    }
  });

  it('answers that reference other options keep a fixed order', () => {
    for (const q of questions) {
      if (q.kind === 'order') continue;
      const refers = q.choices.some((c) => /\b(both of|both a\b|both drivers|both cases|neither|of the above)|ambos (conductores|casos)|ninguno|anteriores/i.test(c.text[0] + c.text[1]));
      if (refers) expect(q.fixedOrder, q.id).toBe(true);
    }
  });

  it('every question cites a printed handbook page', () => {
    for (const q of questions) {
      expect(q.source.pages.length, q.id).toBeGreaterThan(0);
      q.source.pages.forEach((p) => expect(p >= 1 && p <= 106, q.id).toBe(true));
    }
  });

  it('every lesson references existing questions, and every question is taught in a lesson', () => {
    const taught = new Set<string>();
    for (const l of lessons) {
      expect(l.questionIds.length, l.id).toBeGreaterThan(0);
      for (const id of l.questionIds) {
        expect(questionById.has(id), `${l.id} -> ${id}`).toBe(true);
        expect(taught.has(id), `${id} taught twice`).toBe(false);
        taught.add(id);
        expect(questionById.get(id)!.topic, `${id} topic`).toBe(l.topic);
      }
    }
    for (const q of questions) expect(taught.has(q.id), `${q.id} not in any lesson`).toBe(true);
  });

  it('every lesson has all eight parts in both languages', () => {
    for (const l of lessons) {
      expect(bothLangs(l.title) && bothLangs(l.situation) && bothLangs(l.task), l.id).toBe(true);
      expect(l.explain.length).toBeGreaterThan(0);
      l.explain.forEach((e) => expect(bothLangs(e), l.id).toBe(true));
      expect(bothLangs(l.example.setup) && bothLangs(l.example.reasoning), l.id).toBe(true);
      expect(l.recap.length).toBeGreaterThanOrEqual(2);
      expect(l.sources.length).toBeGreaterThan(0);
    }
  });

  it('units reference every lesson exactly once', () => {
    const ids = units.flatMap((u) => u.lessons);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(lessons.map((l) => l.id).sort());
  });

  it('scenarios link to real places, lessons and questions and carry no invented street detail fields', () => {
    for (const s of scenarios) {
      expect(places.some((p) => p.id === s.placeId), s.id).toBe(true);
      expect(lessonById.has(s.lessonId), s.id).toBe(true);
      expect(questionById.has(s.questionId), s.id).toBe(true);
    }
    for (const p of places) {
      expect(p.lat).toBeGreaterThan(41.6); expect(p.lat).toBeLessThan(42.1);
      expect(p.lng).toBeGreaterThan(-87.95); expect(p.lng).toBeLessThan(-87.5);
      expect(p.verified.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('contains no emojis or em dashes in any learner-facing text', () => {
    const texts = allText([questions, lessons, units, scenarios, glossary]);
    for (const t of texts) {
      expect(EMOJI.test(t), t).toBe(false);
      expect(EM_DASH.test(t), t).toBe(false);
    }
  });

  it('keeps U.S. sign lettering in English inside Spanish text where signs are named', () => {
    const stopQ = questionById.get('sg-shape-octagon')!;
    expect(stopQ.explanation[1]).toContain('STOP');
  });
});
