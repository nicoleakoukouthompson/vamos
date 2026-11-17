import { useEffect, useSyncExternalStore } from 'react';
import { stopSpeaking } from '../voice/speech';

/**
 * Hash routing so every screen survives a reload on static hosting
 * (GitHub Pages has no server-side rewrites).
 */
function current(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h : '/today';
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): string {
  return useSyncExternalStore(subscribe, current, () => '/today');
}

let leaveGuard: (() => string | null) | null = null;

/** A screen with unsaved edits registers a message; leaving asks the learner first. */
export function setLeaveGuard(fn: (() => string | null) | null) {
  leaveGuard = fn;
}

/** Returns true when it is fine to leave the current screen. */
export function confirmLeave(): boolean {
  const msg = leaveGuard?.();
  if (!msg) return true;
  const ok = window.confirm(msg);
  if (ok) leaveGuard = null;
  return ok;
}

export function navigate(path: string) {
  if (!confirmLeave()) return;
  if (current() === path) return;
  window.location.hash = path;
}

export function matchRoute(path: string, pattern: string): Record<string, string> | null {
  const a = path.split('?')[0].split('/').filter(Boolean);
  const b = pattern.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < b.length; i++) {
    if (b[i].startsWith(':')) params[b[i].slice(1)] = decodeURIComponent(a[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

/** Stops speech and moves focus to the main heading on route change. */
export function useRouteEffects(route: string) {
  useEffect(() => {
    stopSpeaking();
    const h = document.querySelector<HTMLElement>('main h1');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0 });
  }, [route]);
}
