import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Building } from '../models/models';

const KEY = 'sy_building';

/** Liste des bâtiments visibles + bâtiment sélectionné par le syndic (filtre global). */
@Injectable({ providedIn: 'root' })
export class BuildingStore {
  list: Building[] = [];
  selectedId: number | null = null;
  /** Émis quand le syndic change de bâtiment : le shell recharge la page courante. */
  changed = new Subject<void>();

  constructor(private http: HttpClient) {}

  /** Syndic : restaure le dernier choix. */
  init(): void {
    try { const v = localStorage.getItem(KEY); this.selectedId = v ? Number(v) : null; } catch { this.selectedId = null; }
  }

  /** Copropriétaire : jamais de filtre. */
  reset(): void { this.selectedId = null; }

  load(): void {
    this.http.get<Building[]>(`${environment.apiUrl}/buildings`).subscribe({
      next: (b) => {
        this.list = b;
        if (this.selectedId !== null && !b.some((x) => x.id === this.selectedId)) this.select(null);
      },
      error: () => {},
    });
  }

  select(id: number | null): void {
    this.selectedId = id;
    try { if (id === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, String(id)); } catch {}
    this.changed.next();
  }

  nameOf(id: number | null | undefined): string {
    if (id === null || id === undefined) return '';
    return this.list.find((b) => b.id === id)?.name ?? '';
  }

  get selectedName(): string { return this.nameOf(this.selectedId); }
}
