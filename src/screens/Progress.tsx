import { units } from '../content';
import { addDays, startOfWeek } from '../core/dates';
import { readinessSignal } from '../core/exam';
import { allMastery } from '../core/mastery';
import { totalXP } from '../core/xp';
import { useT } from '../i18n/useT';
import { addConfidence, todayFor, useProfile } from '../store/store';
import { Card, LinkBtn, Progress, Rating } from '../ui/kit';
import { useState } from 'react';

function streak(days: string[], today: string): number {
  const set = new Set(days);
  let n = 0;
  let d = set.has(today) ? today : addDays(today, -1);
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

export function ProgressScreen() {
  const p = useProfile();
  const { t, c, lang } = useT();
  const today = todayFor(p);
  const mastery = allMastery(p.review);
  const byTopic = new Map(mastery.map((m) => [m.topic, m]));
  const [rating, setRating] = useState<number | null>(null);
  const recentConf = p.confidence.slice(-5);
  const avg = recentConf.length ? (recentConf.reduce((a, x) => a + x.level, 0) / recentConf.length).toFixed(1) : null;
  const minutes = p.practiceLogs.reduce((a, l) => a + l.minutes, 0);
  const weeks = Array.from({ length: 4 }, (_, w) => {
    const start = addDays(startOfWeek(today), -7 * (3 - w));
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  });
  const toReview = mastery.filter((m) => m.attempted > 0 && m.level !== 'solid').sort((a, b) => a.share - b.share).slice(0, 4);
  const sig = readinessSignal(p.exams);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('progressTitle')}</h1>
        <p className="lead">{t('progressIntro')}</p>
      </div>

      <Card aria-labelledby="k-h">
        <h2 id="k-h">{t('knowledge')}</h2>
        <p className="muted small">{t('knowledgeHelp')}</p>
        <ul className="topic-bars">
          {units.map((u) => {
            const m = byTopic.get(u.id)!;
            return (
              <li key={u.id}>
                <span>{c(u.title)}</span>
                <Progress value={m.solid} max={m.total} label={`${c(u.title)}: ${t('solidOf', { s: m.solid, n: m.total })}`} />
                <span className="small"><span className={`level-pill level-${m.level}`}>{t(`level_${m.level}` as const)}</span> {t('solidOf', { s: m.solid, n: m.total })}</span>
              </li>
            );
          })}
        </ul>
        <h3>{t('needsReview')}</h3>
        {toReview.length ? <ul>{toReview.map((m) => <li key={m.topic}>{c(units.find((u) => u.id === m.topic)!.title)}</li>)}</ul> : <p className="muted">{t('nothingYet')}</p>}
        <h3>{t('practiceTests')}</h3>
        {p.exams.length ? <p>{sig.recentPcts.map((x) => `${x}%`).join(', ')}</p> : <p className="muted">{t('noAttempts')}</p>}
      </Card>

      <Card aria-labelledby="c-h">
        <h2 id="c-h">{t('confidence')}</h2>
        <p className="muted small">{t('confidenceHelp')}</p>
        {recentConf.length ? (
          <>
            <p>{t('latestConfidence', { n: recentConf[recentConf.length - 1].level })}</p>
            <p className="small">{t('avgConfidence', { k: recentConf.length, n: avg! })}</p>
          </>
        ) : <p className="muted">{t('noConfidence')}</p>}
        <Rating value={rating} onChange={(n) => { setRating(n); addConfidence({ when: 'checkin', level: n }); }} legend={t('checkInNow')} />
        {rating && <p className="small" role="status">{t('resetDone')}</p>}
      </Card>

      <Card aria-labelledby="e-h">
        <h2 id="e-h">{t('experience')}</h2>
        <p className="muted small">{t('experienceHelp')}</p>
        <p className="big-line">{t('totalPractice', { h: (minutes / 60).toFixed(1), n: p.practiceLogs.length })}</p>
        <LinkBtn href="#/log" icon="log">{t('navLog')}</LinkBtn>
      </Card>

      <Card aria-labelledby="w-h">
        <h2 id="w-h">{t('weeklyConsistency')}</h2>
        <div className="weeks" role="img" aria-label={`${t('weeklyConsistency')}: ${weeks.flat().filter((d) => p.activeDays.includes(d)).length}`}>
          {weeks.map((w, i) => (
            <div key={i} className="week-row">{w.map((d) => <span key={d} className={`day-cell${p.activeDays.includes(d) ? ' on' : ''}${d === today ? ' today' : ''}${d > today ? ' future' : ''}`} title={d} />)}</div>
          ))}
        </div>
        {p.settings.showStreak && <p>{t('studyStreak', { n: streak(p.activeDays, today) })}</p>}
        <p>{t('pointsTotal', { n: totalXP(p.xp) })}</p>
        <p className="muted small">{t('pointsRules')}</p>
        <span className="sr-only">{lang}</span>
      </Card>
    </div>
  );
}
