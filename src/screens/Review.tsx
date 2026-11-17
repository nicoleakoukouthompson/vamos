import { useState } from 'react';
import { questionById, units } from '../content';
import { formatDate } from '../core/dates';
import { dueCount, dueItems } from '../core/review';
import { useT } from '../i18n/useT';
import { clearReviewSession, patchReviewSession, recordAnswer, startReviewSession, todayFor, useProfile } from '../store/store';
import { Btn, Card, LinkBtn, Notice, Progress } from '../ui/kit';
import { PracticeQuestion } from '../ui/QuestionCard';

export function Review() {
  const p = useProfile();
  const { t, c, lang } = useT();
  const today = todayFor(p);
  const due = dueCount(p.review, today);
  const s = p.reviewSession;
  const [xp, setXp] = useState(0);
  const [practiceTopic, setPracticeTopic] = useState('');

  const nextDue = Object.values(p.review).filter((i) => i.box > 0 && i.due > today).map((i) => i.due).sort()[0];

  if (s) {
    const qid = s.queue[s.qIndex];
    const q = qid ? questionById.get(qid) : undefined;
    if (!q) {
      return (
        <div className="stack">
          <div className="page-head"><h1>{t('reviewTitle')}</h1></div>
          <Card>
            <Notice kind="ok">{t('reviewDone')}</Notice>
            {xp > 0 && <p className="xp-line" role="status">{t('xpEarned', { n: xp })}</p>}
            <div className="row wrap">
              <Btn kind="primary" onClick={() => { clearReviewSession(); setXp(0); }}>{t('done')}</Btn>
              <LinkBtn href="#/today">{t('backToToday')}</LinkBtn>
            </div>
          </Card>
        </div>
      );
    }
    return (
      <div className="stack">
        <div className="page-head">
          <h1>{t('reviewTitle')}</h1>
          <p className="muted small" aria-live="polite">{t('questionOf', { i: s.qIndex + 1, n: s.queue.length })}</p>
          <Progress value={s.qIndex} max={s.queue.length} label={t('questionOf', { i: s.qIndex + 1, n: s.queue.length })} />
        </div>
        <Card>
          <PracticeQuestion
            key={`${qid}-${s.qIndex}`}
            q={q}
            seedKey={`${s.startedAt}-${s.qIndex}-${p.review[qid]?.seen ?? 0}`}
            onGraded={(result) => { setXp((x) => x + recordAnswer(q.id, result, 'review')); patchReviewSession({ done: [...s.done, q.id] }); }}
            onNext={() => patchReviewSession({ qIndex: s.qIndex + 1 })}
          />
        </Card>
        <Btn kind="ghost" onClick={() => clearReviewSession()}>{t('pauseLesson')}</Btn>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('reviewTitle')}</h1>
        <p className="lead">{t('reviewIntro')}</p>
      </div>
      <Card>
        {due > 0 ? (
          <>
            <p className="big-line">{due === 1 ? t('reviewDueOne') : t('reviewDue', { n: due })}</p>
            <div className="row wrap">
              <Btn kind="primary" icon="review" onClick={() => startReviewSession(dueItems(p.review, today, 15).map((i) => i.qid))}>{t('startReview')}</Btn>
              <Btn kind="ghost" onClick={() => startReviewSession(dueItems(p.review, today, 1).map((i) => i.qid))}>{t('smallerStep')}</Btn>
            </div>
          </>
        ) : (
          <>
            <p>{Object.keys(p.review).length ? t('noReviewDue') : t('reviewEmpty')}</p>
            {nextDue && <p className="muted small">{t('reviewNextDue', { d: formatDate(nextDue, lang) })}</p>}
          </>
        )}
      </Card>
      {Object.keys(p.review).length > 0 && (
        <Card>
          <h2>{t('practiceAny')}</h2>
          <div className="row wrap">
            <label className="field inline">
              <span>{t('filterTopic')}</span>
              <select value={practiceTopic} onChange={(e) => setPracticeTopic(e.target.value)}>
                <option value="">{t('allTopics')}</option>
                {units.map((u) => <option key={u.id} value={u.id}>{c(u.title)}</option>)}
              </select>
            </label>
            <Btn onClick={() => {
              const seen = Object.values(p.review).filter((i) => !practiceTopic || questionById.get(i.qid)?.topic === practiceTopic);
              const pick = seen.sort((a, b) => a.box - b.box || (a.lastSeen < b.lastSeen ? -1 : 1)).slice(0, 8).map((i) => i.qid);
              if (pick.length) startReviewSession(pick);
            }}>{t('start')}</Btn>
          </div>
        </Card>
      )}
      <details className="card">
        <summary><strong>{t('howReviewWorks')}</strong></summary>
        <p>{t('howReviewBody')}</p>
      </details>
    </div>
  );
}
