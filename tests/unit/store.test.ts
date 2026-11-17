// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import * as st from '../../src/store/store';
import { makeBackup, parseBackup } from '../../src/store/storage';
import { STORAGE_KEY } from '../../src/store/schema';
import { questionById } from '../../src/content';
import type { ChoiceQuestion } from '../../src/content/types';

const reload = () => st.initStore();

beforeEach(() => { localStorage.clear(); st.initStore(); });

describe('profiles and persistence', () => {
  it('starts with two neutral learners and no seeded progress', () => {
    const s = st.getState();
    expect(s.profileOrder.map((id) => s.profiles[id].name)).toEqual(['Learner 1', 'Learner 2']);
    for (const id of s.profileOrder) {
      const p = s.profiles[id];
      expect(Object.keys(p.completedLessons)).toHaveLength(0);
      expect(p.exams).toHaveLength(0);
      expect(p.activeDays).toHaveLength(0);
      expect(Object.keys(p.xp)).toHaveLength(0);
    }
  });

  it('keeps learners independent, including language and unfinished sessions', () => {
    st.recordAnswer('sg-shape-octagon', 'correct', 'lesson');
    st.setLang('es');
    st.startLessonSession('l-sign-shapes', ['sg-shape-octagon']);
    st.switchProfile('p2');
    const p2 = st.getState().profiles.p2;
    expect(p2.review['sg-shape-octagon']).toBeUndefined();
    expect(p2.lang).toBe('en');
    expect(p2.lessonSession).toBeNull();
    st.switchProfile('p1');
    expect(st.getState().profiles.p1.lessonSession?.lessonId).toBe('l-sign-shapes');
  });

  it('restores progress and the active learner after reload', () => {
    st.renameProfile('p2', 'Ana');
    st.switchProfile('p2');
    st.completeLesson('l-start-test', 4, 4);
    reload();
    const s = st.getState();
    expect(s.activeProfileId).toBe('p2');
    expect(s.profiles.p2.name).toBe('Ana');
    expect(s.profiles.p2.completedLessons['l-start-test']).toBeTruthy();
  });

  it('resumes an interrupted lesson at the same question', () => {
    st.startLessonSession('l-markings', ['mk-broken-yellow', 'mk-white-lines']);
    st.patchLessonSession({ step: 3, qIndex: 1 });
    reload();
    const s = st.getState().profiles.p1.lessonSession!;
    expect(s.step).toBe(3);
    expect(s.qIndex).toBe(1);
  });

  it('recovers from corrupt storage without crashing and keeps a copy', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    reload();
    expect(st.getLoadStatus()).toBe('recovered-corrupt');
    expect(st.getState().profileOrder).toHaveLength(2);
    expect(Object.keys(localStorage).some((k) => k.startsWith(`${STORAGE_KEY}:unreadable:`))).toBe(true);
  });

  it('rejects structurally invalid stored data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, activeProfileId: 'x', profileOrder: ['x'], profiles: {} }));
    reload();
    expect(st.getLoadStatus()).toBe('recovered-corrupt');
  });
});

describe('backup export and import', () => {
  it('round-trips', () => {
    st.renameProfile('p1', 'Mari');
    st.recordAnswer('sl-yellow', 'wrong', 'lesson');
    const text = makeBackup(st.getState());
    st.resetData('everything', 'p1');
    const r = parseBackup(text);
    expect(r.ok).toBe(true);
    if (r.ok) st.replaceAll(r.data);
    expect(st.getState().profiles.p1.name).toBe('Mari');
    expect(st.getState().profiles.p1.review['sl-yellow'].lastResult).toBe('wrong');
  });
  it('rejects non-Vamos, invalid, oversized and newer files', () => {
    expect(parseBackup('hello')).toEqual({ ok: false, error: 'not-json' });
    expect(parseBackup('{"a":1}')).toEqual({ ok: false, error: 'not-vamos' });
    expect(parseBackup(JSON.stringify({ app: 'vamos', data: { schemaVersion: 1, profiles: 5 } }))).toEqual({ ok: false, error: 'invalid' });
    expect(parseBackup(JSON.stringify({ app: 'vamos', data: { schemaVersion: 99 } }))).toEqual({ ok: false, error: 'newer-version' });
    expect(parseBackup('x'.repeat(2_000_001))).toEqual({ ok: false, error: 'too-large' });
  });
  it('keeps imported notes as plain text (no HTML interpretation path)', () => {
    st.savePracticeLog({ date: '2026-11-17', minutes: 30, supervisor: 'Instructor', area: 'lot', skills: [], conditions: [], confidenceBefore: null, confidenceAfter: null, wentWell: '<img src=x onerror=alert(1)>', tryAgain: '', nextGoal: '' });
    const r = parseBackup(makeBackup(st.getState()));
    expect(r.ok && r.data.profiles.p1.practiceLogs[0].wentWell).toBe('<img src=x onerror=alert(1)>');
  });
});

