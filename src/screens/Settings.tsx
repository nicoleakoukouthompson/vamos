import { useEffect, useMemo, useRef, useState } from 'react';
import { lessonById } from '../content';
import { formatDate, isISODate, isValidTimeZone } from '../core/dates';
import { buildIcs, downloadText } from '../core/ics';
import { computePlan, targetForPreset, type PlanPreset, type StudyPlanSettings } from '../core/planner';
import { dueCount } from '../core/review';
import { useT } from '../i18n/useT';
import type { StringKey } from '../i18n/strings';
import type { ProfileSettings } from '../store/schema';
import { makeBackup, parseBackup } from '../store/storage';
import {
  getState, renameProfile, replaceAll, resetData, saveNow, setDraftDirty, setLang, setPlan, setTimezone, switchProfile, todayFor, updateSettings,
  useAppState, useProfile, type ResetScope,
} from '../store/store';
import { Icon } from '../ui/icons';
import { Btn, Card, ConfirmDialog, Notice } from '../ui/kit';
import { setLeaveGuard } from '../ui/router';
import { planMessage } from './Today';

const PRESETS: PlanPreset[] = ['1m', '2m', '3m', 'custom', 'flexible'];
const TZ_OPTIONS = ['America/Chicago', 'America/New_York', 'America/Denver', 'America/Los_Angeles', 'America/Mexico_City'];

type Prefs = Pick<ProfileSettings, 'theme' | 'reducedMotion' | 'smallerSteps' | 'showStreak' | 'voiceRate'>;
interface Draft { plan: StudyPlanSettings; timezone: string; lang: 'en' | 'es'; prefs: Prefs }

