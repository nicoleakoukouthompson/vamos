import { createContext, useContext } from 'react';
import { S, type StringKey } from './strings';
import type { Lang, T } from '../content/types';

export type Vars = Record<string, string | number>;

export function translate(lang: Lang, key: StringKey, vars?: Vars): string {
  const entry = S[key];
  let s: string = entry ? entry[lang === 'es' ? 1 : 0] : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export const LangContext = createContext<Lang>('en');

export function useLang(): Lang {
  return useContext(LangContext);
}

/** Returns t(key, vars) for UI strings and c(tuple) for content text. */
export function useT() {
  const lang = useLang();
  return {
    lang,
    t: (key: StringKey, vars?: Vars) => translate(lang, key, vars),
    c: (text: T | undefined) => (text ? text[lang === 'es' ? 1 : 0] : ''),
  };
}
