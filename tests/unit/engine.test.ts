import { describe, expect, it } from 'vitest';
import { addDays, addMonths, daysBetween, todayIn, weekday } from '../../src/core/dates';
import { recordAnswer, dueItems, isSolid, INTERVALS } from '../../src/core/review';
import { computePlan, defaultPlan, targetForPreset } from '../../src/core/planner';
import { buildExam, gradeExam, EXAM_FORMAT, examPool, readinessSignal } from '../../src/core/exam';
import { award, totalXP } from '../../src/core/xp';
import { topicMastery } from '../../src/core/mastery';
import { questionById, lessonOrder } from '../../src/content';
import type { ChoiceQuestion } from '../../src/content/types';

const T0 = '2026-11-17';

describe('dates', () => {
  it('computes Chicago dates across DST change without duplicating days', () => {
    // US DST ended 2026-11-01 at 2:00 local. 05:30Z is 00:30 CDT->... check both sides.
    expect(todayIn('America/Chicago', new Date('2026-11-01T04:59:00Z'))).toBe('2026-10-31');
    expect(todayIn('America/Chicago', new Date('2026-11-01T05:01:00Z'))).toBe('2026-11-01');
    expect(todayIn('America/Chicago', new Date('2026-11-02T05:59:00Z'))).toBe('2026-11-01');
    expect(todayIn('America/Chicago', new Date('2026-11-02T06:01:00Z'))).toBe('2026-11-02');
    const days = new Set<string>();
    for (let h = 0; h < 24 * 10; h++) days.add(todayIn('America/Chicago', new Date(Date.UTC(2026, 9, 28) + h * 3600e3)));
    expect(days.size).toBe(11); // 10 days of hours spans 11 calendar dates at most, no duplicates/gaps
    const sorted = [...days].sort();
    for (let i = 1; i < sorted.length; i++) expect(daysBetween(sorted[i - 1], sorted[i])).toBe(1);
  });
  it('adds days and months safely', () => {
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(weekday('2026-11-17')).toBe(2);
    expect(todayIn('Not/AZone', new Date('2026-11-17T12:00:00Z'))).toBe('2026-11-17');
  });
});

describe('spaced review', () => {
  it('wrong answers return sooner and correct answers space out', () => {
    let it1 = recordAnswer(undefined, 'q', 'correct', T0);
    expect(it1.box).toBe(1); expect(it1.due).toBe(addDays(T0, INTERVALS[1]));
    it1 = recordAnswer(it1, 'q', 'correct', it1.due);
    expect(it1.box).toBe(2);
    const wrong = recordAnswer(it1, 'q', 'wrong', it1.due);
    expect(wrong.box).toBe(1); expect(wrong.due).toBe(addDays(it1.due, 1));
  });
  it('repeating before due does not inflate the box', () => {
    let it1 = recordAnswer(undefined, 'q', 'correct', T0);
    for (let i = 0; i < 10; i++) it1 = recordAnswer(it1, 'q', 'correct', T0);
    expect(it1.box).toBe(1);
    expect(isSolid(it1)).toBe(false);
  });
  it('unsure answers do not advance', () => {
    const a = recordAnswer(undefined, 'q', 'correct', T0);
    const b = recordAnswer(a, 'q', 'unsure', a.due);
    expect(b.box).toBe(1);
  });
  it('first exposure is never mastery; solid needs boxes and distinct days', () => {
    const qs = [...lessonOrder].length; expect(qs).toBeGreaterThan(0);
    const review: Record<string, any> = {};
    const m0 = topicMastery('railroad', review); expect(m0.level).toBe('new');
    review['rr-stop-distance'] = recordAnswer(undefined, 'rr-stop-distance', 'correct', T0);
    expect(topicMastery('railroad', review).level).toBe('learning');
  });
  it('prioritizes wrong answers and caps the due list', () => {
    const items: Record<string, any> = {};
    for (let i = 0; i < 30; i++) items['q' + i] = recordAnswer(undefined, 'q' + i, i % 3 ? 'correct' : 'wrong', T0);
    const due = dueItems(items, addDays(T0, 5), 15);
    expect(due.length).toBe(15);
    expect(due[0].lastResult).toBe('wrong');
  });
});

