import { conditionQuestions } from './questions/conditions';
import { drivingQuestions } from './questions/driving';
import { rightOfWayQuestions } from './questions/rightofway';
import { safetyQuestions } from './questions/safety';
import { sharingQuestions } from './questions/sharing';
import { signalQuestions } from './questions/signals';
import { signQuestions } from './questions/signs';
import { lessons, units } from './lessons';
import type { Lesson, Question, TopicId } from './types';

/**
 * Bump when questions, answers or lessons change in a way that would affect
 * scoring. Saved exam attempts record this so history stays interpretable.
 */
export const CONTENT_VERSION = '2026.11.1';

export const questions: Question[] = [
  ...signQuestions,
  ...signalQuestions,
  ...rightOfWayQuestions,
  ...drivingQuestions,
  ...sharingQuestions,
  ...conditionQuestions,
  ...safetyQuestions,
];

export const questionById = new Map(questions.map((q) => [q.id, q]));
export const lessonById = new Map<string, Lesson>(lessons.map((l) => [l.id, l]));
export const unitById = new Map(units.map((u) => [u.id, u]));

/** Lessons in path order. */
export const lessonOrder: string[] = units.flatMap((u) => [...u.lessons]);

export const topicOfLesson = (lessonId: string): TopicId | undefined => lessonById.get(lessonId)?.topic;

export const questionsByTopic = (() => {
  const m = new Map<TopicId, Question[]>();
  for (const q of questions) {
    const arr = m.get(q.topic) ?? [];
    arr.push(q);
    m.set(q.topic, arr);
  }
  return m;
})();

export { lessons, units };
