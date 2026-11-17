import type {
  ChoiceQuestion,
  ClaimKind,
  OrderQuestion,
  SourceRef,
  T,
  TopicId,
  VisualSpec,
} from './types';

/** Reference to the Illinois Rules of the Road 2026 by printed page number. */
export function hb(pages: number | number[], section: string): SourceRef {
  return { doc: 'IL-ROR-2026', pages: Array.isArray(pages) ? pages : [pages], section };
}

type ChoiceTuple =
  | readonly [id: string, en: string, es: string]
  | readonly [id: string, en: string, es: string, whyEn: string, whyEs: string];

interface Common {
  id: string;
  t: TopicId;
  l: 1 | 2 | 3 | 4;
  p: T;
  v?: VisualSpec;
  x: T;
  n: T;
  s: SourceRef;
  cl: ClaimKind;
  exam?: boolean;
  flags?: string[];
}

/** Multiple choice, sign, scenario, compare or hazard question. */
export function mc(
  q: Common & {
    k?: ChoiceQuestion['kind'];
    c: readonly ChoiceTuple[];
    a: string;
    fixed?: boolean;
  },
): ChoiceQuestion {
  return {
    id: q.id,
    topic: q.t,
    level: q.l,
    kind: q.k ?? 'mc',
    prompt: q.p,
    visual: q.v,
    choices: q.c.map((c) => ({
      id: c[0],
      text: [c[1], c[2]] as const,
      why: c.length === 5 ? ([c[3], c[4]] as const) : undefined,
    })),
    correct: q.a,
    fixedOrder: q.fixed,
    explanation: q.x,
    notice: q.n,
    source: q.s,
    claim: q.cl,
    examEligible: q.exam ?? true,
    reviewFlags: q.flags,
  };
}

/** True or false question. Choice order is always fixed. */
export function tf(
  q: Common & { a: boolean; whyWrong?: T },
): ChoiceQuestion {
  const w = q.whyWrong;
  return {
    id: q.id,
    topic: q.t,
    level: q.l,
    kind: 'tf',
    prompt: q.p,
    visual: q.v,
    choices: [
      { id: 'true', text: ['True', 'Verdadero'], why: q.a ? undefined : w },
      { id: 'false', text: ['False', 'Falso'], why: q.a ? w : undefined },
    ],
    correct: q.a ? 'true' : 'false',
    fixedOrder: true,
    explanation: q.x,
    notice: q.n,
    source: q.s,
    claim: q.cl,
    examEligible: q.exam ?? true,
    reviewFlags: q.flags,
  };
}

/** Sequence ordering question. Steps are given in the correct order. */
export function ord(
  q: Common & { steps: readonly (readonly [id: string, en: string, es: string])[] },
): OrderQuestion {
  return {
    id: q.id,
    topic: q.t,
    level: q.l,
    kind: 'order',
    prompt: q.p,
    visual: q.v,
    steps: q.steps.map((s) => ({ id: s[0], text: [s[1], s[2]] as const })),
    explanation: q.x,
    notice: q.n,
    source: q.s,
    claim: q.cl,
    // Ordering items are teaching items; the exam uses single-answer items.
    examEligible: q.exam ?? false,
    reviewFlags: q.flags,
  };
}
