import { useSyncExternalStore } from 'react';
import { todayIn, type ISODate } from '../core/dates';
import { buildExam, gradeExam, type ExamAttempt } from '../core/exam';
import { targetForPreset, type StudyPlanSettings } from '../core/planner';
import { recordAnswer as recordReview, type Result } from '../core/review';
import { award, examKey, lessonKey, reviewKey, XP } from '../core/xp';
import type { Lang } from '../content/types';
import {
  freshData, MAX_HISTORY, newProfile,
  type AppData, type ConfidenceCheck, type LessonSession, type PracticeLog, type Profile, type ProfileSettings, type Provider, type ReviewSession,
} from './schema';
import { loadData, saveData, type LoadStatus } from './storage';

type Listener = () => void;

let state: AppData;
let loadStatus: LoadStatus = 'ok';
let saveFailed = false;
const listeners = new Set<Listener>();

export function initStore(initial?: { data: AppData; status: LoadStatus }) {
  const loaded = initial ?? loadData();
  state = loaded.data;
  loadStatus = loaded.status;
  if (loaded.status === 'fresh' || loaded.status === 'recovered-corrupt') persist();
}

function persist() {
  if (loadStatus === 'unavailable') return;
  saveFailed = !saveData(state);
}

function emit() {
  for (const l of listeners) l();
}

function set(next: AppData) {
  state = next;
  persist();
  emit();
}

export const getState = () => state;
export const getLoadStatus = () => loadStatus;
export const getSaveFailed = () => saveFailed;

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppData {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useProfile(): Profile {
  const s = useAppState();
  return s.profiles[s.activeProfileId];
}

export const todayFor = (p: Profile): ISODate => todayIn(p.timezone);

/** Update the active profile immutably. */
function updateProfile(fn: (p: Profile) => void, profileId?: string) {
  const id = profileId ?? state.activeProfileId;
  const p = structuredClone(state.profiles[id]);
  fn(p);
  set({ ...state, profiles: { ...state.profiles, [id]: p } });
}

function markActive(p: Profile) {
  const today = todayFor(p);
  if (!p.activeDays.includes(today)) {
    p.activeDays.push(today);
    if (p.activeDays.length > 2000) p.activeDays.shift();
  }
  p.lastActive = today;
}

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// ---------------------------------------------------------------------------
// Profiles and preferences
// ---------------------------------------------------------------------------

export function switchProfile(id: string) {
  if (!(id in state.profiles) || id === state.activeProfileId) return;
  set({ ...state, activeProfileId: id });
}

export function renameProfile(id: string, name: string) {
  const clean = name.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40);
  if (!clean) return;
  updateProfile((p) => { p.name = clean; }, id);
}

export function setLang(lang: Lang) {
  updateProfile((p) => { p.lang = lang; });
}

export function setTimezone(tz: string) {
  updateProfile((p) => { p.timezone = tz; });
}

export function updateSettings(patch: Partial<ProfileSettings>) {
  updateProfile((p) => { p.settings = { ...p.settings, ...patch }; });
}

export function setPlan(patch: Partial<StudyPlanSettings>) {
  updateProfile((p) => {
    const next = { ...p.plan, ...patch };
    if (patch.preset && patch.preset !== 'custom' && patch.targetDate === undefined) {
      next.targetDate = targetForPreset(patch.preset, todayFor(p));
    }
    if (next.preset === 'flexible') next.targetDate = null;
    next.studyDays = [...new Set(next.studyDays)].sort();
    p.plan = next;
  });
}

// ---------------------------------------------------------------------------
// Answers, review and XP
// ---------------------------------------------------------------------------

