import { useEffect, useMemo, useState } from 'react';
import { questionById, unitById } from '../content';
import type { ChoiceQuestion, TopicId } from '../content/types';
import { EXAM_FORMAT, readinessSignal, type ExamAttempt } from '../core/exam';
import { formatDate } from '../core/dates';
import { useT } from '../i18n/useT';
import { answerExam, discardActiveExam, saveNow, startExam, submitExam, toggleExamFlag, updateSettings, useProfile } from '../store/store';
import { Icon } from '../ui/icons';
import { Btn, Card, ConfirmDialog, LinkBtn, Notice, Progress } from '../ui/kit';
import { ExamQuestion, ReviewedQuestion } from '../ui/QuestionCard';
import { navigate } from '../ui/router';

export function Exam({ attemptId }: { attemptId?: string }) {
  const p = useProfile();
  const { t } = useT();
  if (attemptId) {
    const a = p.exams.find((e) => e.id === attemptId);
    return a ? <Results a={a} /> : <Card><h1>{t('notFound')}</h1><LinkBtn href="#/exam">{t('back')}</LinkBtn></Card>;
  }
  if (p.activeExam) return <Runner a={p.activeExam} />;
  return <Start />;
}

function Start() {
  const p = useProfile();
  const { t, lang } = useT();
  const sig = readinessSignal(p.exams);
  const timer = p.settings.examTimer;
  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('examTitle')}</h1>
        <p className="lead">{t('examIntro', { n: EXAM_FORMAT.count, s: EXAM_FORMAT.minSigns })}</p>
      </div>
      <Card>
        <Notice>{t('examFormatNote', { n: EXAM_FORMAT.count, p: EXAM_FORMAT.passPct })}</Notice>
        <p>{t('untimedDefault')}</p>
        <label className="check-field">
          <input type="checkbox" checked={timer} onChange={(e) => updateSettings({ examTimer: e.target.checked })} />
          <span>{t('useTimer', { n: p.settings.examTimerMinutes })}</span>
        </label>
        <Btn kind="primary" full icon="exam" onClick={() => startExam(timer ? p.settings.examTimerMinutes : null)}>{t('startExam')}</Btn>
      </Card>
      <Card>
        <h2>{t('readinessTitle')}</h2>
        <p>{t('readinessBody')}</p>
        {sig.consistent && <Notice kind="ok">{t('readinessMet')}</Notice>}
      </Card>
      <Card>
        <h2>{t('examHistory')}</h2>
        {p.exams.length === 0 ? <p className="muted">{t('noAttempts')}</p> : (
          <ul className="attempt-list">
            {[...p.exams].reverse().map((e) => (
              <li key={e.id}>
                <span>{t('attemptLine', { d: formatDate(e.startedAt.slice(0, 10), lang), c: e.result!.correct, n: e.result!.total, p: e.result!.pct })}</span>
                <a href={`#/exam/${e.id}`} className="btn btn-ghost btn-small">{t('viewAttempt')}</a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function useCountdown(a: ExamAttempt) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!a.timerMinutes) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [a.timerMinutes]);
  if (!a.timerMinutes) return null;
  const end = new Date(a.startedAt).getTime() + a.timerMinutes * 60000;
  return Math.max(0, Math.round((end - now) / 1000));
}

function Runner({ a }: { a: ExamAttempt }) {
  const { t } = useT();
  const [i, setI] = useState(() => Math.max(0, a.questionIds.findIndex((id) => a.answers[id] == null)));
  const [confirm, setConfirm] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const left = useCountdown(a);
  const qid = a.questionIds[i];
  const q = questionById.get(qid) as ChoiceQuestion | undefined;
  const answered = a.questionIds.filter((id) => a.answers[id] != null).length;
  const flagged = a.flagged.length;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('examTitle')}</h1>
        <div className="row between wrap">
          <p className="muted small" aria-live="polite">{t('questionOf', { i: i + 1, n: a.questionIds.length })} · {t('answered')}: {answered}</p>
          {left !== null && <p className="small timer" role="timer" aria-live="off">{left > 0 ? t('timeLeft', { t: fmt(left) }) : t('timeUp')}</p>}
        </div>
        <Progress value={answered} max={a.questionIds.length} label={`${t('answered')}: ${answered}`} />
      </div>
      <Card>
        {q ? (
          <ExamQuestion key={qid} q={q} order={a.choiceOrder[qid]} value={a.answers[qid]} onSelect={(id) => answerExam(qid, id)} />
        ) : <p>{t('questionRemoved')}</p>}
        <div className="row wrap between exam-nav">
          <Btn icon="arrowLeft" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>{t('prev')}</Btn>
          <Btn kind="ghost" icon="flag" onClick={() => toggleExamFlag(qid)} aria-pressed={a.flagged.includes(qid)}>{a.flagged.includes(qid) ? t('unflag') : t('flag')}</Btn>
          {i < a.questionIds.length - 1
            ? <Btn kind="primary" icon="arrowRight" onClick={() => setI(i + 1)}>{t('next')}</Btn>
            : <Btn kind="primary" onClick={() => setConfirm(true)}>{t('reviewAndSubmit')}</Btn>}
        </div>
      </Card>
      <Card>
        <Btn kind="ghost" onClick={() => setShowMap(!showMap)} aria-expanded={showMap}>{t('questionMap')}</Btn>
        {showMap && (
          <ol className="qmap">
            {a.questionIds.map((id, k) => {
              const st = a.answers[id] != null ? t('answered') : t('unanswered');
              const fl = a.flagged.includes(id) ? `, ${t('flagged')}` : '';
              return (
                <li key={id}>
                  <button type="button" className={`qmap-btn${a.answers[id] != null ? ' is-answered' : ''}${k === i ? ' is-current' : ''}`} onClick={() => setI(k)} aria-label={`${k + 1}: ${st}${fl}`} aria-current={k === i ? 'step' : undefined}>
                    {k + 1}{a.flagged.includes(id) && <Icon name="flag" size={12} />}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        <div className="row wrap">
          <Btn kind="primary" onClick={() => setConfirm(true)}>{t('reviewAndSubmit')}</Btn>
          <Btn icon="check" onClick={() => { saveNow(); navigate('/today'); }}>{t('saveAndExit')}</Btn>
          <Btn kind="ghost" onClick={() => setDiscard(true)}>{t('discardExam')}</Btn>
        </div>
        <p className="muted small">{t('progressSavedNote')}</p>
        <div>
        </div>
      </Card>
      <ConfirmDialog open={confirm} title={t('submitConfirmTitle')}
        body={t('submitConfirmBody', { a: answered, n: a.questionIds.length, u: a.questionIds.length - answered, f: flagged })}
        confirmLabel={t('submit')} onCancel={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); const done = submitExam(); if (done) navigate(`/exam/${done.id}`); }} />
      <ConfirmDialog open={discard} title={t('discardExam')} body={t('discardConfirm')} confirmLabel={t('discardExam')} danger
        onCancel={() => setDiscard(false)} onConfirm={() => { setDiscard(false); discardActiveExam(); }} />
    </div>
  );
}

function Results({ a }: { a: ExamAttempt }) {
  const { t, c, lang } = useT();
  const r = a.result!;
  const topics = useMemo(() => Object.entries(r.byTopic).sort((x, y) => x[1].correct / x[1].total - y[1].correct / y[1].total), [r]);
  return (
    <div className="stack">
      <div className="page-head">
        <a href="#/exam" className="back-link"><Icon name="arrowLeft" size={16} /> {t('examTitle')}</a>
        <h1>{t('resultsTitle')}</h1>
        <p className="muted small">{formatDate(a.startedAt.slice(0, 10), lang, { month: 'long', day: 'numeric', year: 'numeric' })} · {t('contentVersionNote', { v: a.contentVersion })}</p>
      </div>
      <Card>
        <p className="big-line">{t('scoreLine', { c: r.correct, n: r.total, p: r.pct })}</p>
        <p className={`status status-${r.passed ? 'ok' : 'warn'}`}>{r.passed ? t('passedPractice', { p: EXAM_FORMAT.passPct }) : t('belowPractice', { p: EXAM_FORMAT.passPct })}</p>
        {r.unanswered > 0 && <p className="small">{t('unanswered')}: {r.unanswered}</p>}
        <p className="muted small">{t('notOfficialQs')}</p>
      </Card>
      <Card>
        <h2>{t('byTopic')}</h2>
        <ul className="topic-bars">
          {topics.map(([topic, v]) => (
            <li key={topic}>
              <span>{c(unitById.get(topic as TopicId)?.title ?? [topic, topic])}</span>
              <Progress value={v.correct} max={v.total} label={`${v.correct}/${v.total}`} />
              <span className="small">{v.correct}/{v.total}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2>{t('missedQuestions')}</h2>
        {r.missed.length === 0 ? <p>{t('noMissed')}</p> : r.missed.map((id) => {
          const q = questionById.get(id) as ChoiceQuestion | undefined;
          if (!q) return <p key={id} className="muted">{t('questionRemoved')}</p>;
          return <ReviewedQuestion key={id} q={q} order={a.choiceOrder[id] ?? q.choices.map((x) => x.id)} answer={a.answers[id] ?? null} />;
        })}
      </Card>
      <Card>
        <h2>{t('readinessTitle')}</h2>
        <p>{t('readinessBody')}</p>
      </Card>
      <LinkBtn href="#/exam" kind="primary">{t('examTitle')}</LinkBtn>
    </div>
  );
}
