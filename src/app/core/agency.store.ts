import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AgencyPublic } from '../models/models';

const KEY = 'sy_agency';
const RESERVED = ['www', 'app', 'api', 'admin', 'super'];

/** Marque neutre utilisée tant que l'agence n'est pas chargée (ou si le serveur ne répond pas). */
export const DEFAULT_BRAND: AgencyPublic = {
  id: 0, slug: '', name: 'Syndic', tagline: null, logoUrl: null, primaryColor: '#1f2b33', accentColor: '#f0b429',
};

function rgb(hex: string): [number, number, number] {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#1f2b33';
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
/** Luminance relative (0 = noir, 1 = blanc). */
function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Assombrit une couleur (t entre 0 et 1). */
function darken(hex: string, t: number): string {
  return '#' + rgb(hex).map((v) => Math.round(v * (1 - t)).toString(16).padStart(2, '0')).join('');
}
/** Le menu latéral a un texte blanc : la couleur principale est assombrie si elle est trop claire. */
function ensureDark(hex: string): string {
  let h = hex;
  for (let i = 0; i < 12 && luminance(h) > 0.2; i++) h = darken(h, 0.15);
  return h;
}

/**
 * Agence du site : le nom, le logo et les couleurs de l'interface viennent de l'agence.
 * L'agence est déterminée par (dans l'ordre) : ?agence=identifiant, le sous-domaine (si agencyBaseDomain est défini),
 * la dernière agence utilisée, sinon l'agence par défaut du serveur.
 */
@Injectable({ providedIn: 'root' })
export class AgencyStore {
  agency = signal<AgencyPublic>(DEFAULT_BRAND);

  constructor(private http: HttpClient) {}

  /** Identifiant à envoyer à l'API (connexion, inscription) ; null = agence par défaut. */
  get slug(): string | null { return this.agency().slug || null; }

  private requested(): string | null {
    try {
      const q = new URLSearchParams(location.search).get('agence');
      if (q && /^[a-z0-9-]{1,40}$/i.test(q)) { localStorage.setItem(KEY, q.toLowerCase()); return q.toLowerCase(); }
    } catch {}
    const base = environment.agencyBaseDomain;
    const host = location.hostname;
    if (base && host.endsWith('.' + base)) {
      const sub = host.slice(0, -(base.length + 1)).split('.')[0];
      if (sub && !RESERVED.includes(sub)) return sub;
    }
    try { return localStorage.getItem(KEY); } catch { return null; }
  }

  /** Charge l'agence puis applique son thème (appelé au démarrage de l'application). */
  load(): Promise<void> {
    const slug = this.requested();
    const get = (s: string | null) => firstValueFrom(this.http.get<AgencyPublic>(`${environment.apiUrl}/auth/agency${s ? '/' + s : ''}`));
    return get(slug)
      .catch(() => {
        if (!slug) throw new Error('agence indisponible');
        try { localStorage.removeItem(KEY); } catch {}
        return get(null); // identifiant inconnu : on retombe sur l'agence par défaut
      })
      .then((a) => this.apply(a))
      .catch(() => this.apply(DEFAULT_BRAND));
  }

  /** Applique la marque (nom, couleurs, titre de l'onglet) ; réutilisé après modification par le syndic. */
  apply(a: AgencyPublic): void {
    this.agency.set(a);
    const root = document.documentElement.style;
    const primary = ensureDark(a.primaryColor || DEFAULT_BRAND.primaryColor!);
    const accent = /^#[0-9a-f]{6}$/i.test(a.accentColor || '') ? a.accentColor! : DEFAULT_BRAND.accentColor!;
    root.setProperty('--navy', primary);
    root.setProperty('--navy-dark', darken(primary, 0.35));
    root.setProperty('--gold', accent);
    root.setProperty('--on-gold', luminance(accent) > 0.35 ? '#1f2b33' : '#ffffff');
    document.title = a.name;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', primary);
  }
}