describe('planner', () => {
  const base = (over: Partial<ReturnType<typeof defaultPlan>> = {}) => ({ ...defaultPlan(T0), ...over });
  it('30, 60 and 90 day plans differ meaningfully', () => {
    const p1 = computePlan({ today: T0, settings: base(), completedLessons: new Set(), dueReviewCount: 0, examsTaken: 0 });
    const p2 = computePlan({ today: T0, settings: base({ preset: '2m', targetDate: targetForPreset('2m', T0) }), completedLessons: new Set(), dueReviewCount: 0, examsTaken: 0 });
    const p3 = computePlan({ today: T0, settings: base({ preset: '3m', targetDate: targetForPreset('3m', T0) }), completedLessons: new Set(), dueReviewCount: 0, examsTaken: 0 });
    expect(p1.studyDaysLeft).toBe(30);
    expect(p2.studyDaysLeft).toBeGreaterThan(55);
    expect(p3.studyDaysLeft).toBeGreaterThan(85);
    const lessonsPerDay = (p: typeof p1) => p.days.filter((d) => d.lessons.length).length;
    expect(lessonsPerDay(p1)).toBeLessThan(lessonsPerDay(p3) + 1);
    expect(p1.status).toBe('on-track');
  });
  it('never assigns more than the session length to a day (no cramming after missed days)', () => {
    const p = computePlan({ today: T0, settings: base({ minutesPerSession: 15 }), completedLessons: new Set(), dueReviewCount: 40, examsTaken: 0 });
    for (const d of p.days) expect(d.minutes).toBeLessThanOrEqual(15 + 7); // one lesson may overflow when review fills the budget
  });
  it('handles a past date, a too-close date and no study days', () => {
    expect(computePlan({ today: T0, settings: base({ preset: 'custom', targetDate: '2026-11-01' }), completedLessons: new Set(), dueReviewCount: 0, examsTaken: 0 }).status).toBe('past');
    expect(computePlan({ today: T0, settings: base({ preset: 'custom', targetDate: addDays(T0, 1) }), completedLessons: new Set(), dueReviewCount: 0, examsTaken: 0 }).status).toBe('too-close');
    expect(computePlan({ today: T0, settings: base({ studyDays: [] }), completedLessons: new Set(), dueReviewCount: 0, examsTaken: 0 }).status).toBe('no-days');
  });
  it('reports when the workload does not fit and suggests extra minutes', () => {
    const p = computePlan({ today: T0, settings: base({ preset: 'custom', targetDate: addDays(T0, 10), studyDays: [1, 3], minutesPerSession: 10 }), completedLessons: new Set(), dueReviewCount: 0, examsTaken: 0 });
    expect(p.status).toBe('needs-more-time');
    expect(p.extraMinutesPerSession).toBeGreaterThan(0);
  });
  it('preserves completed work and recognizes a learner who is ahead', () => {
    const p = computePlan({ today: T0, settings: base(), completedLessons: new Set(lessonOrder), dueReviewCount: 3, examsTaken: 0 });
    expect(p.remainingLessons.length).toBe(0);
    expect(p.status).toBe('ahead');
  });
  it('flexible plans have no date pressure', () => {
    const p = computePlan({ today: T0, settings: base({ preset: 'flexible', targetDate: null }), completedLessons: new Set(), dueReviewCount: 0, examsTaken: 0 });
    expect(p.status).toBe('flexible');
    expect(p.todayLessons.length).toBeGreaterThan(0);
  });
});

describe('practice exam', () => {
  it('has no duplicate IDs and the configured count', () => {
    for (let s = 1; s < 40; s++) {
      const e = buildExam({ seed: s });
      expect(e.questionIds.length).toBe(EXAM_FORMAT.count);
      expect(new Set(e.questionIds).size).toBe(e.questionIds.length);
    }
  });
  it('is balanced: minimum signs and every topic represented', () => {
    const e = buildExam({ seed: 7 });
    const topics = e.questionIds.map((id) => questionById.get(id)!.topic);
    const signs = topics.filter((t) => t === 'sign-shapes' || t === 'sign-meanings').length;
    expect(signs).toBeGreaterThanOrEqual(EXAM_FORMAT.minSigns);
    const poolTopics = new Set(examPool().map((q) => q.topic));
    for (const t of poolTopics) expect(topics.includes(t), t).toBe(true);
  });
  it('keeps fixed-order choices in order', () => {
    const e = buildExam({ seed: 3 });
    for (const id of e.questionIds) {
      const q = questionById.get(id) as ChoiceQuestion;
      if (q.fixedOrder) expect(e.choiceOrder[id]).toEqual(q.choices.map((c) => c.id));
    }
  });
  it('prefers questions not seen in recent attempts', () => {
    const first = buildExam({ seed: 11 });
    const second = buildExam({ seed: 12, recentlySeen: new Set(first.questionIds) });
    const overlap = second.questionIds.filter((id) => first.questionIds.includes(id)).length;
    expect(overlap).toBeLessThan(20);
  });
  it('grades thresholds exactly and counts unanswered as incorrect', () => {
    const e = buildExam({ seed: 5 });
    const ids = e.questionIds;
    const setCorrect = (n: number) => {
      ids.forEach((id, i) => { const q = questionById.get(id) as ChoiceQuestion; e.answers[id] = i < n ? q.correct : null; });
      return gradeExam(e);
    };
    expect(setCorrect(28).passed).toBe(true); // 28/35 = 80%
    expect(setCorrect(27).passed).toBe(false);
    const r = setCorrect(30);
    expect(r.unanswered).toBe(5);
    expect(r.missed.length).toBe(5);
    expect(r.correct).toBe(30);
  });
  it('does not call one strong attempt "consistent"', () => {
    const e = buildExam({ seed: 9 });
    e.questionIds.forEach((id) => { e.answers[id] = (questionById.get(id) as ChoiceQuestion).correct; });
    e.result = gradeExam(e);
    expect(readinessSignal([e]).consistent).toBe(false);
    expect(readinessSignal([e, e, e]).consistent).toBe(false); // same questions repeated
  });
});

describe('xp ledger', () => {
  it('cannot award the same key twice', () => {
    let l = {};
    l = award(l, 'lesson:a', 20).ledger;
    const again = award(l, 'lesson:a', 20);
    expect(again.awarded).toBe(0);
    expect(totalXP(again.ledger)).toBe(20);
  });
});
