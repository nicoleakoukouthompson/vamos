import { z } from 'zod';
import { DEFAULT_TZ, type ISODate } from '../core/dates';
import type { ExamAttempt } from '../core/exam';
import { defaultPlan, type StudyPlanSettings } from '../core/planner';
import type { ReviewItem } from '../core/review';
import type { Lang } from '../content/types';

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'vamos:data';
export const MAX_IMPORT_BYTES = 2_000_000;
const MAX_TEXT = 2000;
const MAX_SHORT = 120;

export interface AnswerEvent {
  qid: string;
  date: ISODate;
  result: 'correct' | 'unsure' | 'wrong';
  context: 'lesson' | 'review' | 'scenario';
}

export interface ConfidenceCheck {
  id: string;
  date: ISODate;
  when: 'before' | 'after' | 'checkin';
  /** 1 (not at all comfortable) to 5 (very comfortable). Self-reported. */
  level: number;
  note?: string;
}

export interface PracticeLog {
  id: string;
  date: ISODate;
  minutes: number;
  supervisor: string; // a label like "Instructor" or "Driving school", not a full name
  area: string; // general area, not an address
  skills: string[];
  conditions: string[];
  confidenceBefore: number | null;
  confidenceAfter: number | null;
  wentWell: string;
  tryAgain: string;
  nextGoal: string;
}

export interface Provider {
  id: string;
  name: string;
  contact: string;
  adultBeginners: Tri;
  spanish: Tri;
  anxiousLearners: Tri;
  dualControl: Tri;
  pickup: Tri;
  lessonLength: string;
  totalPrice: string;
  cancellation: string;
  availability: string;
  notes: string;
}
export type Tri = 'yes' | 'no' | 'unknown';

export interface LessonSession {
  lessonId: string;
  step: number;
  /** Question queue (IDs). Wrong answers are re-queued once. */
  queue: string[];
  qIndex: number;
  answers: Record<string, { choice: string | null; order?: string[]; result: 'correct' | 'unsure' | 'wrong' }>;
  requeued: string[];
  confidenceBefore: number | null;
  startedAt: string;
}

export interface ReviewSession {
  queue: string[];
  qIndex: number;
  done: string[];
  startedAt: ISODate;
}

export interface ProfileSettings {
  reducedMotion: 'system' | 'on' | 'off';
  /** Color theme. Added after release, so stored data without it defaults to 'system'. */
  theme: 'system' | 'light' | 'dark';
  voiceRate: number;
  showStreak: boolean;
  examTimer: boolean;
  examTimerMinutes: number;
  smallerSteps: boolean;
}

export interface Profile {
  id: string;
  name: string;
  lang: Lang;
  createdAt: string;
  timezone: string;
  plan: StudyPlanSettings;
  completedLessons: Record<string, { date: ISODate; correct: number; total: number }>;
  review: Record<string, ReviewItem>;
  history: AnswerEvent[];
  xp: Record<string, number>;
  exams: ExamAttempt[];
  activeExam: ExamAttempt | null;
  confidence: ConfidenceCheck[];
  checklist: Record<string, ISODate>;
  practiceLogs: PracticeLog[];
  providers: Provider[];
  lessonSession: LessonSession | null;
  reviewSession: ReviewSession | null;
  settings: ProfileSettings;
  activeDays: ISODate[];
  lastActive: ISODate | null;
}

export interface AppData {
  schemaVersion: number;
  activeProfileId: string;
  profileOrder: string[];
  profiles: Record<string, Profile>;
}

export const MAX_HISTORY = 3000;

export function newProfile(id: string, name: string, today: ISODate, lang: Lang = 'en'): Profile {
  return {
    id, name, lang,
    createdAt: new Date().toISOString(),
    timezone: DEFAULT_TZ,
    plan: defaultPlan(today),
    completedLessons: {}, review: {}, history: [], xp: {},
    exams: [], activeExam: null, confidence: [], checklist: {},
    practiceLogs: [], providers: [],
    lessonSession: null, reviewSession: null,
    settings: { reducedMotion: 'system', theme: 'system', voiceRate: 1, showStreak: false, examTimer: false, examTimerMinutes: 45, smallerSteps: false },
    activeDays: [], lastActive: null,
  };
}

export function freshData(today: ISODate): AppData {
  const a = newProfile('p1', 'Learner 1', today);
  const b = newProfile('p2', 'Learner 2', today);
  return { schemaVersion: SCHEMA_VERSION, activeProfileId: 'p1', profileOrder: ['p1', 'p2'], profiles: { p1: a, p2: b } };
}

