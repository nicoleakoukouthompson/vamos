import { CONTENT_VERSION, questionById, questions } from '../content';
import type { ChoiceQuestion, TopicId } from '../content/types';

/**
 * Practice exam format used by Vamos.
 *
 * The number of questions and pass mark are APP SETTINGS. The handbook
 * (printed p.14) describes what the written exam covers but not a question
 * count or passing score. The 35-question / 80% format is a commonly cited
 * format that has NOT been verified against the official regulation in this
 * build (the regulation site could not be reached). See the Sources page.
 */
export const EXAM_FORMAT = { count: 35, passPct: 80, minSigns: 10, verified: false } as const;

export interface ExamAttempt {
  id: string;
  contentVersion: string;
  startedAt: string; // ISO timestamp
  submittedAt: string | null;
  questionIds: string[];
  /** Choice order shown for each question, so the attempt renders the same after reload. */
  choiceOrder: Record<string, string[]>;
  answers: Record<string, string | null>;
  flagged: string[];
  timerMinutes: number | null;
  result: ExamResult | null;
}

export interface ExamResult {
  total: number;
  correct: number;
  unanswered: number;
  pct: number;
  passed: boolean;
  byTopic: Record<string, { total: number; correct: number }>;
  missed: string[];
}

/** Small deterministic PRNG so tests can reproduce selections. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const examPool = (): ChoiceQuestion[] =>
  questions.filter((q): q is ChoiceQuestion => q.kind !== 'order' && q.examEligible);

const SIGN_TOPICS: TopicId[] = ['sign-shapes', 'sign-meanings'];

/**
 * Select questions with balanced topic coverage.
 * - No duplicate IDs.
 * - At least `minSigns` sign questions.
 * - Remaining slots spread across topics in proportion to their size, with
 *   every topic represented where possible.
 * - Questions seen in recent attempts are used last, to reduce memorizing.
 */
export function buildExam(opts: { seed: number; recentlySeen?: Set<string>; count?: number; timerMinutes?: number | null; now?: Date }): ExamAttempt {
  const count = opts.count ?? EXAM_FORMAT.count;
  const rand = rng(opts.seed);
  const seen = opts.recentlySeen ?? new Set<string>();
  const pool = examPool();

  const byTopic = new Map<TopicId, ChoiceQuestion[]>();
  for (const q of pool) {
    const arr = byTopic.get(q.topic) ?? [];
    arr.push(q);
    byTopic.set(q.topic, arr);
  }
  // Order each topic: unseen first (shuffled), then seen (shuffled).
  for (const [t, arr] of byTopic) {
    const fresh = shuffle(arr.filter((q) => !seen.has(q.id)), rand);
    const old = shuffle(arr.filter((q) => seen.has(q.id)), rand);
    byTopic.set(t, [...fresh, ...old]);
  }

  const picked: ChoiceQuestion[] = [];
  const take = (t: TopicId) => {
    const arr = byTopic.get(t);
    if (arr && arr.length) picked.push(arr.shift()!);
  };

  // Signs first.
  let signs = 0;
  while (signs < EXAM_FORMAT.minSigns && SIGN_TOPICS.some((t) => (byTopic.get(t)?.length ?? 0) > 0)) {
    take(SIGN_TOPICS[signs % 2]);
    if ((byTopic.get(SIGN_TOPICS[signs % 2])?.length ?? 0) === 0) take(SIGN_TOPICS[(signs + 1) % 2]);
    signs = picked.length;
  }
  // One from every other topic.
  const others = shuffle([...byTopic.keys()].filter((t) => !SIGN_TOPICS.includes(t)), rand);
  for (const t of others) if (picked.length < count) take(t);
  // Fill proportionally: repeatedly take from the topic with the most remaining.
  while (picked.length < count) {
    const next = [...byTopic.entries()].filter(([, a]) => a.length).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))[0];
    if (!next) break;
    take(next[0]);
  }

  const ordered = shuffle(picked, rand);
  const choiceOrder: Record<string, string[]> = {};
  for (const q of ordered) {
    const ids = q.choices.map((c) => c.id);
    choiceOrder[q.id] = q.fixedOrder ? ids : shuffle(ids, rand);
  }
  const now = opts.now ?? new Date();
  return {
    id: `ex-${now.getTime().toString(36)}-${Math.floor(rand() * 1e6).toString(36)}`,
    contentVersion: CONTENT_VERSION,
    startedAt: now.toISOString(),
    submittedAt: null,
    questionIds: ordered.map((q) => q.id),
    choiceOrder,
    answers: Object.fromEntries(ordered.map((q) => [q.id, null])),
    flagged: [],
    timerMinutes: opts.timerMinutes ?? null,
    result: null,
  };
}

/** Unanswered questions count as incorrect. Pass requires pct >= passPct. */
export function gradeExam(a: ExamAttempt): ExamResult {
  let correct = 0, unanswered = 0;
  const byTopic: ExamResult['byTopic'] = {};
  const missed: string[] = [];
  for (const id of a.questionIds) {
    const q = questionById.get(id);
    if (!q || q.kind === 'order') continue;
    const t = (byTopic[q.topic] ??= { total: 0, correct: 0 });
    t.total++;
    const ans = a.answers[id];
    if (ans == null) { unanswered++; missed.push(id); continue; }
    if (ans === q.correct) { correct++; t.correct++; } else missed.push(id);
  }
  const total = a.questionIds.length;
  const pct = total ? Math.round((correct / total) * 1000) / 10 : 0;
  return { total, correct, unanswered, pct, passed: total > 0 && correct * 100 >= EXAM_FORMAT.passPct * total, byTopic, missed };
}

/**
 * App recommendation, not an official requirement: the three most recent
 * attempts all at 90% or above, covering at least 70 different questions.
 */
export function readinessSignal(attempts: ExamAttempt[]): { consistent: boolean; recentPcts: number[]; distinct: number } {
  const done = attempts.filter((a) => a.result).slice(-3);
  const distinct = new Set(done.flatMap((a) => a.questionIds)).size;
  const recentPcts = done.map((a) => a.result!.pct);
  return { consistent: done.length === 3 && recentPcts.every((p) => p >= 90) && distinct >= 70, recentPcts, distinct };
}
