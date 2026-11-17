/**
 * Curriculum content model.
 *
 * Content is data, separate from UI code. Every lesson, question, choice and
 * scenario has a stable ID that never changes once published, so that saved
 * progress, review schedules and exam history stay valid across edits and
 * across languages.
 *
 * Localized text is stored as a tuple: [English, Spanish].
 */

export type Lang = 'en' | 'es';
export type T = readonly [en: string, es: string];

export function tr(text: T, lang: Lang): string {
  return lang === 'es' ? text[1] : text[0];
}

/** Which official document a claim comes from. */
export type SourceDocId = 'IL-ROR-2026';

export interface SourceRef {
  doc: SourceDocId;
  /** Printed page number(s) as shown at the bottom of the handbook page. */
  pages: readonly number[];
  /** Handbook section heading the claim is drawn from. */
  section: string;
}

/**
 * What kind of claim a question or lesson point makes.
 * - law: the handbook states it as a legal requirement ("must", "illegal").
 * - guidance: the handbook recommends it ("should", safety tip).
 * - app: a conservative practice recommendation written for this app; not a
 *   handbook statement. Always shown with an "App tip" label.
 */
export type ClaimKind = 'law' | 'guidance' | 'app';

export type TopicId =
  | 'start'
  | 'sign-shapes'
  | 'sign-meanings'
  | 'signals'
  | 'markings'
  | 'right-of-way'
  | 'pedestrians'
  | 'turns-lanes'
  | 'speed-following'
  | 'sharing'
  | 'special-stops'
  | 'railroad'
  | 'parking'
  | 'expressway'
  | 'conditions'
  | 'impairment'
  | 'occupants'
  | 'equipment'
  | 'emergencies';

export type VisualSpec =
  | { type: 'sign'; id: SignId }
  | { type: 'signal'; id: SignalId }
  | { type: 'scene'; id: SceneId };

export type SignId =
  | 'stop'
  | 'yield'
  | 'rr-advance'
  | 'crossbuck'
  | 'warning-blank'
  | 'school'
  | 'school-crossing'
  | 'no-passing-pennant'
  | 'do-not-enter'
  | 'wrong-way'
  | 'one-way'
  | 'speed-limit-30'
  | 'no-turn-on-red'
  | 'no-u-turn'
  | 'no-right-turn'
  | 'merge'
  | 'lane-ends'
  | 'keep-right'
  | 'slow-moving'
  | 'signal-ahead'
  | 'stop-ahead'
  | 'pedestrian-crossing'
  | 'slippery'
  | 'workers'
  | 'flagger'
  | 'all-way'
  | 'divided-highway'
  | 'two-way-traffic'
  | 'curve-right'
  | 'disability-parking'
  | 'guide-green'
  | 'services-blue'
  | 'recreation-brown';

export type SignalId =
  | 'red'
  | 'yellow'
  | 'green'
  | 'flashing-red'
  | 'flashing-yellow'
  | 'red-arrow-left'
  | 'flashing-yellow-arrow-left'
  | 'green-arrow-left'
  | 'red-with-green-arrow'
  | 'dark'
  | 'ped-walk'
  | 'ped-flashing-hand'
  | 'lane-red-x';

export type SceneId =
  | 'four-way-arrival'
  | 'four-way-same-time'
  | 'uncontrolled-same-time'
  | 't-intersection'
  | 'alley-exit'
  | 'left-turn-oncoming'
  | 'right-turn-bike'
  | 'left-turn-bike'
  | 'crosswalk-marked'
  | 'parked-car-door'
  | 'school-bus-two-lane'
  | 'school-bus-four-lane'
  | 'emergency-approach'
  | 'following-distance'
  | 'blind-spots'
  | 'hill-downhill-curb'
  | 'hill-uphill-curb'
  | 'hill-no-curb'
  | 'parallel-parking'
  | 'yellow-lines-pass'
  | 'double-yellow'
  | 'two-way-left-turn'
  | 'stop-line-crosswalk'
  | 'expressway-merge'
  | 'railroad-gates'
  | 'large-vehicle-right-turn'
  | 'one-way-left-on-red'
  | 'bus-stop-pedestrian'
  | 'blocked-crosswalk';

export type QuestionKind =
  | 'mc' // multiple choice
  | 'tf' // true or false
  | 'sign' // identify or interpret a sign
  | 'scenario' // decide in a concrete situation
  | 'order' // put steps in order
  | 'compare' // compare two situations
  | 'hazard'; // identify the hazard in a scene

export interface Choice {
  id: string;
  text: T;
  /** Shown when the learner picks this choice and it is wrong. */
  why?: T;
}

interface QuestionBase {
  id: string;
  topic: TopicId;
  /** 1 recognize, 2 explain, 3 apply simply, 4 apply with competing hazards. */
  level: 1 | 2 | 3 | 4;
  prompt: T;
  visual?: VisualSpec;
  /** Why the correct answer is right. */
  explanation: T;
  /** The detail to notice next time. */
  notice: T;
  source: SourceRef;
  claim: ClaimKind;
  /** Can appear in the practice exam. Some teaching items are lesson-only. */
  examEligible: boolean;
  /** Content needing fluent human review (e.g. Spanish legal wording). */
  reviewFlags?: readonly string[];
}

export interface ChoiceQuestion extends QuestionBase {
  kind: 'mc' | 'tf' | 'sign' | 'scenario' | 'compare' | 'hazard';
  choices: readonly Choice[];
  correct: string;
  /**
   * When true, choice order is never shuffled (used for "both of the above",
   * true/false, and compare questions).
   */
  fixedOrder?: boolean;
}

export interface OrderQuestion extends QuestionBase {
  kind: 'order';
  /** Steps listed in the correct order. Displayed shuffled. */
  steps: readonly { id: string; text: T }[];
}

export type Question = ChoiceQuestion | OrderQuestion;

export interface Lesson {
  id: string;
  topic: TopicId;
  title: T;
  minutes: number;
  /** 1. A concrete situation. */
  situation: T;
  /** 2. Concise explanation, as short paragraphs. */
  explain: readonly T[];
  /** 3. A helpful visual. */
  visual?: VisualSpec;
  visualCaption?: T;
  /** 4. Worked example. */
  example: { setup: T; reasoning: T };
  /** 5. Interactive questions by ID. */
  questionIds: readonly string[];
  /** 7. Practical observation or preparation task (never while driving). */
  task: T;
  /** 8. Recap points. */
  recap: readonly T[];
  /** Key terms introduced before testing. */
  terms?: readonly string[];
  sources: readonly SourceRef[];
}

export interface Unit {
  id: TopicId;
  title: T;
  summary: T;
  lessons: readonly string[];
}

export interface GlossaryTerm {
  id: string;
  en: string;
  es: string;
  def: T;
}

export interface ScenarioPlace {
  id: string;
  name: string;
  neighborhood: string;
  lat: number;
  lng: number;
  /** How the coordinates were checked. */
  verified: { method: string; date: string; query: string };
}

export interface Scenario {
  id: string;
  placeId: string;
  topic: TopicId;
  difficulty: 1 | 2 | 3;
  title: T;
  setup: T;
  questionId: string;
  lessonId: string;
  visual?: VisualSpec;
}
