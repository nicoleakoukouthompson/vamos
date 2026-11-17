import { lessonById, lessonOrder } from '../content';
import { addDays, addMonths, daysBetween, isISODate, weekday, type ISODate } from './dates';

export type PlanPreset = '1m' | '2m' | '3m' | 'custom' | 'flexible';

export interface StudyPlanSettings {
  preset: PlanPreset;
  /** Required unless preset is 'flexible'. The planned test date. */
  targetDate: ISODate | null;
  /** 0 = Sunday ... 6 = Saturday */
  studyDays: number[];
  minutesPerSession: number;
  reminderTime: string | null; // HH:MM
}

export const DEFAULT_STUDY_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function targetForPreset(preset: PlanPreset, today: ISODate): ISODate | null {
  if (preset === '1m') return addDays(today, 30);
  if (preset === '2m') return addMonths(today, 2);
  if (preset === '3m') return addMonths(today, 3);
  return null;
}

export function defaultPlan(today: ISODate): StudyPlanSettings {
  return { preset: '1m', targetDate: targetForPreset('1m', today), studyDays: [...DEFAULT_STUDY_DAYS], minutesPerSession: 20, reminderTime: null };
}

/** Time estimates used for planning (minutes). */
export const EST = {
  reviewPerItem: 0.5,
  /** Expected review load per study day once learning is underway. */
  reviewReservePerDay: 4,
  examMinutes: 25,
  /** Practice exams recommended before the test date. */
  examsWanted: 3,
};

export type PlanStatus =
  | 'no-days' // no study days selected
  | 'past' // target date has passed
  | 'too-close' // target date is today or tomorrow with lots left
  | 'needs-more-time' // workload exceeds available time
  | 'on-track'
  | 'ahead' // curriculum done; keep reviewing and practice tests
  | 'flexible';

export interface DayPlan {
  date: ISODate;
  lessons: string[];
  reviewMinutes: number;
  exam: boolean;
  minutes: number;
}

export interface PlanResult {
  status: PlanStatus;
  daysLeft: number | null;
  studyDaysLeft: number;
  remainingLessons: string[];
  minutesNeeded: number;
  minutesAvailable: number;
  /** Extra minutes per session that would make the plan fit, if any. */
  extraMinutesPerSession: number;
  /** Lessons to start today. */
  todayLessons: string[];
  days: DayPlan[];
}

export function studyDatesBetween(from: ISODate, toExclusive: ISODate, studyDays: number[]): ISODate[] {
  const out: ISODate[] = [];
  const n = daysBetween(from, toExclusive);
  for (let i = 0; i < n && i < 800; i++) {
    const d = addDays(from, i);
    if (studyDays.includes(weekday(d))) out.push(d);
  }
  return out;
}

/**
 * Build a plan from today forward using only remaining work. Completed work
 * is never re-planned, missed days simply drop out of the window, and no
 * single day is assigned more than the session length (so missed work is
 * spread out, not crammed into the next day).
 */
export function computePlan(input: {
  today: ISODate;
  settings: StudyPlanSettings;
  completedLessons: Set<string>;
  dueReviewCount: number;
  examsTaken: number;
  /** True if today's session was already completed. */
  studiedToday?: boolean;
}): PlanResult {
  const { today, settings, completedLessons, dueReviewCount, examsTaken } = input;
  const remainingLessons = lessonOrder.filter((id) => !completedLessons.has(id));
  const lessonMins = (id: string) => lessonById.get(id)?.minutes ?? 6;
  const lessonMinutesLeft = remainingLessons.reduce((a, id) => a + lessonMins(id), 0);
  const examsLeft = Math.max(0, EST.examsWanted - examsTaken);
  const perSession = Math.max(5, settings.minutesPerSession);

  const flexible = settings.preset === 'flexible' || !settings.targetDate || !isISODate(settings.targetDate);
  const horizonEnd = flexible ? addDays(today, 7 * 26) : settings.targetDate!;
  const daysLeft = flexible ? null : daysBetween(today, settings.targetDate!);

  let dates = settings.studyDays.length ? studyDatesBetween(today, horizonEnd, settings.studyDays) : [];
  if (input.studiedToday) dates = dates.filter((d) => d !== today);

  const reviewNow = Math.ceil(dueReviewCount * EST.reviewPerItem);
  const reviewNeed = reviewNow + Math.max(0, dates.length - 1) * EST.reviewReservePerDay;
  const minutesNeeded = lessonMinutesLeft + examsLeft * EST.examMinutes + (flexible ? reviewNow : reviewNeed);
  const minutesAvailable = flexible ? Infinity : dates.length * perSession;

  // Distribute lessons day by day without exceeding the session length.
  const days: DayPlan[] = [];
  const queue = [...remainingLessons];
  // Reserve the last study days for practice exams when there is a date.
  const examDays = new Set(!flexible && examsLeft > 0 && dates.length > examsLeft + 1 ? dates.slice(-examsLeft) : []);
  // Spread lessons evenly over the days available for new material, keeping the
  // final study days for practice tests. Recomputed daily, so missed days are
  // absorbed gradually instead of being crammed into the next session.
  const lessonDayCount = Math.max(1, dates.length - examDays.size);
  dates.forEach((date, idx) => {
    const reviewMinutes = Math.min(perSession, idx === 0 ? Math.max(reviewNow, 0) : EST.reviewReservePerDay);
    let budget = perSession - reviewMinutes;
    const exam = examDays.has(date);
    if (exam) budget -= EST.examMinutes;
    const daysLeftForLessons = Math.max(1, lessonDayCount - idx);
    const target = flexible ? Infinity : Math.ceil(queue.length / daysLeftForLessons);
    const ls: string[] = [];
    while (queue.length && ls.length < target && (budget >= lessonMins(queue[0]) || (ls.length === 0 && !exam))) {
      const id = queue.shift()!;
      ls.push(id);
      budget -= lessonMins(id);
    }
    days.push({ date, lessons: ls, reviewMinutes, exam, minutes: perSession - Math.max(0, budget) });
  });

  let status: PlanStatus;
  if (!settings.studyDays.length) status = 'no-days';
  else if (flexible) status = remainingLessons.length === 0 ? 'ahead' : 'flexible';
  else if (daysLeft! < 0) status = 'past';
  else if (remainingLessons.length === 0) status = 'ahead';
  else if (daysLeft! <= 1) status = 'too-close';
  else if (minutesNeeded > minutesAvailable) status = 'needs-more-time';
  else status = 'on-track';

  const extra =
    status === 'needs-more-time' && dates.length
      ? Math.ceil((minutesNeeded - minutesAvailable) / dates.length / 5) * 5
      : 0;

  const todayPlan = days.find((d) => d.date === today);
  const todayLessons = todayPlan?.lessons.length
    ? todayPlan.lessons
    : remainingLessons.slice(0, 1); // studying on a non-study day is welcome

  return {
    status,
    daysLeft,
    studyDaysLeft: dates.length,
    remainingLessons,
    minutesNeeded,
    minutesAvailable: Number.isFinite(minutesAvailable) ? minutesAvailable : -1,
    extraMinutesPerSession: extra,
    todayLessons,
    days,
  };
}
