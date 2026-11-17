import { useState } from 'react';
import { ANXIETY_PLAN, PRE_TASKS, ROAD_STEPS, SCRIPTS } from '../content/road';
import { OFFICIAL_LINKS } from '../content/sources';
import { useT } from '../i18n/useT';
import type { Provider, Tri } from '../store/schema';
import { deleteProvider, saveProvider, toggleChecklist, useProfile } from '../store/store';
import { Icon } from '../ui/icons';
import { Btn, Card, ConfirmDialog, Dialog, LinkBtn } from '../ui/kit';
import type { StringKey } from '../i18n/strings';

const EMPTY: Omit<Provider, 'id'> = {
  name: '', contact: '', adultBeginners: 'unknown', spanish: 'unknown', anxiousLearners: 'unknown', dualControl: 'unknown', pickup: 'unknown',
  lessonLength: '', totalPrice: '', cancellation: '', availability: '', notes: '',
};
const TRI_FIELDS = ['adultBeginners', 'spanish', 'anxiousLearners', 'dualControl', 'pickup'] as const;
const TEXT_FIELDS = ['contact', 'lessonLength', 'totalPrice', 'availability'] as const;
const AREA_FIELDS = ['cancellation', 'notes'] as const;

function ProviderForm({ initial, onDone }: { initial: Omit<Provider, 'id'> & { id?: string }; onDone: () => void }) {
  const { t } = useT();
  const [f, setF] = useState(initial);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });
  const triLabel = (v: Tri) => (v === 'yes' ? t('yes') : v === 'no' ? t('no') : t('unknown'));
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); if (!f.name.trim()) return; saveProvider({ ...f, name: f.name.trim() }); onDone(); }}>
      <label className="field"><span>{t('pv_name')}</span><input required maxLength={120} value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
      {TEXT_FIELDS.map((k) => (
        <label key={k} className="field"><span>{t(`pv_${k}` as StringKey)}</span><input maxLength={120} value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
      ))}
      {TRI_FIELDS.map((k) => (
        <label key={k} className="field"><span>{t(`pv_${k}` as StringKey)}</span>
          <select value={f[k]} onChange={(e) => set(k, e.target.value as Tri)}>
            {(['unknown', 'yes', 'no'] as Tri[]).map((v) => <option key={v} value={v}>{triLabel(v)}</option>)}
          </select>
        </label>
      ))}
      {AREA_FIELDS.map((k) => (
        <label key={k} className="field"><span>{t(`pv_${k}` as StringKey)}</span><textarea maxLength={2000} rows={3} value={f[k]} onChange={(e) => set(k, e.target.value)} /></label>
      ))}
      <div className="row wrap"><Btn kind="primary" type="submit">{t('save')}</Btn><Btn onClick={onDone}>{t('cancel')}</Btn></div>
    </form>
  );
}

function CopyBtn({ text }: { text: string }) {
  const { t } = useT();
  const [ok, setOk] = useState(false);
  return (
    <Btn small kind="ghost" icon="copy" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); } catch { /* clipboard blocked */ }
    }}>{ok ? t('copied') : t('copy')}</Btn>
  );
}

