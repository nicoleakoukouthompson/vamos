import { lessonById, lessonOrder, units } from '../content';
import { topicMastery } from '../core/mastery';
import { useT } from '../i18n/useT';
import { useProfile } from '../store/store';
import { Icon } from '../ui/icons';

export function Learn() {
  const p = useProfile();
  const { t, c } = useT();
  const nextId = p.lessonSession?.lessonId ?? lessonOrder.find((id) => !p.completedLessons[id]);
  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('learnTitle')}</h1>
        <p className="lead">{t('learnIntro')}</p>
      </div>
      <ol className="path">
        {units.map((u, ui) => {
          const m = topicMastery(u.id, p.review);
          return (
            <li key={u.id} className="path-unit">
              <div className="unit-head">
                <span className="unit-num" aria-hidden="true">{ui + 1}</span>
                <div>
                  <h2>{c(u.title)}</h2>
                  <p className="muted small">{c(u.summary)}</p>
                </div>
                <span className={`level-pill level-${m.level}`}>{t(`level_${m.level}` as const)}</span>
              </div>
              <ul className="lesson-list">
                {u.lessons.map((id) => {
                  const l = lessonById.get(id)!;
                  const done = !!p.completedLessons[id];
                  const inProgress = p.lessonSession?.lessonId === id;
                  const isNext = !done && id === nextId;
                  const status = done ? t('lessonDone') : inProgress ? t('lessonInProgress') : isNext ? t('lessonNext') : '';
                  return (
                    <li key={id}>
                      <a href={`#/lesson/${id}`} className={`lesson-link${done ? ' is-done' : ''}${isNext || inProgress ? ' is-next' : ''}`}>
                        <span className="lesson-dot" aria-hidden="true">{done ? <Icon name="check" size={16} /> : null}</span>
                        <span className="lesson-title">{c(l.title)}</span>
                        <span className="lesson-meta muted small">{t('lessonMinutes', { n: l.minutes })} · {t('questionsCount', { n: l.questionIds.length })}</span>
                        {status && <span className="lesson-status small">{status}</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
