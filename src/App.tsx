import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { LangContext, translate, useT } from './i18n/useT';
import { getLoadStatus, getSaveFailed, setLang, switchProfile, useAppState, useProfile } from './store/store';
import { matchRoute, useRoute, useRouteEffects } from './ui/router';
import { Icon, type IconName } from './ui/icons';
import { Notice, LinkBtn } from './ui/kit';
import { stopSpeaking } from './voice/speech';
import { Today } from './screens/Today';
import { Learn } from './screens/Learn';
import { LessonPlayer } from './screens/LessonPlayer';
import { Review } from './screens/Review';
import { Exam } from './screens/Exam';
import { Road } from './screens/Road';
import { PracticeLogScreen } from './screens/PracticeLog';
import { ProgressScreen } from './screens/Progress';
import { Settings } from './screens/Settings';
import { Sources } from './screens/Sources';
import { More } from './screens/More';
import type { StringKey } from './i18n/strings';

const Scenarios = lazy(() => import('./screens/Scenarios'));

interface NavItem { path: string; key: StringKey; short?: StringKey; icon: IconName; mobile?: boolean }
export const NAV: NavItem[] = [
  { path: '/today', key: 'navToday', icon: 'today', mobile: true },
  { path: '/learn', key: 'navLearn', icon: 'learn', mobile: true },
  { path: '/review', key: 'navReview', icon: 'review', mobile: true },
  { path: '/scenarios', key: 'navScenarios', short: 'navScenariosShort', icon: 'map' },
  { path: '/exam', key: 'navExam', short: 'navExamShort', icon: 'exam', mobile: true },
  { path: '/road', key: 'navRoad', icon: 'road' },
  { path: '/log', key: 'navLog', icon: 'log' },
  { path: '/progress', key: 'navProgress', icon: 'progress' },
  { path: '/settings', key: 'navSettings', icon: 'settings' },
  { path: '/sources', key: 'navSources', icon: 'help' },
];

class Boundary extends Component<{ lang: 'en' | 'es'; children: ReactNode; resetKey: string }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.err) this.setState({ err: false }); }
  componentDidCatch(e: unknown) { console.error(e); }
  render() {
    if (!this.state.err) return this.props.children;
    const l = this.props.lang;
    return (
      <div className="card">
        <h1>{translate(l, 'errorTitle')}</h1>
        <p>{translate(l, 'errorBody')}</p>
        <LinkBtn href="#/today" kind="primary">{translate(l, 'goToday')}</LinkBtn>
      </div>
    );
  }
}

function useReducedMotion() {
  const p = useProfile();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = p.settings.reducedMotion;
  }, [p.settings.reducedMotion]);
}

function LearnerSwitcher() {
  const s = useAppState();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = s.profiles[s.activeProfileId];
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector<HTMLButtonElement>('button')?.focus(); } };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="switcher" ref={ref}>
      <button type="button" className="chip" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)} aria-label={`${t('activeLearner', { name: active.name })}. ${t('switchLearner')}`}>
        <Icon name="user" /> <span className="chip-name">{active.name}</span>
      </button>
      {open && (
        <div className="menu" role="group" aria-label={t('switchLearner')}>
          <p className="menu-title">{t('switchLearner')}</p>
          {s.profileOrder.map((id) => (
            <button key={id} type="button" className={`menu-item${id === s.activeProfileId ? ' is-active' : ''}`} aria-pressed={id === s.activeProfileId}
              onClick={() => { stopSpeaking(); switchProfile(id); setOpen(false); }}>
              <Icon name="user" /> {s.profiles[id].name}
              {id === s.activeProfileId && <span className="muted small"> ({t('isActive')})</span>}
            </button>
          ))}
          <p className="menu-note small muted"><Icon name="lock" size={14} /> {t('learnerMenuNote')}</p>
          <a className="menu-item" href="#/settings" onClick={() => setOpen(false)}><Icon name="settings" /> {t('rename')}</a>
        </div>
      )}
    </div>
  );
}

function LangToggle() {
  const { lang, t } = useT();
  return (
    <button type="button" className="chip lang-toggle" onClick={() => { stopSpeaking(); setLang(lang === 'en' ? 'es' : 'en'); }}
      aria-label={lang === 'en' ? t('switchToSpanish') : t('switchToEnglish')} lang={lang === 'en' ? 'es' : 'en'}>
      <Icon name="globe" />
      <span className={lang === 'en' ? 'lang-on' : ''} aria-hidden="true">EN</span>
      <span aria-hidden="true">/</span>
      <span className={lang === 'es' ? 'lang-on' : ''} aria-hidden="true">ES</span>
    </button>
  );
}

