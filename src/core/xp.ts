/**
 * Modest, deterministic points. Every award has a unique key in a ledger, so
 * repeated clicks, reloads, or replaying a completion screen cannot award twice.
 *
 * - First completion of a lesson: 20
 * - Correct review answer: 2 per question per day
 * - Completing a practice exam: 10 per attempt
 */
export const XP = { lesson: 20, review: 2, exam: 10 } as const;

export type Ledger = Record<string, number>;

export function award(ledger: Ledger, key: string, points: number): { ledger: Ledger; awarded: number } {
  if (key in ledger) return { ledger, awarded: 0 };
  return { ledger: { ...ledger, [key]: points }, awarded: points };
}

export const totalXP = (ledger: Ledger) => Object.values(ledger).reduce((a, b) => a + b, 0);

export const lessonKey = (lessonId: string) => `lesson:${lessonId}`;
export const reviewKey = (qid: string, date: string) => `review:${qid}:${date}`;
export const examKey = (attemptId: string) => `exam:${attemptId}`;