function fromProfile(p: ReturnType<typeof useProfile>): Draft {
  const { theme = 'system', reducedMotion, smallerSteps, showStreak, voiceRate } = p.settings;
  return { plan: { ...p.plan, studyDays: [...p.plan.studyDays] }, timezone: p.timezone, lang: p.lang, prefs: { theme, reducedMotion, smallerSteps, showStreak, voiceRate } };
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** "Save changes" button plus an inline confirmation that is announced to screen readers. */
function SaveRow({ dirty, onSave, savedFlag, label }: { dirty: boolean; onSave: () => void; savedFlag: boolean; label?: string }) {
  const { t } = useT();
  return (
    <div className="save-row">
      <Btn kind="primary" icon="check" onClick={onSave} disabled={!dirty}>{label ?? t('saveChanges')}</Btn>
      <span className="save-feedback small" role="status" aria-live="polite">
        {dirty ? <span className="unsaved-dot">{t('unsavedChanges')}</span> : savedFlag ? <span className="saved-ok"><Icon name="check" size={16} /> {t('savedOk')}</span> : null}
      </span>
    </div>
  );
}

export function Settings() {
  const s = useAppState();
  const p = useProfile();
  const { t, lang } = useT();
  const [draft, setDraft] = useState<Draft>(() => fromProfile(p));
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(s.profileOrder.map((id) => [id, s.profiles[id].name])));
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parseBackup> | null>(null);
  const [reset, setReset] = useState<ResetScope | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const weekdays = t('weekdayShort').split(',');
  const weekdaysLong = t('weekdayLong').split(',');
  const today = todayFor(p);

  // Reload the draft when switching learner (the leave guard asks first if there are unsaved edits).
  useEffect(() => { setDraft(fromProfile(p)); setSavedAt({}); }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saved = fromProfile(p);
  const dirtyPlan = !same(draft.plan, saved.plan) || draft.timezone !== saved.timezone;
  const dirtyRem = draft.plan.reminderTime !== saved.plan.reminderTime;
  const dirtyLang = draft.lang !== saved.lang;
  const dirtyPrefs = !same(draft.prefs, saved.prefs);
  const dirtyNames = s.profileOrder.filter((id) => (names[id] ?? '').trim() !== s.profiles[id].name);
  const anyDirty = dirtyPlan || dirtyRem || dirtyLang || dirtyPrefs || dirtyNames.length > 0;

  // Header indicator and "leave without saving?" protection.
  const leaveMsg = t('leaveUnsaved');
  useEffect(() => {
    if (!anyDirty) return;
    setDraftDirty(true);
    setLeaveGuard(() => leaveMsg);
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onUnload);
    return () => { setDraftDirty(false); setLeaveGuard(null); window.removeEventListener('beforeunload', onUnload); };
  }, [anyDirty, leaveMsg]);

  const preview = useMemo(() => computePlan({
    today, settings: draft.plan, completedLessons: new Set(Object.keys(p.completedLessons)),
    dueReviewCount: dueCount(p.review, today), examsTaken: p.exams.length,
  }), [draft.plan, today, p.completedLessons, p.review, p.exams.length]);

  const flash = (key: string) => setSavedAt((x) => ({ ...x, [key]: Date.now() }));
  const confirmStored = () => { if (!saveNow()) setMsg({ kind: 'warn', text: t('saveFailed') }); };
  const savePlan = () => { setPlan({ ...draft.plan }); if (draft.timezone !== p.timezone) setTimezone(draft.timezone); confirmStored(); flash('plan'); flash('rem'); };
  const saveRem = () => { setPlan({ reminderTime: draft.plan.reminderTime }); confirmStored(); flash('rem'); };
  const saveLang = () => { setLang(draft.lang); confirmStored(); flash('lang'); };
  const savePrefs = () => { updateSettings({ ...draft.prefs }); confirmStored(); flash('prefs'); };
  const saveName = (id: string) => {
    const v = (names[id] ?? '').trim();
    if (!v) { setNames({ ...names, [id]: s.profiles[id].name }); return; }
    renameProfile(id, v); confirmStored(); flash(`name-${id}`);
  };
  const saveAll = () => {
    if (dirtyPlan) savePlan(); else if (dirtyRem) saveRem();
    if (dirtyPrefs) savePrefs();
    dirtyNames.forEach(saveName);
    if (dirtyLang) saveLang();
  };
  const discardAll = () => { setDraft(fromProfile(p)); setNames(Object.fromEntries(s.profileOrder.map((id) => [id, s.profiles[id].name]))); };
  const setDP = (patch: Partial<StudyPlanSettings>) => setDraft((d) => ({ ...d, plan: { ...d.plan, ...patch } }));
  const setPrefs = (patch: Partial<Prefs>) => setDraft((d) => ({ ...d, prefs: { ...d.prefs, ...patch } }));
  const recent = (key: string) => !!savedAt[key];

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2_000_000) { setMsg({ kind: 'warn', text: t('importErr_too_large') }); return; }
    const text = await file.text();
    const r = parseBackup(text);
    if (!r.ok) { setMsg({ kind: 'warn', text: t(`importErr_${r.error.replace(/-/g, '_')}` as StringKey) }); return; }
    setPendingImport(r);
  };

  return (
    <div className="stack settings">
      <div className="page-head">
        <h1>{t('settingsTitle')}</h1>
        <p className="lead">{t('settingsSaveIntro')}</p>
      </div>
      {msg && <Notice kind={msg.kind} onDismiss={() => setMsg(null)}>{msg.text}</Notice>}

      <Card aria-labelledby="ppl-h">
        <h2 id="ppl-h">{t('profileSection')}</h2>
        <p className="muted small">{t('learnerMenuNote')}</p>
        {s.profileOrder.map((id, i) => {
          const dirty = (names[id] ?? '').trim() !== s.profiles[id].name;
          return (
            <form key={id} className="profile-row" onSubmit={(e) => { e.preventDefault(); saveName(id); }}>
              <label className="field inline grow">
                <span>{t('learnerN', { n: i + 1 })} · {t('displayName')}</span>
                <input value={names[id] ?? ''} maxLength={40} autoComplete="off" onChange={(e) => setNames({ ...names, [id]: e.target.value })} />
              </label>
              <Btn small kind="primary" type="submit" icon="check" disabled={!dirty}>{t('saveName')}</Btn>
              {id === s.activeProfileId ? <span className="level-pill level-solid">{t('isActive')}</span> : <Btn small kind="ghost" onClick={() => switchProfile(id)}>{t('makeActive')}</Btn>}
              <span className="save-feedback small" role="status" aria-live="polite">
                {dirty ? <span className="unsaved-dot">{t('unsavedChanges')}</span> : recent(`name-${id}`) ? <span className="saved-ok"><Icon name="check" size={16} /> {t('nameSaved', { name: s.profiles[id].name })}</span> : null}
              </span>
            </form>
          );
        })}
        <label className="field">
          <span>{t('language')}</span>
          <select value={draft.lang} onChange={(e) => setDraft({ ...draft, lang: e.target.value as 'en' | 'es' })}>
            <option value="en" lang="en">English</option>
            <option value="es" lang="es">Español</option>
          </select>
        </label>
        <SaveRow dirty={dirtyLang} onSave={saveLang} savedFlag={recent('lang')} />
      </Card>

      <Card aria-labelledby="goal-h">
        <h2 id="goal-h">{t('goalSection')}</h2>
        <p className="muted small">{t('planKeepsWork')}</p>
        <fieldset className="field">
          <legend>{t('targetDate')}</legend>
          <div className="segmented wrap" role="radiogroup" aria-label={t('targetDate')}>
            {PRESETS.map((pr) => (
              <label key={pr} className={`seg-opt${draft.plan.preset === pr ? ' is-on' : ''}`}>
                <input type="radio" name="preset" checked={draft.plan.preset === pr}
                  onChange={() => setDP({ preset: pr, targetDate: pr === 'flexible' ? null : pr === 'custom' ? draft.plan.targetDate : targetForPreset(pr, today) })} />
                <span>{t(`preset_${pr}` as StringKey)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {draft.plan.preset !== 'flexible' && (
          <label className="field">
            <span>{t('targetDate')}</span>
            <input type="date" value={draft.plan.targetDate ?? ''} min={today}
              onChange={(e) => { if (isISODate(e.target.value)) setDP({ preset: 'custom', targetDate: e.target.value }); }} />
            {draft.plan.targetDate && <span className="muted small">{formatDate(draft.plan.targetDate, lang, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>}
          </label>
        )}
        <fieldset className="field">
          <legend>{t('studyDays')}</legend>
          <div className="day-picks">
            {weekdays.map((d, i) => (
              <label key={i} className={`day-pick${draft.plan.studyDays.includes(i) ? ' is-on' : ''}`}>
                <input type="checkbox" checked={draft.plan.studyDays.includes(i)} aria-label={weekdaysLong[i]}
                  onChange={() => setDP({ studyDays: draft.plan.studyDays.includes(i) ? draft.plan.studyDays.filter((x) => x !== i) : [...draft.plan.studyDays, i].sort() })} />
                <span aria-hidden="true">{d}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span>{t('minutesPerSession')}</span>
          <select value={draft.plan.minutesPerSession} onChange={(e) => setDP({ minutesPerSession: Number(e.target.value) })}>
            {[10, 15, 20, 25, 30, 45, 60].map((m) => <option key={m} value={m}>{t('minutesShort', { n: m })}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t('timezone')}</span>
          <select value={draft.timezone} onChange={(e) => { if (isValidTimeZone(e.target.value)) setDraft({ ...draft, timezone: e.target.value }); else setMsg({ kind: 'warn', text: t('timezoneInvalid') }); }}>
            {[...new Set([draft.timezone, ...TZ_OPTIONS])].map((z) => <option key={z} value={z}>{z.replace('_', ' ')}</option>)}
          </select>
        </label>
        <p className={`status status-${['needs-more-time', 'past', 'too-close', 'no-days'].includes(preview.status) ? 'warn' : 'ok'}`} role="status">
          {dirtyPlan && <strong>{t('previewLabel')} </strong>}{planMessage(t, preview)}
          {preview.todayLessons[0] && preview.status !== 'ahead' && <span className="small"> {t('nextUp', { l: lessonById.get(preview.todayLessons[0])?.title[lang === 'es' ? 1 : 0] ?? '' })}</span>}
        </p>
        <SaveRow dirty={dirtyPlan} onSave={savePlan} savedFlag={recent('plan')} label={t('savePlan')} />
      </Card>

      <Card aria-labelledby="rem-h">
        <h2 id="rem-h">{t('remindersSection')}</h2>
        <p className="small">{t('remindersHow')}</p>
        <label className="field">
          <span>{t('reminderTime')}</span>
          <input type="time" value={draft.plan.reminderTime ?? ''} onChange={(e) => setDP({ reminderTime: /^\d{2}:\d{2}$/.test(e.target.value) ? e.target.value : null })} />
        </label>
        <SaveRow dirty={dirtyRem && !dirtyPlan} onSave={saveRem} savedFlag={recent('rem')} />
        <div className="row wrap">
          <Btn icon="calendar" disabled={!p.plan.reminderTime || !p.plan.studyDays.length || dirtyRem || dirtyPlan} onClick={() => {
            if (!p.plan.reminderTime) return;
            const ics = buildIcs({
              today, studyDays: p.plan.studyDays, time: p.plan.reminderTime, minutes: p.plan.minutesPerSession,
              until: p.plan.targetDate, tz: p.timezone, uidSeed: `${p.id}-${Date.now()}`,
              title: lang === 'es' ? 'Vamos: sesión de estudio' : 'Vamos: study session',
              description: lang === 'es' ? 'Abra Vamos para su sesión de hoy. Estudie con el auto estacionado, nunca al manejar.' : 'Open Vamos for today’s session. Study while parked, never while driving.',
            });
            downloadText('vamos-study-reminders.ics', ics, 'text/calendar');
          }}>{t('downloadCalendar')}</Btn>
        </div>
        {(dirtyRem || dirtyPlan) ? <p className="muted small">{t('saveBeforeIcs')}</p> : !p.plan.reminderTime && <p className="muted small">{t('needTimeForIcs')}</p>}
      </Card>

      <Card aria-labelledby="acc-h">
        <h2 id="acc-h">{t('accessibilitySection')}</h2>
        <label className="field">
          <span>{t('appearance')}</span>
          <select value={draft.prefs.theme} onChange={(e) => setPrefs({ theme: e.target.value as Prefs['theme'] })}>
            <option value="system">{t('theme_system')}</option><option value="light">{t('theme_light')}</option><option value="dark">{t('theme_dark')}</option>
          </select>
        </label>
        <label className="field">
          <span>{t('reducedMotion')}</span>
          <select value={draft.prefs.reducedMotion} onChange={(e) => setPrefs({ reducedMotion: e.target.value as Prefs['reducedMotion'] })}>
            <option value="system">{t('rm_system')}</option><option value="on">{t('rm_on')}</option><option value="off">{t('rm_off')}</option>
          </select>
        </label>
        <label className="check-field"><input type="checkbox" checked={draft.prefs.smallerSteps} onChange={(e) => setPrefs({ smallerSteps: e.target.checked })} /><span>{t('smallerSteps')}</span></label>
        <label className="check-field"><input type="checkbox" checked={draft.prefs.showStreak} onChange={(e) => setPrefs({ showStreak: e.target.checked })} /><span>{t('showStreak')}</span></label>
        <h3>{t('voiceSection')}</h3>
        <label className="field">
          <span>{t('voiceRate')}: {draft.prefs.voiceRate.toFixed(2)}x</span>
          <input type="range" min={0.5} max={1.5} step={0.05} value={draft.prefs.voiceRate} onChange={(e) => setPrefs({ voiceRate: Number(e.target.value) })} />
        </label>
        <p className="muted small">{t('voiceNotDriving')}</p>
        <SaveRow dirty={dirtyPrefs} onSave={savePrefs} savedFlag={recent('prefs')} />
      </Card>

      <Card aria-labelledby="d-h">
        <h2 id="d-h">{t('dataSection')}</h2>
        <p>{t('dataWhere')}</p>
        <div className="row wrap">
          <Btn icon="download" onClick={() => downloadText(`vamos-backup-${today}.json`, makeBackup(getState()), 'application/json')}>{t('exportData')}</Btn>
          <Btn icon="upload" onClick={() => fileRef.current?.click()}>{t('importData')}</Btn>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <h3>{t('resetSection')}</h3>
        <div className="stack-sm">
          {(['learning', 'exams', 'road', 'profile'] as ResetScope[]).map((sc) => (
            <Btn key={sc} small kind="ghost" onClick={() => setReset(sc)}>{t(`reset_${sc}` as StringKey, { name: p.name })}</Btn>
          ))}
          <Btn small kind="danger" onClick={() => setReset('everything')}>{t('reset_everything')}</Btn>
        </div>
      </Card>

      {anyDirty && (
        <div className="save-bar" role="region" aria-label={t('unsavedChanges')}>
          <span className="save-bar-text"><span className="unsaved-dot">{t('unsavedChanges')}</span></span>
          <Btn small kind="ghost" onClick={discardAll}>{t('discardChanges')}</Btn>
          <Btn small kind="primary" icon="check" onClick={saveAll}>{t('saveAllChanges')}</Btn>
        </div>
      )}

      <ConfirmDialog open={!!pendingImport} title={t('importData')} body={t('importConfirm')} confirmLabel={t('importData')} danger
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport?.ok) {
            replaceAll(pendingImport.data);
            setNames(Object.fromEntries(pendingImport.data.profileOrder.map((id) => [id, pendingImport.data.profiles[id].name])));
            setDraft(fromProfile(pendingImport.data.profiles[pendingImport.data.activeProfileId]));
            setMsg({ kind: 'ok', text: t('importDone') });
          }
          setPendingImport(null);
        }} />
      <ConfirmDialog open={!!reset} title={t('resetConfirmTitle')} body={`${reset ? t(`reset_${reset}` as StringKey, { name: p.name }) : ''}. ${t('resetConfirmBody')}`} confirmLabel={t('confirm')} danger
        onCancel={() => setReset(null)}
        onConfirm={() => {
          if (reset) {
            resetData(reset, p.id);
            const fresh = getState();
            setNames(Object.fromEntries(fresh.profileOrder.map((id) => [id, fresh.profiles[id].name])));
            setDraft(fromProfile(fresh.profiles[fresh.activeProfileId]));
            setMsg({ kind: 'ok', text: t('resetDone') });
          }
          setReset(null);
        }} />
    </div>
  );
}
