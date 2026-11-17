import { useId, useMemo, useRef, useState } from 'react';
import { SOURCE_DOCS } from '../content/sources';
import type { ChoiceQuestion, OrderQuestion, Question } from '../content/types';
import { rng } from '../core/exam';
import type { Result } from '../core/review';
import { useT } from '../i18n/useT';
import { interpretSpoken } from '../voice/speech';
import { Icon } from './icons';
import { Btn, ReadAloud, Visual, VoiceAnswer } from './kit';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function shuffledIds(q: ChoiceQuestion, seed: number): string[] {
  const ids = q.choices.map((c) => c.id);
  if (q.fixedOrder) return ids;
  const r = rng(seed || 1);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export function SourceNote({ q }: { q: Question }) {
  const { t, lang } = useT();
  const doc = SOURCE_DOCS[q.source.doc];
  const pages = q.source.pages.join(', ');
  const pdf = q.source.pages.map((p) => p + doc.pdfPageOffset).join(', ');
  return (
    <div className="source-note">
      <p className="claim-label">
        {q.claim === 'app' ? t('appTip') : q.claim === 'law' ? t('lawLabel') : t('guidanceLabel')}
      </p>
      <p className="small muted">
        {t('source')}: {t('sourceLine', { p: pages, s: q.source.section })}; {t('sourcePdf', { p: pdf })}.
        {lang === 'es' && q.reviewFlags?.length ? ' ' : ''}
      </p>
    </div>
  );
}

interface PracticeProps {
  q: Question;
  /** Changing this re-shuffles choices (e.g., per attempt). */
  seedKey: string;
  onGraded: (result: Result, choice: string | null, order?: string[]) => void;
  onNext: () => void;
  nextLabel?: string;
  prior?: { choice: string | null; order?: string[]; result: Result };
}

/**
 * Practice mode: choose, optionally mark "I was unsure", check, then read
 * feedback explaining the right answer, why the chosen one is wrong, and what
 * to notice next time. Grading happens once per mount (double clicks ignored).
 */
export function PracticeQuestion(props: PracticeProps) {
  return props.q.kind === 'order' ? <OrderPractice {...props} q={props.q} /> : <ChoicePractice {...props} q={props.q} />;
}

function ChoicePractice({ q, seedKey, onGraded, onNext, nextLabel, prior }: PracticeProps & { q: ChoiceQuestion }) {
  const { t, c } = useT();
  const order = useMemo(() => shuffledIds(q, hash(q.id + seedKey)), [q, seedKey]);
  const [choice, setChoice] = useState<string | null>(prior?.choice ?? null);
  const [unsure, setUnsure] = useState(false);
  const [graded, setGraded] = useState<Result | null>(prior?.result ?? null);
  const gradedRef = useRef(!!prior);
  const name = useId();
  const byId = (id: string) => q.choices.find((x) => x.id === id)!;
  const pos = (id: string) => LETTERS[order.indexOf(id)];

  const check = (picked = choice) => {
    if (gradedRef.current || !picked) return;
    gradedRef.current = true;
    const res: Result = picked === q.correct ? (unsure ? 'unsure' : 'correct') : 'wrong';
    setChoice(picked);
    setGraded(res);
    onGraded(res, picked);
  };

  const readTexts = [c(q.prompt), ...order.map((id, i) => `${LETTERS[i]}. ${c(byId(id).text)}`)];
  const isRight = graded === 'correct' || graded === 'unsure';
  const picked = choice ? byId(choice) : null;

  return (
    <div className="question" onKeyDown={(e) => {
      if (graded || e.altKey || e.ctrlKey || e.metaKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= order.length && (e.target as HTMLElement).tagName !== 'TEXTAREA') setChoice(order[n - 1]);
    }}>
      <Visual spec={q.visual} reveal={!!graded} />
      <fieldset className="choices" disabled={!!graded}>
        <legend className="q-prompt">{c(q.prompt)}</legend>
        {order.map((id, i) => {
          const ch = byId(id);
          const state = graded ? (id === q.correct ? 'is-correct' : id === choice ? 'is-wrong' : '') : choice === id ? 'is-selected' : '';
          return (
            <label key={id} className={`choice ${state}`}>
              <input type="radio" name={name} value={id} checked={choice === id} onChange={() => setChoice(id)} />
              <span className="choice-letter" aria-hidden="true">{LETTERS[i]}</span>
              <span className="choice-text">{c(ch.text)}</span>
              {graded && id === q.correct && <span className="choice-tag"><Icon name="check" size={16} /> {t('correct')}</span>}
              {graded && id === choice && id !== q.correct && <span className="choice-tag"><Icon name="x" size={16} /> {t('yourAnswer', { a: '' }).replace(/:\s*$/, '')}</span>}
            </label>
          );
        })}
      </fieldset>

      {!graded && (
        <div className="q-actions">
          <label className="unsure">
            <input type="checkbox" checked={unsure} onChange={(e) => setUnsure(e.target.checked)} />
            <span>{t('imUnsure')}</span>
            <span className="muted small">{t('unsureHelp')}</span>
          </label>
          <div className="row wrap">
            <Btn kind="primary" onClick={() => check()} disabled={!choice} aria-describedby={!choice ? `${name}-hint` : undefined}>{t('check')}</Btn>
            {!choice && <span id={`${name}-hint`} className="muted small">{t('chooseAnswer')}</span>}
          </div>
          <div className="row wrap">
            <ReadAloud texts={readTexts} compact />
            <VoiceAnswer
              interpret={(tr) => {
                const r = interpretSpoken(tr, order.length, q.kind === 'tf');
                if (!r) return null;
                return 'tf' in r ? r.tf : order[r.position - 1];
              }}
              describe={(id) => `${pos(id)}. ${c(byId(id).text)}`}
              onConfirm={(id) => { setChoice(id); check(id); }}
            />
          </div>
        </div>
      )}

      <div aria-live="polite" className="feedback-region">
        {graded && (
          <div className={`feedback ${isRight ? 'feedback-ok' : 'feedback-no'}`}>
            <p className="feedback-title"><Icon name={isRight ? 'check' : 'info'} /> {isRight ? t('correct') : t('notQuite')}</p>
            {!isRight && <p><strong>{t('correctAnswerIs', { a: `${pos(q.correct)}. ${c(byId(q.correct).text)}` })}</strong></p>}
            <h3>{t('why')}</h3>
            <p>{c(q.explanation)}</p>
            {!isRight && picked?.why && (<><h3>{t('whyNotYours')}</h3><p>{c(picked.why)}</p></>)}
            <h3>{t('noticeNext')}</h3>
            <p>{c(q.notice)}</p>
            <SourceNote q={q} />
            <div className="row wrap">
              <ReadAloud texts={[isRight ? t('correct') : t('notQuite'), c(q.explanation), !isRight && picked?.why ? c(picked.why) : '', c(q.notice)]} compact />
              <Btn kind="primary" icon="arrowRight" onClick={onNext} autoFocus>{nextLabel ?? t('continue')}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderPractice({ q, seedKey, onGraded, onNext, nextLabel, prior }: PracticeProps & { q: OrderQuestion }) {
  const { t, c } = useT();
  const initial = useMemo(() => {
    const ids = q.steps.map((s) => s.id);
    const r = rng(hash(q.id + seedKey));
    let out = ids;
    for (let tries = 0; tries < 10 && out.join() === ids.join(); tries++) {
      out = [...ids];
      for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    }
    return out;
  }, [q, seedKey]);
  const [order, setOrder] = useState<string[]>(prior?.order ?? initial);
  const [graded, setGraded] = useState<Result | null>(prior?.result ?? null);
  const gradedRef = useRef(!!prior);
  const [announce, setAnnounce] = useState('');
  const text = (id: string) => c(q.steps.find((s) => s.id === id)!.text);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setAnnounce(`${text(next[j])}: ${t('stepN', { n: j + 1 })}`);
    requestAnimationFrame(() => document.getElementById(`${q.id}-${next[j]}-${d < 0 ? 'up' : 'down'}`)?.focus());
  };
  const correctIds = q.steps.map((s) => s.id);
  const check = () => {
    if (gradedRef.current) return;
    gradedRef.current = true;
    const res: Result = order.join() === correctIds.join() ? 'correct' : 'wrong';
    setGraded(res);
    onGraded(res, null, order);
  };
  const isRight = graded === 'correct';
  return (
    <div className="question">
      <Visual spec={q.visual} reveal={!!graded} />
      <p className="q-prompt" id={`${q.id}-p`}>{c(q.prompt)}</p>
      <p className="muted small">{t('orderPrompt')}</p>
      <ol className="order-list" aria-labelledby={`${q.id}-p`}>
        {order.map((id, i) => (
          <li key={id} className={`order-item${graded ? (correctIds[i] === id ? ' is-correct' : ' is-wrong') : ''}`}>
            <span className="order-num" aria-hidden="true">{i + 1}</span>
            <span className="order-text">{text(id)}</span>
            {!graded && (
              <span className="order-btns">
                <button type="button" id={`${q.id}-${id}-up`} className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('moveUp', { s: text(id) })}><Icon name="up" /></button>
                <button type="button" id={`${q.id}-${id}-down`} className="icon-btn" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={t('moveDown', { s: text(id) })}><Icon name="down" /></button>
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">{announce}</p>
      {!graded && <div className="row wrap"><Btn kind="primary" onClick={check}>{t('check')}</Btn><ReadAloud texts={[c(q.prompt), ...order.map((id, i) => `${i + 1}. ${text(id)}`)]} compact /></div>}
      <div aria-live="polite" className="feedback-region">
        {graded && (
          <div className={`feedback ${isRight ? 'feedback-ok' : 'feedback-no'}`}>
            <p className="feedback-title"><Icon name={isRight ? 'check' : 'info'} /> {isRight ? t('correct') : t('notQuite')}</p>
            {!isRight && (<><h3>{t('correctOrder')}</h3><ol>{correctIds.map((id) => <li key={id}>{text(id)}</li>)}</ol></>)}
            <h3>{t('why')}</h3>
            <p>{c(q.explanation)}</p>
            <h3>{t('noticeNext')}</h3>
            <p>{c(q.notice)}</p>
            <SourceNote q={q} />
            <div className="row wrap"><Btn kind="primary" icon="arrowRight" onClick={onNext} autoFocus>{nextLabel ?? t('continue')}</Btn></div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Exam mode: select only. No correctness information is shown. */
export function ExamQuestion({ q, order, value, onSelect }: { q: ChoiceQuestion; order: string[]; value: string | null; onSelect: (id: string) => void }) {
  const { c } = useT();
  const name = useId();
  return (
    <div className="question" onKeyDown={(e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= order.length && !e.altKey && !e.ctrlKey && !e.metaKey) onSelect(order[n - 1]);
    }}>
      <Visual spec={q.visual} reveal={false} />
      <fieldset className="choices">
        <legend className="q-prompt">{c(q.prompt)}</legend>
        {order.map((id, i) => {
          const ch = q.choices.find((x) => x.id === id)!;
          return (
            <label key={id} className={`choice${value === id ? ' is-selected' : ''}`}>
              <input type="radio" name={name} value={id} checked={value === id} onChange={() => onSelect(id)} />
              <span className="choice-letter" aria-hidden="true">{LETTERS[i]}</span>
              <span className="choice-text">{c(ch.text)}</span>
            </label>
          );
        })}
      </fieldset>
      <ReadAloud texts={[c(q.prompt), ...order.map((id, i) => `${LETTERS[i]}. ${c(q.choices.find((x) => x.id === id)!.text)}`)]} compact />
    </div>
  );
}

/** Post-exam review of one question, with the learner's answer and the explanation. */
export function ReviewedQuestion({ q, order, answer }: { q: ChoiceQuestion; order: string[]; answer: string | null }) {
  const { t, c } = useT();
  const pos = (id: string) => LETTERS[order.indexOf(id)] ?? '';
  const ch = (id: string) => q.choices.find((x) => x.id === id);
  const picked = answer ? ch(answer) : null;
  return (
    <div className="question reviewed">
      <p className="q-prompt">{c(q.prompt)}</p>
      <Visual spec={q.visual} reveal size="sm" />
      <p>{t('yourAnswer', { a: picked ? `${pos(answer!)}. ${c(picked.text)}` : t('unanswered') })}</p>
      <p><strong>{t('correctAnswerIs', { a: `${pos(q.correct)}. ${c(ch(q.correct)!.text)}` })}</strong></p>
      <p>{c(q.explanation)}</p>
      {picked?.why && <p className="muted">{c(picked.why)}</p>}
      <p className="small"><strong>{t('noticeNext')}:</strong> {c(q.notice)}</p>
      <SourceNote q={q} />
    </div>
  );
}
