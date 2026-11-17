import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { VisualSpec } from '../content/types';
import { useT } from '../i18n/useT';
import { Scene } from '../visuals/Scene';
import { Sign } from '../visuals/Sign';
import { Signal } from '../visuals/Signal';
import {
  getSpeechState, listenOnce, onSpeechState, pauseSpeaking, recognitionSupported, resumeSpeaking, speak, stopSpeaking, ttsSupported,
} from '../voice/speech';
import { useProfile } from '../store/store';
import { Icon } from './icons';

export function Btn({
  children, onClick, kind = 'secondary', type = 'button', disabled, icon, full, small, ...rest
}: {
  children: ReactNode; onClick?: () => void; kind?: 'primary' | 'secondary' | 'ghost' | 'danger'; type?: 'button' | 'submit';
  disabled?: boolean; icon?: Parameters<typeof Icon>[0]['name']; full?: boolean; small?: boolean; [k: string]: unknown;
}) {
  return (
    <button type={type} className={`btn btn-${kind}${full ? ' btn-full' : ''}${small ? ' btn-small' : ''}`} onClick={onClick} disabled={disabled} {...rest}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}

export function LinkBtn({ href, children, kind = 'secondary', icon, full }: { href: string; children: ReactNode; kind?: 'primary' | 'secondary' | 'ghost'; icon?: Parameters<typeof Icon>[0]['name']; full?: boolean }) {
  return (
    <a href={href} className={`btn btn-${kind}${full ? ' btn-full' : ''}`}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </a>
  );
}

export function Card({ children, className = '', as: As = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article'; [k: string]: unknown }) {
  return <As className={`card ${className}`} {...rest}>{children}</As>;
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Modal dialog using the native <dialog> element (focus containment, Escape to close). */
export function Dialog({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title: string; children?: ReactNode; actions: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      try { d.showModal(); } catch { d.setAttribute('open', ''); }
    } else if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <h2 id={titleId}>{title}</h2>
      {children}
      <div className="dialog-actions">{actions}</div>
    </dialog>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, danger }: { open: boolean; title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  const { t } = useT();
  return (
    <Dialog open={open} onClose={onCancel} title={title} actions={<>
      <Btn onClick={onCancel}>{t('cancel')}</Btn>
      <Btn kind={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Btn>
    </>}>
      <p>{body}</p>
    </Dialog>
  );
}

/** 1 to 5 self-rating as a radio group (keyboard: arrow keys). */
export function Rating({ value, onChange, legend }: { value: number | null; onChange: (n: number) => void; legend: string }) {
  const { t } = useT();
  const name = useId();
  const labels = [t('conf1'), t('conf2'), t('conf3'), t('conf4'), t('conf5')];
  return (
    <fieldset className="rating">
      <legend>{legend}</legend>
      <div className="rating-row">
        {labels.map((l, i) => (
          <label key={i} className={`rating-opt${value === i + 1 ? ' is-on' : ''}`}>
            <input type="radio" name={name} value={i + 1} checked={value === i + 1} onChange={() => onChange(i + 1)} />
            <span className="rating-num">{i + 1}</span>
            <span className="rating-label">{l}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Visual({ spec, reveal, size }: { spec?: VisualSpec; reveal?: boolean; size?: 'sm' | 'md' }) {
  if (!spec) return null;
  if (spec.type === 'sign') return <div className="visual visual-sign"><Sign id={spec.id} size={size === 'sm' ? 96 : 132} /></div>;
  if (spec.type === 'signal') return <div className="visual visual-signal"><Signal id={spec.id} size={size === 'sm' ? 70 : 92} /></div>;
  return <div className="visual"><Scene id={spec.id} reveal={reveal} size={size} /></div>;
}

export function Notice({ kind = 'info', children, onDismiss }: { kind?: 'info' | 'warn' | 'ok'; children: ReactNode; onDismiss?: () => void }) {
  const { t } = useT();
  return (
    <div className={`notice notice-${kind}`} role={kind === 'warn' ? 'alert' : 'status'}>
      <Icon name={kind === 'warn' ? 'alert' : kind === 'ok' ? 'check' : 'info'} />
      <div className="notice-body">{children}</div>
      {onDismiss && <button type="button" className="icon-btn" onClick={onDismiss} aria-label={t('dismiss')}><Icon name="x" /></button>}
    </div>
  );
}

export function useSpeechState() {
  const [s, setS] = useState(getSpeechState());
  useEffect(() => { const off = onSpeechState(setS); return () => { off(); }; }, []);
  return s;
}

/** Play / pause-resume / stop for a block of text in the current language. */
export function ReadAloud({ texts, compact }: { texts: string[]; compact?: boolean }) {
  const { t, lang } = useT();
  const p = useProfile();
  const state = useSpeechState();
  const [note, setNote] = useState<string | null>(null);
  if (!ttsSupported()) return compact ? null : <p className="muted small">{t('ttsUnsupported')}</p>;
  const start = async () => {
    setNote(null);
    const r = await speak(texts, lang, p.settings.voiceRate);
    if (!r.voiceFound) setNote(t('noVoiceForLang', { l: lang === 'es' ? t('langSpanish') : t('langEnglish') }));
  };
  return (
    <div className="read-aloud">
      {state === 'idle' && <Btn small kind="ghost" icon="speaker" onClick={start}>{t('readAloud')}</Btn>}
      {state === 'speaking' && <Btn small kind="ghost" icon="pause" onClick={pauseSpeaking}>{t('pause')}</Btn>}
      {state === 'paused' && <Btn small kind="ghost" icon="play" onClick={resumeSpeaking}>{t('resume')}</Btn>}
      {state !== 'idle' && <Btn small kind="ghost" icon="stop" onClick={stopSpeaking}>{t('stop')}</Btn>}
      {note && <span className="muted small" role="status">{note}</span>}
    </div>
  );
}

/**
 * Spoken answer: listen once, show what was heard and the interpreted answer,
 * and require confirmation before anything is graded.
 */
export function VoiceAnswer({ interpret, describe, onConfirm, disabled }: {
  interpret: (transcripts: string[]) => string | null;
  describe: (choiceId: string) => string;
  onConfirm: (choiceId: string) => void;
  disabled?: boolean;
}) {
  const { t, lang } = useT();
  const [phase, setPhase] = useState<'idle' | 'listening' | 'heard' | 'failed'>('idle');
  const [heard, setHeard] = useState('');
  const [guess, setGuess] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  if (!recognitionSupported()) return <p className="muted small">{t('speechUnsupported')}</p>;
  const listen = async () => {
    setPhase('listening'); setMsg(''); setGuess(null);
    const r = await listenOnce(lang);
    if (!r.ok) {
      setPhase('failed');
      setMsg(r.reason === 'denied' ? t('micDenied') : r.reason === 'unsupported' ? t('speechUnsupported') : t('notUnderstood'));
      return;
    }
    setHeard(r.transcripts[0] ?? '');
    const g = interpret(r.transcripts);
    setGuess(g);
    setPhase(g ? 'heard' : 'failed');
    if (!g) setMsg(t('notUnderstood'));
  };
  return (
    <div className="voice-answer" aria-live="polite">
      {phase === 'idle' && <Btn small kind="ghost" icon="mic" onClick={listen} disabled={disabled}>{t('speakAnswer')}</Btn>}
      {phase === 'listening' && <p className="small"><Icon name="mic" /> {t('listening')}</p>}
      {(phase === 'heard' || phase === 'failed') && heard && <p className="small">{t('heard', { t: heard })}</p>}
      {phase === 'heard' && guess && (
        <div className="voice-confirm">
          <p className="small">{t('interpretedAs', { a: describe(guess) })}</p>
          <div className="row">
            <Btn small kind="primary" onClick={() => { onConfirm(guess); setPhase('idle'); setHeard(''); }}>{t('useAnswer')}</Btn>
            <Btn small onClick={listen}>{t('tryAgain')}</Btn>
            <Btn small kind="ghost" onClick={() => { setPhase('idle'); setHeard(''); }}>{t('cancel')}</Btn>
          </div>
        </div>
      )}
      {phase === 'failed' && (
        <div>
          <p className="small">{msg}</p>
          <div className="row">
            <Btn small onClick={listen}>{t('tryAgain')}</Btn>
            <Btn small kind="ghost" onClick={() => { setPhase('idle'); setHeard(''); }}>{t('cancel')}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
