import { questionsByTopic } from '../content';
import type { TopicId } from '../content/types';
import { isSolid, type ReviewItem } from './review';

export type MasteryLevel = 'new' | 'learning' | 'practicing' | 'solid';

export interface TopicMastery {
  topic: TopicId;
  total: number;
  attempted: number;
  correctOnce: number;
  solid: number;
  level: MasteryLevel;
  /** 0..1, share of the topic's questions that are solid. */
  share: number;
}

/**
 * Topic mastery needs evidence across distinct questions and distinct days.
 * - new: nothing attempted
 * - learning: something attempted
 * - practicing: at least half the topic answered correctly at least once
 * - solid: at least 70% of the topic is solid (box 3+, correct on 2+ days)
 * First exposure is never "solid": it requires spaced repetition by design.
 */
export function topicMastery(topic: TopicId, review: Record<string, ReviewItem>): TopicMastery {
  const qs = questionsByTopic.get(topic) ?? [];
  let attempted = 0, correctOnce = 0, solid = 0;
  for (const q of qs) {
    const it = review[q.id];
    if (!it || it.seen === 0) continue;
    attempted++;
    if (it.correct > 0) correctOnce++;
    if (isSolid(it)) solid++;
  }
  const total = qs.length;
  const share = total ? solid / total : 0;
  let level: MasteryLevel = 'new';
  if (attempted > 0) level = 'learning';
  if (total && correctOnce / total >= 0.5) level = 'practicing';
  if (total && share >= 0.7) level = 'solid';
  return { topic, total, attempted, correctOnce, solid, level, share };
}

export function allMastery(review: Record<string, ReviewItem>): TopicMastery[] {
  return [...questionsByTopic.keys()].map((t) => topicMastery(t, review));
}
