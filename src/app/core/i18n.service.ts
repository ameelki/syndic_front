import { Injectable } from '@angular/core';
import { DE, LB, PATTERNS_DE, PATTERNS_LB, PATTERNS_PT, PT, TOKENS_DE, TOKENS_LB, TOKENS_PT } from './i18n.dict';

export type Lang = 'fr' | 'pt' | 'lb' | 'de';
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'lb', label: 'Lëtzebuergesch' },
  { code: 'de', label: 'Deutsch' },
];

const KEY = 'sy_lang';

export function currentLang(): Lang {
  try { const v = localStorage.getItem(KEY); if (v === 'pt' || v === 'lb' || v === 'de' || v === 'fr') return v; } catch {}
  return 'fr';
}

/** Identifiant de locale Angular (pipes date / monnaie), choisi au démarrage. */
export const LOCALE_BY_LANG: Record<Lang, string> = { fr: 'fr', pt: 'pt-PT', lb: 'lb', de: 'de-LU' };
/** Balise BCP-47 pour Intl (formats dans le code TypeScript). */
export const TAG_BY_LANG: Record<Lang, string> = { fr: 'fr-FR', pt: 'pt-PT', lb: 'lb-LU', de: 'de-LU' };
export const localeTag = (): string => TAG_BY_LANG[currentLang()];

const SETS: Record<Exclude<Lang, 'fr'>, { dict: Record<string, string>; patterns: [RegExp, string][]; tokens: [RegExp, string][] }> = {
  pt: { dict: PT, patterns: PATTERNS_PT, tokens: TOKENS_PT },
  lb: { dict: LB, patterns: PATTERNS_LB, tokens: TOKENS_LB },
  de: { dict: DE, patterns: PATTERNS_DE, tokens: TOKENS_DE },
};

/**
 * Traduction de l'interface. Les textes de l'application sont écrits en français ;
 * le texte français exact sert de clé (voir i18n.dict.ts).
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  lang: Lang = currentLang();

  /** Change la langue puis recharge la page (formats de dates et de monnaie inclus). */
  set(l: Lang): void {
    try { localStorage.setItem(KEY, l); } catch {}
    location.reload();
  }

  tr(text: string): string {
    if (this.lang === 'fr' || !text) return text;
    const set = SETS[this.lang];
    const key = text.replace(/\s+/g, ' ').trim();
    const hit = set.dict[key];
    if (hit !== undefined) return hit;
    for (const [re, tpl] of set.patterns) {
      if (re.test(key)) return key.replace(re, tpl);
    }
    if (/tantièmes/i.test(key)) {
      let out = key;
      for (const [re, rep] of set.tokens) out = out.replace(re, rep);
      return out;
    }
    return key;
  }
}