export function Road() {
  const p = useProfile();
  const { t, c } = useT();
  const [editing, setEditing] = useState<(Omit<Provider, 'id'> & { id?: string }) | null>(null);
  const [toDelete, setToDelete] = useState<Provider | null>(null);
  const triLabel = (v: Tri) => (v === 'yes' ? t('yes') : v === 'no' ? t('no') : t('unknown'));
  const sos = OFFICIAL_LINKS.find((l) => l.id === 'sos')!;
  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('roadTitle')}</h1>
        <p className="lead">{t('roadIntro')}</p>
      </div>

      <Card>
        <h2>{t('roadStepsTitle')}</h2>
        <ol className="checklist">
          {ROAD_STEPS.map((s, i) => {
            const done = !!p.checklist[s.id];
            return (
              <li key={s.id} className={done ? 'is-done' : ''}>
                <label className="check-row">
                  <input type="checkbox" checked={done} onChange={() => toggleChecklist(s.id)} />
                  <span className="check-title"><span className="step-num">{i + 1}.</span> {c(s.title)}</span>
                </label>
                <p className="small">{c(s.body)}</p>
                {s.official && <a className="small" href={sos.url} target="_blank" rel="noopener noreferrer">{c(sos.label)}</a>}
              </li>
            );
          })}
        </ol>
      </Card>

      <Card>
        <h2>{t('observationTasks')}</h2>
        <p className="muted small">{t('observationTasksIntro')}</p>
        <ul className="checklist">
          {PRE_TASKS.map((s) => (
            <li key={s.id} className={p.checklist[s.id] ? 'is-done' : ''}>
              <label className="check-row"><input type="checkbox" checked={!!p.checklist[s.id]} onChange={() => toggleChecklist(s.id)} /><span>{c(s.text)}</span></label>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="row between wrap"><h2>{t('providersTitle')}</h2><Btn icon="plus" onClick={() => setEditing({ ...EMPTY })}>{t('addProvider')}</Btn></div>
        <p className="muted small">{t('providersIntro')}</p>
        {p.providers.length === 0 ? <p>{t('noProviders')}</p> : (
          <div className="provider-grid">
            {p.providers.map((pv) => (
              <article key={pv.id} className="provider">
                <h3>{pv.name}</h3>
                <dl>
                  {pv.contact && <><dt>{t('pv_contact')}</dt><dd>{pv.contact}</dd></>}
                  {TRI_FIELDS.map((k) => <div key={k} className="dl-row"><dt>{t(`pv_${k}` as StringKey)}</dt><dd>{triLabel(pv[k])}</dd></div>)}
                  {pv.lessonLength && <div className="dl-row"><dt>{t('pv_lessonLength')}</dt><dd>{pv.lessonLength}</dd></div>}
                  {pv.totalPrice && <div className="dl-row"><dt>{t('pv_totalPrice')}</dt><dd>{pv.totalPrice}</dd></div>}
                  {pv.availability && <div className="dl-row"><dt>{t('pv_availability')}</dt><dd>{pv.availability}</dd></div>}
                  {pv.cancellation && <div className="dl-row"><dt>{t('pv_cancellation')}</dt><dd className="pre">{pv.cancellation}</dd></div>}
                  {pv.notes && <div className="dl-row"><dt>{t('pv_notes')}</dt><dd className="pre">{pv.notes}</dd></div>}
                </dl>
                <div className="row wrap"><Btn small onClick={() => setEditing(pv)}>{t('edit')}</Btn><Btn small kind="ghost" onClick={() => setToDelete(pv)}>{t('delete')}</Btn></div>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2>{t('scriptsTitle')}</h2>
        {SCRIPTS.map((s) => (
          <details key={s.id} className="script">
            <summary>{c(s.title)}</summary>
            <div className="grid-2">
              <div lang="en"><h3>English</h3><pre className="script-text">{s.en}</pre><CopyBtn text={s.en} /></div>
              <div lang="es"><h3>Español</h3><pre className="script-text">{s.es}</pre><CopyBtn text={s.es} /></div>
            </div>
          </details>
        ))}
      </Card>

      <Card>
        <h2>{t('anxietyTitle')}</h2>
        <ul className="recap">{ANXIETY_PLAN.map((a, i) => <li key={i}><Icon name="check" size={16} /> {c(a)}</li>)}</ul>
        <p className="muted small">{t('anxietyNote')}</p>
      </Card>

      <LinkBtn href="#/log" icon="log">{t('navLog')}</LinkBtn>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? t('edit') : t('addProvider')} actions={null}>
        {editing && <ProviderForm key={editing.id ?? 'new'} initial={editing} onDone={() => setEditing(null)} />}
      </Dialog>
      <ConfirmDialog open={!!toDelete} title={t('resetConfirmTitle')} body={t('deleteProviderConfirm', { n: toDelete?.name ?? '' })} confirmLabel={t('delete')} danger
        onCancel={() => setToDelete(null)} onConfirm={() => { if (toDelete) deleteProvider(toDelete.id); setToDelete(null); }} />
    </div>
  );
}
