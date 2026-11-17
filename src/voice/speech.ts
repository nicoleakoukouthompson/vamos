import type { Lang } from '../content/types';

/**
 * Thin wrappers over the browser Web Speech API.
 * - Only one utterance queue plays at a time (new speech cancels old).
 * - stopSpeaking() is called on navigation and profile changes.
 * - Recognition is started only by an explicit user action and never stores audio.
 */

type SpeechState = 'idle' | 'speaking' | 'paused';
let state: SpeechState = 'idle';
const listeners = new Set<(s: SpeechState) => void>();
let token = 0;

function setState(s: SpeechState) {
  state = s;
  listeners.forEach((l) => l(s));
}

export const onSpeechState = (l: (s: SpeechState) => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const getSpeechState = () => state;

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
}

/** Voices can load asynchronously; resolve when available or after a short wait. */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, timeoutMs);
  });
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | null {
  const want = lang === 'es' ? ['es-MX', 'es-US', 'es-419', 'es'] : ['en-US', 'en'];
  for (const w of want) {
    const v = voices.find((x) => x.lang.toLowerCase().startsWith(w.toLowerCase()));
    if (v) return v;
  }
  return null;
}

export async function speak(texts: string[], lang: Lang, rate = 1): Promise<{ voiceFound: boolean }> {
  if (!ttsSupported()) return { voiceFound: false };
  stopSpeaking();
  const my = ++token;
  const voices = await loadVoices();
  if (my !== token) return { voiceFound: true };
  const voice = pickVoice(voices, lang);
  const parts = texts.map((t) => t.trim()).filter(Boolean);
  if (!parts.length) return { voiceFound: !!voice };
  setState('speaking');
  parts.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = lang === 'es' ? 'es-MX' : 'en-US';
    if (voice) u.voice = voice;
    u.rate = Math.min(2, Math.max(0.5, rate));
    if (i === parts.length - 1) {
      u.onend = () => { if (my === token) setState('idle'); };
    }
    u.onerror = () => { if (my === token) setState('idle'); };
    window.speechSynthesis.speak(u);
  });
  return { voiceFound: !!voice };
}

export function pauseSpeaking() {
  if (!ttsSupported() || state !== 'speaking') return;
  window.speechSynthesis.pause();
  setState('paused');
}

export function resumeSpeaking() {
  if (!ttsSupported() || state !== 'paused') return;
  window.speechSynthesis.resume();
  setState('speaking');
}

export function stopSpeaking() {
  token++;
  if (ttsSupported()) window.speechSynthesis.cancel();
  if (state !== 'idle') setState('idle');
}

// ---------------------------------------------------------------------------
// Recognition
// ---------------------------------------------------------------------------

type RecognitionCtor = new () => {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean;
  start(): void; abort(): void; stop(): void;
  onresult: ((e: any) => void) | null; onerror: ((e: any) => void) | null; onend: (() => void) | null;
};

function getRecognition(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as RecognitionCtor | null;
}

export const recognitionSupported = () => !!getRecognition();

export type ListenOutcome =
  | { ok: true; transcripts: string[] }
  | { ok: false; reason: 'unsupported' | 'denied' | 'no-speech' | 'error' | 'aborted' };

let active: { abort(): void } | null = null;

export function listenOnce(lang: Lang, timeoutMs = 8000): Promise<ListenOutcome> {
  const Ctor = getRecognition();
  if (!Ctor) return Promise.resolve({ ok: false, reason: 'unsupported' });
  stopSpeaking();
  cancelListening();
  return new Promise((resolve) => {
    const rec = new Ctor();
    active = rec;
    rec.lang = lang === 'es' ? 'es-MX' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    let settled = false;
    const finish = (o: ListenOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      active = null;
      resolve(o);
    };
    const timer = setTimeout(() => { try { rec.stop(); } catch { /* ignore */ } finish({ ok: false, reason: 'no-speech' }); }, timeoutMs);
    rec.onresult = (e: any) => {
      const alts: string[] = [];
      const res = e.results?.[0];
      if (res) for (let i = 0; i < res.length; i++) alts.push(String(res[i].transcript || ''));
      finish(alts.length ? { ok: true, transcripts: alts } : { ok: false, reason: 'no-speech' });
    };
    rec.onerror = (e: any) => {
      const err = e?.error;
      finish({ ok: false, reason: err === 'not-allowed' || err === 'service-not-allowed' ? 'denied' : err === 'no-speech' ? 'no-speech' : err === 'aborted' ? 'aborted' : 'error' });
    };
    rec.onend = () => finish({ ok: false, reason: 'no-speech' });
    try { rec.start(); } catch { finish({ ok: false, reason: 'error' }); }
  });
}

export function cancelListening() {
  if (active) { try { active.abort(); } catch { /* ignore */ } active = null; }
}

// ---------------------------------------------------------------------------
// Interpreting a spoken answer
// ---------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, number> = {
  one: 1, won: 1, two: 2, to: 2, too: 2, three: 3, four: 4, for: 4, five: 5,
  first: 1, second: 2, third: 3, fourth: 4,
  uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  primera: 1, primero: 1, segunda: 2, segundo: 2, tercera: 3, tercero: 3, cuarta: 4, cuarto: 4,
};
const LETTER_WORDS: Record<string, number> = {
  a: 1, ay: 1, eh: 1, b: 2, be: 2, bee: 2, c: 3, see: 3, sea: 3, ce: 3, se: 3, d: 4, de: 4, dee: 4,
};

/**
 * Map spoken text to a 1-based option position, or 'true'/'false'.
 * Accepts "B", "option two", "la segunda", "true", "verdadero", "falso".
 */
export function interpretSpoken(transcripts: string[], optionCount: number, isTrueFalse: boolean): { position: number } | { tf: 'true' | 'false' } | null {
  for (const raw of transcripts) {
    const text = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();
    if (!text) continue;
    const words = text.split(/\s+/);
    if (isTrueFalse) {
      if (words.some((w) => ['true', 'verdadero', 'cierto', 'verdad'].includes(w))) return { tf: 'true' };
      if (words.some((w) => ['false', 'falso', 'falsa'].includes(w))) return { tf: 'false' };
    }
    // Prefer explicit "option/letter/opcion X" patterns, then the last meaningful token.
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      const n = /^\d$/.test(w) ? Number(w) : NUMBER_WORDS[w] ?? (words.length <= 3 ? LETTER_WORDS[w] : undefined);
      if (n && n >= 1 && n <= optionCount) return { position: n };
    }
  }
  return null;
}