function Banners() {
  const { t } = useT();
  const status = getLoadStatus();
  const [hide, setHide] = useState(false);
  useAppState();
  const saveFailed = getSaveFailed();
  return (
    <>
      {status === 'unavailable' && <Notice kind="warn">{t('storageUnavailable')}</Notice>}
      {status === 'recovered-corrupt' && !hide && <Notice kind="warn" onDismiss={() => setHide(true)}>{t('storageRecovered')}</Notice>}
      {saveFailed && <Notice kind="warn">{t('saveFailed')}</Notice>}
    </>
  );
}

function Routes({ route }: { route: string }) {
  const { t } = useT();
  const m = (p: string) => matchRoute(route, p);
  let lp;
  if (m('/today') || route === '/' ) return <Today />;
  if (m('/learn')) return <Learn />;
  if ((lp = m('/lesson/:id'))) return <LessonPlayer key={lp.id} lessonId={lp.id} />;
  if (m('/review')) return <Review />;
  if (m('/scenarios')) return <Suspense fallback={<p>{t('loading')}</p>}><Scenarios /></Suspense>;
  if (m('/exam')) return <Exam />;
  if ((lp = m('/exam/:id'))) return <Exam attemptId={lp.id} />;
  if (m('/road')) return <Road />;
  if (m('/log')) return <PracticeLogScreen />;
  if (m('/progress')) return <ProgressScreen />;
  if (m('/settings')) return <Settings />;
  if (m('/sources')) return <Sources />;
  if (m('/more')) return <More />;
  return (
    <div className="card">
      <h1>{t('notFound')}</h1>
      <LinkBtn href="#/today" kind="primary">{t('goToday')}</LinkBtn>
    </div>
  );
}

export default function App() {
  const s = useAppState();
  const p = s.profiles[s.activeProfileId];
  const route = useRoute();
  useRouteEffects(route + '|' + s.activeProfileId);
  useEffect(() => { document.documentElement.lang = p.lang === 'es' ? 'es-MX' : 'en'; document.title = 'Vamos'; }, [p.lang]);
  useEffect(() => { stopSpeaking(); }, [s.activeProfileId, p.lang]);
  return (
    <LangContext.Provider value={p.lang}>
      <Shell route={route} />
    </LangContext.Provider>
  );
}

function Shell({ route }: { route: string }) {
  const { t, lang } = useT();
  const s = useAppState();
  useReducedMotion();
  const base = '/' + (route.split('/')[1] || 'today');
  const isActive = (path: string) => base === path || (path === '/learn' && base === '/lesson');
  const onMore = !NAV.filter((n) => n.mobile).some((n) => isActive(n.path));
  return (
    <div className="app">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLElement>('main h1')?.focus(); }}>{t('skipToContent')}</a>
      <header className="topbar">
        <a href="#/today" className="brand" aria-label={`${t('appName')}. ${t('navToday')}`}>
          <svg className="brand-mark" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#000" /><path d="M8 9l8 15 8-15" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="16" cy="9" r="2.4" fill="#1f5bff" /></svg>
          <span className="brand-name">Vamos</span>
        </a>
        <div className="topbar-right">
          <span className="saved-pill small" title={t('dataWhere')}><Icon name="check" size={14} /> {t('savedOnDevice')}</span>
          <LearnerSwitcher />
          <LangToggle />
        </div>
      </header>
      <div className="layout">
        <nav className="sidenav" aria-label={t('mainNav')}>
          <ul>
            {NAV.map((n) => (
              <li key={n.path}><a href={'#' + n.path} aria-current={isActive(n.path) ? 'page' : undefined}><Icon name={n.icon} /> {t(n.key)}</a></li>
            ))}
          </ul>
          <p className="sidenav-tag small muted">{t('tagline')}</p>
        </nav>
        <main id="main" lang={lang === 'es' ? 'es-MX' : 'en'}>
          <Banners />
          <Boundary lang={lang} resetKey={route + s.activeProfileId}>
            <Routes route={route} />
          </Boundary>
        </main>
      </div>
      <nav className="bottomnav" aria-label={t('mainNav')}>
        {NAV.filter((n) => n.mobile).map((n) => (
          <a key={n.path} href={'#' + n.path} aria-current={isActive(n.path) ? 'page' : undefined}><Icon name={n.icon} /><span>{t(n.short ?? n.key)}</span></a>
        ))}
        <a href="#/more" aria-current={onMore ? 'page' : undefined}><Icon name="more" /><span>{t('navMore')}</span></a>
      </nav>
    </div>
  );
}
