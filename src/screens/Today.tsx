import { useMemo } from 'react';
import { lessonById, lessonOrder, lessons } from '../content';
import { daysBetween, formatDate, startOfWeek, addDays, type ISODate } from '../core/dates';
import { computePlan, type PlanResult } from '../core/planner';
import { dueCount, dueItems } from '../core/review';
import { useT } from '../i18n/useT';
import { startReviewSession, todayFor, useProfile } from '../store/store';
import type { Profile } from '../store/schema';
import { Icon } from '../ui/icons';
import { Btn, Card, LinkBtn, Progress } from '../ui/kit';
import { navigate } from '../ui/router';

export function usePlan(p: Profile): { today: ISODate; plan: PlanResult; due: number } {
  const today = todayFor(p);
  return useMemo(() => {
    const due = dueCount(p.review, today);
    const plan = computePlan({
      today, settings: p.plan,
      completedLessons: new Set(Object.keys(p.completedLessons)),
      dueReviewCount: due,
      examsTaken: p.exams.length,
      studiedToday: false,
    });
    return { today, plan, due };
  }, [p.review, p.plan, p.completedLessons, p.exams.length, today]);
}

export function planMessage(t: ReturnType<typeof useT>['t'], plan: PlanResult): string {
  switch (plan.status) {
    case 'on-track': return t('planStatus_on_track');
    case 'ahead': return t('planStatus_ahead');
    case 'needs-more-time': return plan.extraMinutesPerSession > 0 && plan.extraMinutesPerSession <= 30
      ? t('planStatus_needs_more_time', { n: plan.extraMinutesPerSession }) : t('planStatus_needs_more_time_nomin');
    case 'past': return t('planStatus_past');
    case 'too-close': return t('planStatus_too_close');
    case 'no-days': return t('planStatus_no_days');
    default: return t('planStatus_flexible');
  }
}

