import { useRef, useState } from 'react';
import { formatDate, isISODate, isValidTimeZone } from '../core/dates';
import { buildIcs, downloadText } from '../core/ics';
import type { PlanPreset } from '../core/planner';
import { useT } from '../i18n/useT';
import type { StringKey } from '../i18n/strings';
import { makeBackup, parseBackup } from '../store/storage';
import {
  getState, renameProfile, replaceAll, resetData, setLang, setPlan, setTimezone, switchProfile, todayFor, updateSettings, useAppState, useProfile,
  type ResetScope,
} from '../store/store';
import { Btn, Card, ConfirmDialog, Notice } from '../ui/kit';
import { usePlan, planMessage } from './Today';

const PRESETS: PlanPreset[] = ['1m', '2m', '3m', 'custom', 'flexible'];
const TZ_OPTIONS = ['America/Chicago', 'America/New_York', 'America/Denver', 'America/Los_Angeles', 'America/Mexico_City'];

export function Settings() {
  const s = useAppState();
  const p = useProfile();
  const { t, lang } = useT();
  const { plan } = usePlan(p);
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(s.profileOrder.map((id) => [id, s.profiles[id].name])));
  const [msg, setMsg] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parseBackup> | null>(null);
  const [reset, setReset] = useState<ResetScope | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const weekdays = t('weekdayShort').split(',');
  const weekdaysLong = t('weekdayLong').split(',');
  const today = todayFor(p);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2_000_000) { setMsg({ kind: 'warn', text: t('importErr_too_large') }); return; }
    const text = await file.text();
    const r = parseBackup(text);
    if (!r.ok) { setMsg({ kind: 'warn', text: t(`importErr_${r.error.replace(/-/g, '_')}` as StringKey) }); return; }
    setPendingImport(r);
  };

  return (
    <div className="stack">
      <div className="page-head"><h1>{t('settingsTitle')}</h1></div>
      {msg && <Notice kind={msg.kind} onDismiss={() => setMsg(null)}>{msg.text}</Notice>}

      <Card aria-labelledby="goal-h">
        <h2 id="goal-h">{t('goalSection')}</h2>
        <p className="muted small">{t('planKeepsWork')}</p>
        <fieldset className="field">
          <legend>{t('targetDate')}</legend>
          <div className="segmented wrap" role="radiogroup" aria-label={t('targetDate')}>
            {PRESETS.map((pr) => (
              <label key={pr} className={`seg-opt${p.plan.preset === pr ? ' is-on' : ''}`}>
                <input type="radio" name="preset" checked={p.plan.preset === pr} onChange={() => setPlan({ preset: pr })} />
                <span>{t(`preset_${pr}` as StringKey)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {p.plan.preset !== 'flexible' && (
          <label className="field">
            <span>{t('targetDate')}</span>
            <input type="date" value={p.plan.targetDate ?? ''} min={today}
              onChange={(e) => { if (isISODate(e.target.value)) setPlan({ preset: 'custom', targetDate: e.target.value }); }} />
            {p.plan.targetDate && <span className="muted small">{formatDate(p.plan.targetDate, lang, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>}
          </label>
        )}
        <fieldset className="field">
          <legend>{t('studyDays')}</legend>
          <div className="day-picks">
            {weekdays.map((d, i) => (
              <label key={i} className={`day-pick${p.plan.studyDays.includes(i) ? ' is-on' : ''}`}>
                <input type="checkbox" checked={p.plan.studyDays.includes(i)} aria-label={weekdaysLong[i]}
                  onChange={() => setPlan({ studyDays: p.plan.studyDays.includes(i) ? p.plan.studyDays.filter((x) => x !== i) : [...p.plan.studyDays, i] })} />
                <span aria-hidden="true">{d}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span>{t('minutesPerSession')}</span>
          <select value={p.plan.minutesPerSession} onChange={(e) => setPlan({ minutesPerSession: Number(e.target.value) })}>
            {[10, 15, 20, 25, 30, 45, 60].map((m) => <option key={m} value={m}>{t('minutesShort', { n: m })}</option>)}
          </select>
        </label>
        <p className={`status status-${['needs-more-time', 'past', 'too-close', 'no-days'].includes(plan.status) ? 'warn' : 'ok'}`} role="status">{planMessage(t, plan)}</p>
        <label className="field">
          <span>{t('timezone')}</span>
          <select value={p.timezone} onChange={(e) => { if (isValidTimeZone(e.target.value)) setTimezone(e.target.value); else setMsg({ kind: 'warn', text: t('timezoneInvalid') }); }}>
            {[...new Set([p.timezone, ...TZ_OPTIONS])].map((z) => <option key={z} value={z}>{z.replace('_', ' ')}</option>)}
          </select>
        </label>
      </Card>

      <Card aria-labelledby="rem-h">
        <h2 id="rem-h">{t('remindersSection')}</h2>
        <p className="small">{t('remindersHow')}</p>
        <div className="row wrap">
          <label className="field inline">
            <span>{t('reminderTime')}</span>
            <input type="time" value={p.plan.reminderTime ?? ''} onChange={(e) => setPlan({ reminderTime: /^\d{2}:\d{2}$/.test(e.target.value) ? e.target.value : null })} />
          </label>
          <Btn icon="calendar" disabled={!p.plan.reminderTime || !p.plan.studyDays.length} onClick={() => {
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
        {!p.plan.reminderTime && <p className="muted small">{t('needTimeForIcs')}</p>}
      </Card>

      <Card aria-labelledby="ppl-h">
        <h2 id="ppl-h">{t('profileSection')}</h2>
        <p className="muted small">{t('learnerMenuNote')}</p>
        {s.profileOrder.map((id) => (
          <form key={id} className="profile-row" onSubmit={(e) => { e.preventDefault(); renameProfile(id, names[id] ?? ''); setMsg({ kind: 'ok', text: t('resetDone') }); }}>
            <label className="field inline grow">
              <span>{t('displayName')}</span>
              <input value={names[id] ?? ''} maxLength={40} onChange={(e) => setNames({ ...names, [id]: e.target.value })} />
            </label>
            <Btn small type="submit">{t('rename')}</Btn>
            {id === s.activeProfileId ? <span className="level-pill level-solid">{t('isActive')}</span> : <Btn small kind="ghost" onClick={() => switchProfile(id)}>{t('makeActive')}</Btn>}
          </form>
        ))}
        <label className="field">
          <span>{t('language')}</span>
          <select value={p.lang} onChange={(e) => setLang(e.target.value as 'en' | 'es')}>
            <option value="en" lang="en">English</option>
            <option value="es" lang="es">Español</option>
          </select>
        </label>
      </Card>

      <Card aria-labelledby="acc-h">
        <h2 id="acc-h">{t('accessibilitySection')}</h2>
        <label className="field">
          <span>{t('reducedMotion')}</span>
          <select value={p.settings.reducedMotion} onChange={(e) => updateSettings({ reducedMotion: e.target.value as 'system' | 'on' | 'off' })}>
            <option value="system">{t('rm_system')}</option><option value="on">{t('rm_on')}</option><option value="off">{t('rm_off')}</option>
          </select>
        </label>
        <label className="check-field"><input type="checkbox" checked={p.settings.smallerSteps} onChange={(e) => updateSettings({ smallerSteps: e.target.checked })} /><span>{t('smallerSteps')}</span></label>
        <label className="check-field"><input type="checkbox" checked={p.settings.showStreak} onChange={(e) => updateSettings({ showStreak: e.target.checked })} /><span>{t('showStreak')}</span></label>
      </Card>

      <Card aria-labelledby="v-h">
        <h2 id="v-h">{t('voiceSection')}</h2>
        <label className="field">
          <span>{t('voiceRate')}: {p.settings.voiceRate.toFixed(2)}x</span>
          <input type="range" min={0.5} max={1.5} step={0.05} value={p.settings.voiceRate} onChange={(e) => updateSettings({ voiceRate: Number(e.target.value) })} />
        </label>
        <p className="muted small">{t('voiceNotDriving')}</p>
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

      <ConfirmDialog open={!!pendingImport} title={t('importData')} body={t('importConfirm')} confirmLabel={t('importData')} danger
        onCancel={() => setPendingImport(null)}
        onConfirm={() => { if (pendingImport?.ok) { replaceAll(pendingImport.data); setNames(Object.fromEntries(pendingImport.data.profileOrder.map((id) => [id, pendingImport.data.profiles[id].name]))); setMsg({ kind: 'ok', text: t('importDone') }); } setPendingImport(null); }} />
      <ConfirmDialog open={!!reset} title={t('resetConfirmTitle')} body={`${reset ? t(`reset_${reset}` as StringKey, { name: p.name }) : ''}. ${t('resetConfirmBody')}`} confirmLabel={t('confirm')} danger
        onCancel={() => setReset(null)}
        onConfirm={() => { if (reset) { resetData(reset, p.id); if (reset === 'everything') setNames({ p1: 'Learner 1', p2: 'Learner 2' }); setMsg({ kind: 'ok', text: t('resetDone') }); } setReset(null); }} />
    </div>
  );
}
