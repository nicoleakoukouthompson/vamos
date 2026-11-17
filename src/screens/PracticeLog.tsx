import { useState } from 'react';
import { formatDate, isISODate } from '../core/dates';
import { useT } from '../i18n/useT';
import type { PracticeLog } from '../store/schema';
import { deletePracticeLog, savePracticeLog, todayFor, useProfile } from '../store/store';
import { Btn, Card, ConfirmDialog, Dialog, Notice } from '../ui/kit';

const SKILLS: [string, string, string][] = [
  ['controls', 'Vehicle controls', 'Controles del vehículo'], ['starting', 'Starting and stopping', 'Arrancar y frenar'],
  ['steering', 'Steering', 'Dirección'], ['turns', 'Turns', 'Vueltas'], ['backing', 'Backing up', 'Reversa'],
  ['intersections', 'Intersections', 'Intersecciones'], ['lanes', 'Lane changes', 'Cambios de carril'],
  ['parking', 'Parking', 'Estacionarse'], ['hills', 'Hill parking', 'Estacionarse en cuesta'], ['traffic', 'Ordinary traffic', 'Tráfico normal'],
];
const CONDITIONS: [string, string, string][] = [
  ['day', 'Daylight', 'De día'], ['night', 'Night', 'De noche'], ['rain', 'Rain', 'Lluvia'], ['snow', 'Snow or ice', 'Nieve o hielo'],
  ['light', 'Light traffic', 'Poco tráfico'], ['heavy', 'Heavy traffic', 'Mucho tráfico'], ['lot', 'Parking lot', 'Estacionamiento'],
];

type Draft = Omit<PracticeLog, 'id'> & { id?: string };

function LogForm({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const { t, lang } = useT();
  const [f, setF] = useState<Draft>(initial);
  const [err, setErr] = useState('');
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setF({ ...f, [k]: v });
  const toggle = (k: 'skills' | 'conditions', v: string) => set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);
  const lbl = (x: [string, string, string]) => (lang === 'es' ? x[2] : x[1]);
  const conf = (k: 'confidenceBefore' | 'confidenceAfter') => (
    <label className="field"><span>{t(k === 'confidenceBefore' ? 'lg_confBefore' : 'lg_confAfter')}</span>
      <select value={f[k] ?? ''} onChange={(e) => set(k, e.target.value ? Number(e.target.value) : null)}>
        <option value="">-</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </label>
  );
  return (
    <form className="form" onSubmit={(e) => {
      e.preventDefault();
      if (!isISODate(f.date)) { setErr(t('lg_date')); return; }
      savePracticeLog({ ...f, minutes: Math.max(0, Math.min(600, Math.round(f.minutes || 0))) });
      onDone();
    }}>
      {err && <Notice kind="warn">{err}</Notice>}
      <div className="grid-2">
        <label className="field"><span>{t('lg_date')}</span><input type="date" required value={f.date} onChange={(e) => set('date', e.target.value)} /></label>
        <label className="field"><span>{t('lg_minutes')}</span><input type="number" min={0} max={600} inputMode="numeric" required value={f.minutes} onChange={(e) => set('minutes', Number(e.target.value))} /></label>
      </div>
      <label className="field"><span>{t('lg_supervisor')}</span><input maxLength={120} value={f.supervisor} onChange={(e) => set('supervisor', e.target.value)} aria-describedby="sup-help" /><span id="sup-help" className="muted small">{t('logNoTrackSupervisor')}</span></label>
      <label className="field"><span>{t('lg_area')}</span><input maxLength={120} value={f.area} onChange={(e) => set('area', e.target.value)} aria-describedby="area-help" /><span id="area-help" className="muted small">{t('lg_areaHelp')}</span></label>
      <fieldset className="field chips"><legend>{t('lg_skills')}</legend>
        {SKILLS.map((s) => <label key={s[0]} className="chip-check"><input type="checkbox" checked={f.skills.includes(s[0])} onChange={() => toggle('skills', s[0])} /><span>{lbl(s)}</span></label>)}
      </fieldset>
      <fieldset className="field chips"><legend>{t('lg_conditions')}</legend>
        {CONDITIONS.map((s) => <label key={s[0]} className="chip-check"><input type="checkbox" checked={f.conditions.includes(s[0])} onChange={() => toggle('conditions', s[0])} /><span>{lbl(s)}</span></label>)}
      </fieldset>
      <div className="grid-2">{conf('confidenceBefore')}{conf('confidenceAfter')}</div>
      <label className="field"><span>{t('lg_wentWell')}</span><textarea rows={2} maxLength={2000} value={f.wentWell} onChange={(e) => set('wentWell', e.target.value)} /></label>
      <label className="field"><span>{t('lg_tryAgain')}</span><textarea rows={2} maxLength={2000} value={f.tryAgain} onChange={(e) => set('tryAgain', e.target.value)} /></label>
      <label className="field"><span>{t('lg_nextGoal')}</span><textarea rows={2} maxLength={2000} value={f.nextGoal} onChange={(e) => set('nextGoal', e.target.value)} /></label>
      <div className="row wrap"><Btn kind="primary" type="submit">{t('save')}</Btn><Btn onClick={onDone}>{t('cancel')}</Btn></div>
    </form>
  );
}