export function Today() {
  const p = useProfile();
  const { t, c, lang } = useT();
  const { today, plan, due } = usePlan(p);
  const done = Object.keys(p.completedLessons).length;
  const total = lessons.length;
  const away = p.lastActive ? daysBetween(p.lastActive, today) : 0;
  const returning = away >= 3;

  const session = p.lessonSession && lessonById.get(p.lessonSession.lessonId) ? p.lessonSession : null;
  const nextLessonId = session?.lessonId ?? plan.todayLessons[0] ?? lessonOrder.find((id) => !p.completedLessons[id]);
  const nextLesson = nextLessonId ? lessonById.get(nextLessonId) : undefined;
  const reviewCap = returning ? 6 : 15;
  const reviewMinutes = Math.ceil(Math.min(due, reviewCap) * 0.5);
  const sessionMinutes = returning ? 5 : Math.min(p.plan.minutesPerSession, reviewMinutes + (nextLesson?.minutes ?? 0)) || p.plan.minutesPerSession;

  const beginReview = (cap = reviewCap) => {
    if (!p.reviewSession) startReviewSession(dueItems(p.review, today, cap).map((i) => i.qid));
    navigate('/review');
  };

  // Primary action: unfinished exam > unfinished lesson > review first if due > next lesson.
  let primary: { label: string; go: () => void; icon: 'exam' | 'learn' | 'review' } | null = null;
  if (p.activeExam) primary = { label: t('continueExam'), go: () => navigate('/exam'), icon: 'exam' };
  else if (session) primary = { label: t('continueLesson'), go: () => navigate(`/lesson/${session.lessonId}`), icon: 'learn' };
  else if (p.reviewSession) primary = { label: t('continueReview'), go: () => navigate('/review'), icon: 'review' };
  else if (due > 0) primary = { label: t('startReview'), go: () => beginReview(), icon: 'review' };
  else if (nextLesson) primary = { label: t('startLesson'), go: () => navigate(`/lesson/${nextLesson.id}`), icon: 'learn' };

  const week = startOfWeek(today);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const studiedThisWeek = weekDays.filter((d) => p.activeDays.includes(d)).length;
  const upcoming = plan.days.filter((d) => d.date >= today).slice(0, 7);
  const statusTone = ['needs-more-time', 'past', 'too-close', 'no-days'].includes(plan.status) ? 'warn' : 'ok';

  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('hello', { name: p.name })}</h1>
        {returning && <p className="lead">{t('welcomeBack')}</p>}
      </div>

      <Card className="hero-card" aria-labelledby="today-h">
        <h2 id="today-h" className="eyebrow">{t('todaySession')}</h2>
        <p className="muted">{t('todayAbout', { n: Math.max(5, sessionMinutes) })}</p>
        <ol className="session-steps">
          {due > 0 && !session && (
            <li><Icon name="review" /> <span><strong>{t('stepReview')}</strong>: {due === 1 ? t('reviewDueOne') : t('reviewDue', { n: Math.min(due, reviewCap) })}</span></li>
          )}
          {nextLesson && !returning && (
            <li><Icon name="learn" /> <span><strong>{t('stepLesson')}</strong>: {c(nextLesson.title)} <span className="muted">({t('lessonMinutes', { n: nextLesson.minutes })})</span></span></li>
          )}
          {!nextLesson && <li><Icon name="check" /> <span>{t('allLessonsDone')}</span></li>}
        </ol>
        {primary && <Btn kind="primary" full icon={primary.icon} onClick={primary.go}>{primary.label}</Btn>}
        {due > 0 && !p.reviewSession && !session && (
          <div className="smaller-step">
            <Btn small kind="ghost" onClick={() => beginReview(1)}>{t('smallerStep')}</Btn>
            <span className="muted small">{t('smallerStepHelp')}</span>
          </div>
        )}
        {due === 0 && <p className="muted small">{t('noReviewDue')}</p>}
      </Card>

      <div className="grid-2">
        <Card aria-labelledby="goal-h">
          <h2 id="goal-h" className="eyebrow">{t('goalCard')}</h2>
          {plan.daysLeft === null ? <p className="big-line">{t('flexibleGoal')}</p>
            : plan.daysLeft > 0 ? <p className="big-line">{t('daysToTest', { n: plan.daysLeft })}</p>
            : plan.daysLeft === 0 ? <p className="big-line">{t('testToday')}</p> : null}
          {p.plan.targetDate && <p className="muted small">{formatDate(p.plan.targetDate, lang, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>}
          <p className={`status status-${statusTone}`}>{planMessage(t, plan)}</p>
          <LinkBtn href="#/settings" kind="ghost" icon="settings">{t('changePlan')}</LinkBtn>
        </Card>

        <Card aria-labelledby="prog-h">
          <h2 id="prog-h" className="eyebrow">{t('thisWeek')}</h2>
          <p>{t('lessonsDone', { done, total })}</p>
          <Progress value={done} max={total} label={t('lessonsDone', { done, total })} />
          <p className="small">{t('studyDaysThisWeek', { n: studiedThisWeek })}</p>
          <ul className="week-dots" aria-label={t('studyDaysThisWeek', { n: studiedThisWeek })}>
            {weekDays.map((d) => (
              <li key={d} className={`${p.activeDays.includes(d) ? 'on' : ''}${d === today ? ' today' : ''}`}>
                <span aria-hidden="true">{formatDate(d, lang, { weekday: 'narrow' })}</span>
                <span className="sr-only">{formatDate(d, lang, { weekday: 'long' })}: {p.activeDays.includes(d) ? t('done') : '-'}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {upcoming.length > 0 && (
        <Card aria-labelledby="wk-h">
          <h2 id="wk-h" className="eyebrow">{t('weekPlan')}</h2>
          <ul className="plan-list">
            {upcoming.map((d) => (
              <li key={d.date} className={d.date === today ? 'is-today' : ''}>
                <span className="plan-date">{formatDate(d.date, lang)}</span>
                <span className="plan-what">
                  {d.lessons.length ? d.lessons.map((id) => c(lessonById.get(id)!.title)).join(' + ') : d.exam ? t('practiceTestDay') : t('reviewOnly')}
                  {d.exam && d.lessons.length ? ` + ${t('practiceTestDay')}` : ''}
                </span>
                <span className="muted small">{t('minutesShort', { n: d.minutes })}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="muted small disclaimer">{t('notGuarantee')}</p>
    </div>
  );
}
