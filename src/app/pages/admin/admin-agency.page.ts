import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AgencyStore } from '../../core/agency.store';
import { errorText } from '../../core/auth.interceptor';
import { AgencyPublic } from '../../models/models';

/** Le syndic règle le nom, le logo et les couleurs que voient ses copropriétaires. */
@Component({
  selector: 'app-admin-agency',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head"><div><h1>Mon agence</h1><p>Nom, logo et couleurs affichés à vos copropriétaires.</p></div></div>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
    <div class="alert alert--ok" *ngIf="saved">Modifications enregistrées.</div>
    <div class="spinner" *ngIf="!loaded && !error"></div>

    <div class="grid grid--2" *ngIf="loaded">
      <form class="card" (ngSubmit)="save()" #f="ngForm">
        <div class="field"><label for="n">Nom de l'agence</label><input id="n" name="name" [(ngModel)]="form.name" maxlength="120" required /></div>
        <div class="field"><label for="t">Phrase d'accroche (page d'accueil)</label><input id="t" name="tagline" [(ngModel)]="form.tagline" maxlength="200" /></div>
        <div class="field"><label for="l">Adresse du logo (https://…)</label><input id="l" name="logo" type="url" [(ngModel)]="form.logoUrl" maxlength="300" placeholder="https://" /></div>
        <div class="row">
          <div class="field"><label for="c1">Couleur principale</label><div class="color"><input id="c1" name="c1" type="color" [(ngModel)]="form.primaryColor" /><code>{{ form.primaryColor }}</code></div></div>
          <div class="field"><label for="c2">Couleur d'accent</label><div class="color"><input id="c2" name="c2" type="color" [(ngModel)]="form.accentColor" /><code>{{ form.accentColor }}</code></div></div>
        </div>
        <button class="btn" type="submit" [disabled]="saving || !f.valid">{{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}</button>
      </form>

      <div class="card prev" aria-label="Aperçu">
        <h3>Aperçu</h3>
        <div class="mock" [style.background]="form.primaryColor">
          <span class="mock__brand"><img *ngIf="form.logoUrl; else mark" [src]="form.logoUrl" alt="" /><ng-template #mark><span class="sq"><i></i><i></i><i></i><i [style.background]="form.accentColor"></i></span></ng-template>{{ form.name || 'Syndic' }}</span>
          <span class="mock__btn" [style.background]="form.accentColor">Se connecter</span>
        </div>
        <p class="muted" *ngIf="form.tagline">{{ form.tagline }}</p>
        <p class="muted">Adresse de votre espace :</p>
        <code class="url">{{ url }}</code>
      </div>
    </div>
  `,
  styles: [`
    .color { display: flex; align-items: center; gap: 10px; } .color input { width: 52px; height: 38px; padding: 2px; border-radius: 8px; cursor: pointer; }
    h3 { font-size: 17px; margin-bottom: 12px; } .muted { color: var(--muted); font-size: 14px; }
    .mock { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 10px; color: #fff; font-family: var(--font-display); font-weight: 700; margin-bottom: 14px; }
    .mock__brand { display: inline-flex; align-items: center; gap: 10px; min-width: 0; } .mock__brand img { height: 26px; width: auto; max-width: 110px; object-fit: contain; }
    .sq { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; width: 22px; height: 22px; } .sq i { background: #fff; border-radius: 2px; }
    .mock__btn { padding: 6px 12px; border-radius: 7px; font-size: 13px; color: #1f2b33; font-family: var(--font-body); font-weight: 600; }
    .url { display: block; word-break: break-all; background: #eef2f2; padding: 8px 10px; border-radius: 8px; font-size: 13px; }
  `],
})
export class AdminAgencyPage implements OnInit {
  form = { name: '', tagline: '', logoUrl: '', primaryColor: '#1f2b33', accentColor: '#f0b429' };
  slug = '';
  loaded = false;
  saving = false;
  saved = false;
  error = '';

  constructor(private api: ApiService, private store: AgencyStore) {}

  get url(): string { return `${location.origin}/?agence=${this.slug}`; }

  ngOnInit(): void {
    this.api.get<AgencyPublic>('/admin/agency').subscribe({
      next: (a) => {
        this.slug = a.slug;
        this.form = { name: a.name, tagline: a.tagline ?? '', logoUrl: a.logoUrl ?? '', primaryColor: a.primaryColor ?? '#1f2b33', accentColor: a.accentColor ?? '#f0b429' };
        this.loaded = true;
      },
      error: (e) => (this.error = errorText(e, 'Chargement impossible.')),
    });
  }

  save(): void {
    if (this.saving) return;
    this.error = ''; this.saved = false; this.saving = true;
    this.api.put<AgencyPublic>('/admin/agency', {
      name: this.form.name, tagline: this.form.tagline || null, logoUrl: this.form.logoUrl || null,
      primaryColor: this.form.primaryColor, accentColor: this.form.accentColor,
    }).pipe(finalize(() => (this.saving = false))).subscribe({
      next: (a) => { this.store.apply(a); this.saved = true; },
      error: (e) => (this.error = errorText(e, 'Enregistrement impossible.')),
    });
  }
}