export function skillLabel(id: string, lang: 'en' | 'es') {
  const s = [...SKILLS, ...CONDITIONS].find((x) => x[0] === id);
  return s ? (lang === 'es' ? s[2] : s[1]) : id;
}

export function PracticeLogScreen() {
  const p = useProfile();
  const { t, lang } = useT();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const minutes = p.practiceLogs.reduce((a, l) => a + l.minutes, 0);
  const blank: Draft = { date: todayFor(p), minutes: 30, supervisor: '', area: '', skills: [], conditions: [], confidenceBefore: null, confidenceAfter: null, wentWell: '', tryAgain: '', nextGoal: '' };
  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('logTitle')}</h1>
        <p className="lead">{t('logIntro')}</p>
      </div>
      <Card>
        <div className="row between wrap">
          <p className="big-line">{t('totalPractice', { h: (minutes / 60).toFixed(1), n: p.practiceLogs.length })}</p>
          <Btn kind="primary" icon="plus" onClick={() => setEditing(blank)}>{t('addLog')}</Btn>
        </div>
      </Card>
      {p.practiceLogs.length === 0 ? <Card><p>{t('noLogs')}</p></Card> : p.practiceLogs.map((l) => (
        <Card key={l.id} as="article" className="log-entry">
          <h2 className="h3">{formatDate(l.date, lang, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {t('minutesShort', { n: l.minutes })}</h2>
          <dl className="dl-grid">
            {l.supervisor && <div><dt>{t('lg_supervisor')}</dt><dd>{l.supervisor}</dd></div>}
            {l.area && <div><dt>{t('lg_area')}</dt><dd>{l.area}</dd></div>}
            {l.skills.length > 0 && <div><dt>{t('lg_skills')}</dt><dd>{l.skills.map((s) => skillLabel(s, lang)).join(', ')}</dd></div>}
            {l.conditions.length > 0 && <div><dt>{t('lg_conditions')}</dt><dd>{l.conditions.map((s) => skillLabel(s, lang)).join(', ')}</dd></div>}
            {(l.confidenceBefore || l.confidenceAfter) && <div><dt>{t('confidence')}</dt><dd>{l.confidenceBefore ?? '-'} → {l.confidenceAfter ?? '-'}</dd></div>}
            {l.wentWell && <div><dt>{t('lg_wentWell')}</dt><dd className="pre">{l.wentWell}</dd></div>}
            {l.tryAgain && <div><dt>{t('lg_tryAgain')}</dt><dd className="pre">{l.tryAgain}</dd></div>}
            {l.nextGoal && <div><dt>{t('lg_nextGoal')}</dt><dd className="pre">{l.nextGoal}</dd></div>}
          </dl>
          <div className="row wrap"><Btn small onClick={() => setEditing(l)}>{t('edit')}</Btn><Btn small kind="ghost" onClick={() => setDel(l.id)}>{t('delete')}</Btn></div>
        </Card>
      ))}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? t('edit') : t('addLog')} actions={null}>
        {editing && <LogForm key={editing.id ?? 'new'} initial={editing} onDone={() => setEditing(null)} />}
      </Dialog>
      <ConfirmDialog open={!!del} title={t('resetConfirmTitle')} body={t('deleteLogConfirm')} confirmLabel={t('delete')} danger
        onCancel={() => setDel(null)} onConfirm={() => { if (del) deletePracticeLog(del); setDel(null); }} />
    </div>
  );
}
