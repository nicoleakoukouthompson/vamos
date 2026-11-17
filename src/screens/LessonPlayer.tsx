import { useEffect, useRef, useState } from 'react';
import { lessonById, lessonOrder, questionById } from '../content';
import { glossary } from '../content/sources';
import { useT } from '../i18n/useT';
import {
  addConfidence, clearLessonSession, completeLesson, patchLessonSession, recordAnswer, saveNow, startLessonSession, useProfile,
} from '../store/store';
import { Icon } from '../ui/icons';
import { Btn, Card, LinkBtn, Notice, Progress, Rating, ReadAloud, Visual } from '../ui/kit';
import { PracticeQuestion } from '../ui/QuestionCard';
import { navigate } from '../ui/router';

const STEPS = ['stepSituation', 'stepExplain', 'stepExample', 'stepPractice', 'stepTask', 'stepRecap'] as const;

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const p = useProfile();
  const { t, c } = useT();
  const lesson = lessonById.get(lessonId);
  const s = p.lessonSession?.lessonId === lessonId ? p.lessonSession : null;
  const [finished, setFinished] = useState<{ xp: number; correct: number; total: number } | null>(null);
  const [paused, setPaused] = useState(false);
  const [checkpointSeen, setCheckpointSeen] = useState<number>(-1);
  const [afterConf, setAfterConf] = useState<number | null>(null);
  const finishing = useRef(false);

  useEffect(() => {
    if (lesson && !s && !finished) startLessonSession(lesson.id, [...lesson.questionIds]);
  }, [lesson, s, finished]);

  if (!lesson) {
    return <Card><h1>{t('lessonNotFound')}</h1><LinkBtn href="#/learn" kind="primary">{t('navLearn')}</LinkBtn></Card>;
  }

  if (finished) {
    const idx = lessonOrder.indexOf(lesson.id);
    const next = lessonOrder.slice(idx + 1).find((id) => !p.completedLessons[id]);
    return (
      <div className="stack">
        <Card className="complete-card">
          <h1><Icon name="check" size={28} /> {t('lessonComplete')}</h1>
          <p className="big-line">{c(lesson.title)}</p>
          <p>{t('lessonScore', { c: finished.correct, n: finished.total })}</p>
          <p className="xp-line" role="status">{finished.xp > 0 ? t('xpEarned', { n: finished.xp }) : t('xpAlready')}</p>
          <div className="row wrap">
            {next && <LinkBtn href={`#/lesson/${next}`} kind="primary" icon="arrowRight">{t('nextLesson')}</LinkBtn>}
            <LinkBtn href="#/today">{t('backToToday')}</LinkBtn>
          </div>
        </Card>
      </div>
    );
  }

  if (!s) return <p>{t('loading')}</p>;

  if (paused) {
    return (
      <Card>
        <h1>{c(lesson.title)}</h1>
        <Notice kind="ok">{t('pausedNote')}</Notice>
        <div className="row wrap">
          <Btn kind="primary" onClick={() => setPaused(false)}>{t('continue')}</Btn>
          <LinkBtn href="#/today">{t('backToToday')}</LinkBtn>
        </div>
      </Card>
    );
  }

  const step = s.step;
  const go = (n: number) => patchLessonSession({ step: n });
  const firstTry = lesson.questionIds.filter((id) => s.answers[id]?.result === 'correct' || s.answers[id]?.result === 'unsure');
  // "First try" counts only answers recorded before any re-queue for that question.
  const qTotal = s.queue.length;

  const finish = () => {
    if (finishing.current) return;
    finishing.current = true;
    if (afterConf) addConfidence({ when: 'after', level: afterConf });
    const correct = firstTry.length;
    const xp = completeLesson(lesson.id, correct, lesson.questionIds.length);
    setFinished({ xp, correct, total: lesson.questionIds.length });
  };

  const header = (
    <div className="lesson-head">
      <div className="row between wrap">
        <a href="#/learn" className="back-link"><Icon name="arrowLeft" size={16} /> {t('navLearn')}</a>
        <Btn small kind="ghost" icon="check" onClick={() => { saveNow(); setPaused(true); }}>{t('pauseLesson')}</Btn>
      </div>
      <h1>{c(lesson.title)}</h1>
      <Progress value={Math.min(step, STEPS.length)} max={STEPS.length} label={t('lessonProgress')} />
      <ol className="stepper" aria-label={t('lessonProgress')}>
        {STEPS.map((k, i) => (
          <li key={k} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>{t(k)}</li>
        ))}
      </ol>
    </div>
  );

  // Step 0: situation (+ optional confidence check before starting)
  if (step === 0) {
    return (
      <div className="stack">
        {header}
        <Card>
          <h2>{t('stepSituation')}</h2>
          <p className="lead">{c(lesson.situation)}</p>
          <ReadAloud texts={[c(lesson.title), c(lesson.situation)]} />
          <Rating value={s.confidenceBefore} onChange={(n) => patchLessonSession({ confidenceBefore: n })} legend={t('howDoYouFeel')} />
          <p className="muted small">{t('confidenceNote')}</p>
          <div className="row wrap">
            <Btn kind="primary" icon="arrowRight" onClick={() => {
              if (s.confidenceBefore) addConfidence({ when: 'before', level: s.confidenceBefore });
              go(1);
            }}>{t('next')}</Btn>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 1) {
    const terms = glossary.filter((g) => lesson.explain.some((e) => e[0].toLowerCase().includes(g.en.toLowerCase())));
    return (
      <div className="stack">
        {header}
        <Card>
          <h2>{t('stepExplain')}</h2>
          {lesson.explain.map((e, i) => <p key={i}>{c(e)}</p>)}
          <Visual spec={lesson.visual} reveal />
          {lesson.visualCaption && <p className="muted small">{c(lesson.visualCaption)}</p>}
          {terms.length > 0 && (
            <details className="terms">
              <summary>{t('keyTerms')}</summary>
              <dl>{terms.map((g) => <div key={g.id}><dt><span lang="en">{g.en}</span> / <span lang="es">{g.es}</span></dt><dd>{c(g.def)}</dd></div>)}</dl>
            </details>
          )}
          <ReadAloud texts={lesson.explain.map(c)} />
          <div className="row wrap"><Btn onClick={() => go(0)} icon="arrowLeft">{t('back')}</Btn><Btn kind="primary" icon="arrowRight" onClick={() => go(2)}>{t('next')}</Btn></div>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="stack">
        {header}
        <Card>
          <h2>{t('stepExample')}</h2>
          <p className="lead">{c(lesson.example.setup)}</p>
          <details className="reveal-box">
            <summary>{t('showReasoning')}</summary>
            <p>{c(lesson.example.reasoning)}</p>
          </details>
          <p className="muted small">{t('thinkFirst')}</p>
          <ReadAloud texts={[c(lesson.example.setup), c(lesson.example.reasoning)]} />
          <div className="row wrap"><Btn onClick={() => go(1)} icon="arrowLeft">{t('back')}</Btn><Btn kind="primary" icon="arrowRight" onClick={() => go(3)}>{t('next')}</Btn></div>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    const qid = s.queue[s.qIndex];
    const q = qid ? questionById.get(qid) : undefined;
    if (!q) { go(4); return null; }
    const isRequeue = s.qIndex >= lesson.questionIds.length;
    const prior = isRequeue ? undefined : s.answers[qid];
    const showCheckpoint = p.settings.smallerSteps && s.qIndex > 0 && s.qIndex % 3 === 0 && checkpointSeen !== s.qIndex && s.qIndex < qTotal;
    if (showCheckpoint) {
      return (
        <div className="stack">{header}
          <Card>
            <p className="lead">{t('pausedNote')}</p>
            <div className="row wrap">
              <Btn kind="primary" onClick={() => setCheckpointSeen(s.qIndex)}>{t('continue')}</Btn>
              <LinkBtn href="#/today">{t('backToToday')}</LinkBtn>
            </div>
          </Card>
        </div>
      );
    }
    return (
      <div className="stack">
        {header}
        <Card>
          <h2>{t('stepPractice')}</h2>
          <p className="muted small" aria-live="polite">{isRequeue ? t('oneMoreTime') : t('questionOf', { i: s.qIndex + 1, n: lesson.questionIds.length })}</p>
          <PracticeQuestion
            key={`${qid}-${s.qIndex}`}
            q={q}
            seedKey={`${s.startedAt}-${s.qIndex}`}
            prior={prior}
            onGraded={(result, choice, order) => {
              recordAnswer(q.id, result, 'lesson');
              const answers = isRequeue ? s.answers : { ...s.answers, [q.id]: { choice, order, result } };
              const needsRequeue = result === 'wrong' && !isRequeue && !s.requeued.includes(q.id);
              patchLessonSession({
                answers,
                queue: needsRequeue ? [...s.queue, q.id] : s.queue,
                requeued: needsRequeue ? [...s.requeued, q.id] : s.requeued,
              });
            }}
            onNext={() => {
              const nextIdx = s.qIndex + 1;
              patchLessonSession(nextIdx >= (p.lessonSession?.queue.length ?? s.queue.length) ? { qIndex: nextIdx, step: 4 } : { qIndex: nextIdx });
            }}
          />
        </Card>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="stack">
        {header}
        <Card>
          <h2>{t('stepTask')}</h2>
          <p className="lead">{c(lesson.task)}</p>
          <Notice>{t('observationNote')}</Notice>
          <ReadAloud texts={[c(lesson.task)]} />
          <div className="row wrap"><Btn kind="primary" icon="arrowRight" onClick={() => go(5)}>{t('next')}</Btn></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack">
      {header}
      <Card>
        <h2>{t('stepRecap')}</h2>
        <ul className="recap">{lesson.recap.map((r, i) => <li key={i}><Icon name="check" size={16} /> {c(r)}</li>)}</ul>
        <ReadAloud texts={lesson.recap.map(c)} />
        <Rating value={afterConf} onChange={setAfterConf} legend={t('afterFeel')} />
        <div className="row wrap">
          <Btn kind="primary" icon="check" onClick={finish}>{t('done')}</Btn>
          <Btn kind="ghost" onClick={() => { clearLessonSession(); navigate('/learn'); }}>{t('restartLesson')}</Btn>
        </div>
      </Card>
    </div>
  );
}