describe('scoped reset', () => {
  it('affects only the intended data and learner', () => {
    st.completeLesson('l-start-test', 4, 4);
    st.savePracticeLog({ date: '2026-11-17', minutes: 20, supervisor: '', area: '', skills: [], conditions: [], confidenceBefore: null, confidenceAfter: null, wentWell: '', tryAgain: '', nextGoal: '' });
    st.switchProfile('p2');
    st.completeLesson('l-start-test', 4, 4);
    st.switchProfile('p1');
    st.resetData('learning', 'p1');
    const s = st.getState();
    expect(Object.keys(s.profiles.p1.completedLessons)).toHaveLength(0);
    expect(s.profiles.p1.practiceLogs).toHaveLength(1);
    expect(Object.keys(s.profiles.p2.completedLessons)).toHaveLength(1);
  });
});

describe('scoring integrity', () => {
  it('lesson XP cannot be farmed by completing again', () => {
    expect(st.completeLesson('l-start-test', 4, 4)).toBe(20);
    expect(st.completeLesson('l-start-test', 4, 4)).toBe(0);
    expect(st.getState().profiles.p1.xp['lesson:l-start-test']).toBe(20);
  });
  it('review XP is once per question per day', () => {
    expect(st.recordAnswer('sl-yellow', 'correct', 'review')).toBe(2);
    expect(st.recordAnswer('sl-yellow', 'correct', 'review')).toBe(0);
  });
  it('wrong answers enter review', () => {
    st.recordAnswer('sl-yellow', 'wrong', 'lesson');
    expect(st.getState().profiles.p1.review['sl-yellow'].box).toBe(1);
  });
});

describe('exam lifecycle', () => {
  it('saves results, does not double-submit, and restarting does not overwrite history', () => {
    const a = st.startExam(null);
    expect(st.startExam(null).id).toBe(a.id); // resume, not replace
    for (const id of a.questionIds.slice(0, 30)) st.answerExam(id, (questionById.get(id) as ChoiceQuestion).correct);
    const done = st.submitExam()!;
    expect(done.result!.correct).toBe(30);
    expect(done.result!.unanswered).toBe(5);
    expect(done.result!.passed).toBe(true);
    expect(st.submitExam()).toBeNull();
    const b = st.startExam(null);
    expect(b.id).not.toBe(a.id);
    st.discardActiveExam();
    expect(st.getState().profiles.p1.exams).toHaveLength(1);
    st.answerExam(a.questionIds[0], 'zz'); // no active exam: ignored
    expect(st.getState().profiles.p1.exams[0].answers[a.questionIds[0]]).not.toBe('zz');
  });
});

describe('settings added after release', () => {
  it('loads data saved before the theme setting existed, defaulting to "system"', () => {
    st.completeLesson('l-start-test', 4, 4);
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    for (const id of Object.keys(raw.profiles)) delete raw.profiles[id].settings.theme;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
    reload();
    expect(st.getLoadStatus()).toBe('ok');
    expect(st.getState().profiles.p1.settings.theme).toBe('system');
    expect(st.getState().profiles.p1.completedLessons['l-start-test']).toBeTruthy();
  });
});
