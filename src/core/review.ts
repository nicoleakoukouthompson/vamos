import { addDays, type ISODate } from './dates';

/**
 * Transparent spaced review (a Leitner-style box system).
 *
 * - Box 0: never answered.
 * - A wrong answer moves the item to box 1, due tomorrow (and the lesson or
 *   review session repeats it once more before finishing).
 * - "Correct, but I was unsure" keeps the box (minimum 1), due tomorrow.
 * - A correct answer on or after the due date moves the item up one box.
 *   Correct answers before the due date are recorded but do not advance the
 *   box, so repeating the same question cannot inflate progress.
 */
export const INTERVALS = [0, 1, 2, 4, 7, 14, 30] as const;
export const MAX_BOX = INTERVALS.length - 1;

export type Result = 'correct' | 'unsure' | 'wrong';

export interface ReviewItem {
  qid: string;
  box: number;
  due: ISODate;
  seen: number;
  correct: number;
  lastSeen: ISODate;
  lastResult: Result;
  /** Distinct dates with a confident correct answer (most recent 8). */
  correctDays: ISODate[];
}

export function newItem(qid: string, today: ISODate): ReviewItem {
  return { qid, box: 0, due: today, seen: 0, correct: 0, lastSeen: today, lastResult: 'wrong', correctDays: [] };
}

export function recordAnswer(prev: ReviewItem | undefined, qid: string, result: Result, today: ISODate): ReviewItem {
  const item: ReviewItem = prev ? { ...prev, correctDays: [...prev.correctDays] } : newItem(qid, today);
  item.seen += 1;
  item.lastSeen = today;
  item.lastResult = result;
  if (result === 'wrong') {
    item.box = 1;
    item.due = addDays(today, INTERVALS[1]);
    return item;
  }
  item.correct += 1;
  if (result === 'unsure') {
    item.box = Math.max(1, item.box);
    item.due = addDays(today, INTERVALS[1]);
    return item;
  }
  const isDue = !prev || prev.box === 0 || prev.due <= today;
  if (isDue) {
    item.box = Math.min(MAX_BOX, item.box + 1);
    item.due = addDays(today, INTERVALS[item.box]);
  }
  if (!item.correctDays.includes(today)) {
    item.correctDays.push(today);
    if (item.correctDays.length > 8) item.correctDays.shift();
  }
  return item;
}

export function isDue(item: ReviewItem, today: ISODate): boolean {
  return item.box > 0 && item.due <= today;
}

/**
 * Due items, most urgent first: wrong answers, then lower boxes, then most overdue.
 * Capped so a long absence does not produce an overwhelming pile.
 */
export function dueItems(items: Record<string, ReviewItem>, today: ISODate, cap = 15): ReviewItem[] {
  return Object.values(items)
    .filter((i) => isDue(i, today))
    .sort((a, b) => {
      const w = (x: ReviewItem) => (x.lastResult === 'wrong' ? 0 : x.lastResult === 'unsure' ? 1 : 2);
      return w(a) - w(b) || a.box - b.box || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || a.qid.localeCompare(b.qid);
    })
    .slice(0, cap);
}

export function dueCount(items: Record<string, ReviewItem>, today: ISODate): number {
  return Object.values(items).filter((i) => isDue(i, today)).length;
}

/** An item counts as solid when it reached box 3+ and was answered correctly on 2+ different days. */
export function isSolid(item: ReviewItem | undefined): boolean {
  return !!item && item.box >= 3 && item.correctDays.length >= 2 && item.lastResult !== 'wrong';
}