/** Records one graded answer. Returns XP awarded (0 if already awarded). */
export function recordAnswer(qid: string, result: Result, context: 'lesson' | 'review' | 'scenario'): number {
  let gained = 0;
  updateProfile((p) => {
    const today = todayFor(p);
    p.review[qid] = recordReview(p.review[qid], qid, result, today);
    p.history.push({ qid, date: today, result, context });
    if (p.history.length > MAX_HISTORY) p.history.splice(0, p.history.length - MAX_HISTORY);
    if (context === 'review' && result === 'correct') {
      const r = award(p.xp, reviewKey(qid, today), XP.review);
      p.xp = r.ledger;
      gained = r.awarded;
    }
    markActive(p);
  });
  return gained;
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export function startLessonSession(lessonId: string, questionIds: string[]) {
  updateProfile((p) => {
    if (p.lessonSession?.lessonId === lessonId) return;
    p.lessonSession = {
      lessonId, step: 0, queue: [...questionIds], qIndex: 0, answers: {}, requeued: [],
      confidenceBefore: null, startedAt: new Date().toISOString(),
    };
  });
}

export function patchLessonSession(patch: Partial<LessonSession>) {
  updateProfile((p) => { if (p.lessonSession) p.lessonSession = { ...p.lessonSession, ...patch }; });
}

export function clearLessonSession() {
  updateProfile((p) => { p.lessonSession = null; });
}

/** Marks the lesson complete. XP is awarded only on the first completion. */
export function completeLesson(lessonId: string, correct: number, total: number): number {
  let gained = 0;
  updateProfile((p) => {
    const today = todayFor(p);
    if (!p.completedLessons[lessonId]) p.completedLessons[lessonId] = { date: today, correct, total };
    const r = award(p.xp, lessonKey(lessonId), XP.lesson);
    p.xp = r.ledger;
    gained = r.awarded;
    if (p.lessonSession?.lessonId === lessonId) p.lessonSession = null;
    markActive(p);
  });
  return gained;
}

// ---------------------------------------------------------------------------
// Review sessions
// ---------------------------------------------------------------------------

export function startReviewSession(queue: string[]) {
  updateProfile((p) => {
    p.reviewSession = { queue, qIndex: 0, done: [], startedAt: todayFor(p) };
  });
}

export function patchReviewSession(patch: Partial<ReviewSession>) {
  updateProfile((p) => { if (p.reviewSession) p.reviewSession = { ...p.reviewSession, ...patch }; });
}

export function clearReviewSession() {
  updateProfile((p) => { p.reviewSession = null; });
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

export function startExam(timerMinutes: number | null): ExamAttempt {
  let attempt!: ExamAttempt;
  updateProfile((p) => {
    if (p.activeExam) { attempt = p.activeExam; return; }
    const recent = new Set(p.exams.slice(-2).flatMap((e) => e.questionIds));
    attempt = buildExam({ seed: Date.now() ^ Math.floor(Math.random() * 1e9), recentlySeen: recent, timerMinutes });
    p.activeExam = attempt;
  });
  return attempt;
}

export function answerExam(qid: string, choice: string | null) {
  updateProfile((p) => {
    if (!p.activeExam || p.activeExam.submittedAt || !(qid in p.activeExam.answers)) return;
    p.activeExam.answers[qid] = choice;
  });
}

export function toggleExamFlag(qid: string) {
  updateProfile((p) => {
    const e = p.activeExam;
    if (!e || e.submittedAt) return;
    e.flagged = e.flagged.includes(qid) ? e.flagged.filter((x) => x !== qid) : [...e.flagged, qid];
  });
}

/** Grades and archives the active attempt. Safe to call twice. */
export function submitExam(): ExamAttempt | null {
  let done: ExamAttempt | null = null;
  updateProfile((p) => {
    const e = p.activeExam;
    if (!e) return;
    e.submittedAt = new Date().toISOString();
    e.result = gradeExam(e);
    if (!p.exams.some((x) => x.id === e.id)) p.exams.push(e);
    p.activeExam = null;
    p.xp = award(p.xp, examKey(e.id), XP.exam).ledger;
    markActive(p);
    done = e;
  });
  return done;
}

export function discardActiveExam() {
  updateProfile((p) => { p.activeExam = null; });
}

// ---------------------------------------------------------------------------
// Confidence, checklist, practice logs, providers
// ---------------------------------------------------------------------------

export function addConfidence(c: Omit<ConfidenceCheck, 'id' | 'date'>) {
  updateProfile((p) => { p.confidence.push({ ...c, id: uid('cf'), date: todayFor(p) }); });
}

export function toggleChecklist(itemId: string) {
  updateProfile((p) => {
    if (p.checklist[itemId]) delete p.checklist[itemId];
    else p.checklist[itemId] = todayFor(p);
  });
}

export function savePracticeLog(log: Omit<PracticeLog, 'id'> & { id?: string }) {
  updateProfile((p) => {
    if (log.id) {
      const i = p.practiceLogs.findIndex((l) => l.id === log.id);
      if (i >= 0) p.practiceLogs[i] = log as PracticeLog;
    } else {
      p.practiceLogs.push({ ...log, id: uid('log') });
    }
    p.practiceLogs.sort((a, b) => (a.date < b.date ? 1 : -1));
  });
}

export function deletePracticeLog(id: string) {
  updateProfile((p) => { p.practiceLogs = p.practiceLogs.filter((l) => l.id !== id); });
}

export function saveProvider(pr: Omit<Provider, 'id'> & { id?: string }) {
  updateProfile((p) => {
    if (pr.id) {
      const i = p.providers.findIndex((x) => x.id === pr.id);
      if (i >= 0) p.providers[i] = pr as Provider;
    } else {
      p.providers.push({ ...pr, id: uid('pv') });
    }
  });
}

export function deleteProvider(id: string) {
  updateProfile((p) => { p.providers = p.providers.filter((x) => x.id !== id); });
}

// ---------------------------------------------------------------------------
// Data management
// ---------------------------------------------------------------------------

export type ResetScope = 'learning' | 'exams' | 'road' | 'profile' | 'everything';

/** Resets only the named part. 'profile' resets one learner; 'everything' resets both. */
export function resetData(scope: ResetScope, profileId: string) {
  if (scope === 'everything') { set(freshData(todayIn())); return; }
  updateProfile((p) => {
    const today = todayFor(p);
    if (scope === 'learning') {
      p.completedLessons = {}; p.review = {}; p.history = []; p.lessonSession = null; p.reviewSession = null;
      p.xp = Object.fromEntries(Object.entries(p.xp).filter(([k]) => k.startsWith('exam:')));
    } else if (scope === 'exams') {
      p.exams = []; p.activeExam = null;
      p.xp = Object.fromEntries(Object.entries(p.xp).filter(([k]) => !k.startsWith('exam:')));
    } else if (scope === 'road') {
      p.checklist = {}; p.practiceLogs = []; p.providers = [];
    } else if (scope === 'profile') {
      const fresh = newProfile(p.id, p.name, today, p.lang);
      Object.assign(p, fresh);
    }
  }, profileId);
}

export function replaceAll(data: AppData) {
  set(data);
}