// ---------------------------------------------------------------------------
// Validation (used for stored data and imported backups)
// ---------------------------------------------------------------------------

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const shortStr = z.string().max(MAX_SHORT);
const text = z.string().max(MAX_TEXT);
const id = z.string().min(1).max(80).regex(/^[A-Za-z0-9_.:-]+$/);
const tri = z.enum(['yes', 'no', 'unknown']);
const conf = z.number().int().min(1).max(5);

const reviewItem = z.object({
  qid: id, box: z.number().int().min(0).max(6), due: isoDate, seen: z.number().int().min(0),
  correct: z.number().int().min(0), lastSeen: isoDate, lastResult: z.enum(['correct', 'unsure', 'wrong']),
  correctDays: z.array(isoDate).max(8),
});

const examResult = z.object({
  total: z.number().int(), correct: z.number().int(), unanswered: z.number().int(), pct: z.number(), passed: z.boolean(),
  byTopic: z.record(z.string(), z.object({ total: z.number().int(), correct: z.number().int() })), missed: z.array(id),
});

const examAttempt = z.object({
  id, contentVersion: shortStr, startedAt: shortStr, submittedAt: shortStr.nullable(),
  questionIds: z.array(id).max(100), choiceOrder: z.record(z.string(), z.array(z.string().max(10)).max(8)),
  answers: z.record(z.string(), z.string().max(10).nullable()), flagged: z.array(id).max(100),
  timerMinutes: z.number().int().min(1).max(240).nullable(), result: examResult.nullable(),
});

const plan = z.object({
  preset: z.enum(['1m', '2m', '3m', 'custom', 'flexible']), targetDate: isoDate.nullable(),
  studyDays: z.array(z.number().int().min(0).max(6)).max(7), minutesPerSession: z.number().int().min(5).max(180),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
});

const profile = z.object({
  id, name: z.string().min(1).max(40), lang: z.enum(['en', 'es']), createdAt: shortStr, timezone: shortStr,
  plan,
  completedLessons: z.record(z.string(), z.object({ date: isoDate, correct: z.number().int(), total: z.number().int() })),
  review: z.record(z.string(), reviewItem),
  history: z.array(z.object({ qid: id, date: isoDate, result: z.enum(['correct', 'unsure', 'wrong']), context: z.enum(['lesson', 'review', 'scenario']) })).max(MAX_HISTORY),
  xp: z.record(z.string(), z.number().int().min(0).max(100)),
  exams: z.array(examAttempt).max(500), activeExam: examAttempt.nullable(),
  confidence: z.array(z.object({ id, date: isoDate, when: z.enum(['before', 'after', 'checkin']), level: conf, note: text.optional() })).max(2000),
  checklist: z.record(z.string(), isoDate),
  practiceLogs: z.array(z.object({
    id, date: isoDate, minutes: z.number().int().min(0).max(600), supervisor: shortStr, area: shortStr,
    skills: z.array(shortStr).max(30), conditions: z.array(shortStr).max(20),
    confidenceBefore: conf.nullable(), confidenceAfter: conf.nullable(), wentWell: text, tryAgain: text, nextGoal: text,
  })).max(1000),
  providers: z.array(z.object({
    id, name: shortStr, contact: shortStr, adultBeginners: tri, spanish: tri, anxiousLearners: tri, dualControl: tri, pickup: tri,
    lessonLength: shortStr, totalPrice: shortStr, cancellation: text, availability: text, notes: text,
  })).max(50),
  lessonSession: z.object({
    lessonId: id, step: z.number().int().min(0).max(20), queue: z.array(id).max(40), qIndex: z.number().int().min(0),
    answers: z.record(z.string(), z.object({ choice: z.string().max(10).nullable(), order: z.array(z.string().max(20)).optional(), result: z.enum(['correct', 'unsure', 'wrong']) })),
    requeued: z.array(id), confidenceBefore: conf.nullable(), startedAt: shortStr,
  }).nullable(),
  reviewSession: z.object({ queue: z.array(id).max(40), qIndex: z.number().int().min(0), done: z.array(id), startedAt: isoDate }).nullable(),
  settings: z.object({
    reducedMotion: z.enum(['system', 'on', 'off']), theme: z.enum(['system', 'light', 'dark']).default('system'), voiceRate: z.number().min(0.5).max(2), showStreak: z.boolean(),
    examTimer: z.boolean(), examTimerMinutes: z.number().int().min(5).max(240), smallerSteps: z.boolean(),
  }),
  activeDays: z.array(isoDate).max(2000), lastActive: isoDate.nullable(),
});

export const appDataSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  activeProfileId: id,
  profileOrder: z.array(id).min(1).max(2),
  profiles: z.record(z.string(), profile),
}).refine((d) => d.profileOrder.every((p) => p in d.profiles) && d.activeProfileId in d.profiles, 'profile references are inconsistent');

export const profileSchema = profile;
