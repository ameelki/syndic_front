import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { errorText } from '../../core/auth.interceptor';
import { environment } from '../../../environments/environment';
import { AgencyRow } from '../../models/models';

interface AgencyForm {
  name: string; slug: string; tagline: string; logoUrl: string; primaryColor: string; accentColor: string; active: boolean;
  adminFirstName: string; adminLastName: string; adminEmail: string; adminPassword: string;
}
const EMPTY: AgencyForm = {
  name: '', slug: '', tagline: '', logoUrl: '', primaryColor: '#1f2b33', accentColor: '#f0b429', active: true,
  adminFirstName: '', adminLastName: '', adminEmail: '', adminPassword: '',
};

/** Super administrateur : liste, création et activation des agences de la plateforme. */
@Component({
  selector: 'app-agencies',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <div><h1>Agences</h1><p>Gérez les agences de syndic de la plateforme.</p></div>
      <button class="btn btn--gold" (click)="openNew()">Nouvelle agence</button>
    </div>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
    <div class="alert alert--ok" *ngIf="notice">{{ notice }}</div>
    <div class="spinner" *ngIf="!rows && !error"></div>

    <div class="table-wrap" *ngIf="rows && rows.length">
      <table class="table">
        <thead><tr><th>Agence</th><th>Adresse</th><th>Bâtiments</th><th>Copropriétaires</th><th>État</th><th>Créée le</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let a of rows">
            <td data-label="Agence"><span class="dot" [style.background]="a.primaryColor"></span><span class="dot dot--a" [style.background]="a.accentColor"></span><strong>{{ a.name }}</strong></td>
            <td data-label="Adresse"><a [href]="siteUrl(a)" target="_blank" rel="noopener">{{ siteLabel(a) }}</a></td>
            <td data-label="Bâtiments">{{ a.buildings }}</td>
            <td data-label="Copropriétaires">{{ a.owners }}</td>
            <td data-label="État"><span class="badge" [class.badge--ok]="a.active" [class.badge--danger]="!a.active">{{ a.active ? 'Active' : 'Désactivée' }}</span></td>
            <td data-label="Créée le">{{ a.createdAt | date:'dd/MM/yyyy' }}</td>
            <td class="actions-cell"><div class="actions">
              <button class="btn btn--sm btn--ghost" (click)="openEdit(a)">Modifier</button>
              <button class="btn btn--sm" [class.btn--danger]="a.active" [class.btn--ghost]="!a.active" (click)="toggle(a)">{{ a.active ? 'Désactiver' : 'Activer' }}</button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="empty" *ngIf="rows && !rows.length">Aucune agence.</p>

    <div class="modal-bg" *ngIf="show" (click)="close()">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()" #f="ngForm">
        <h2>{{ editId ? "Modifier l'agence" : 'Nouvelle agence' }}</h2>
        <div class="alert alert--error" *ngIf="formError">{{ formError }}</div>
        <div class="field"><label for="n">Nom de l'agence</label><input id="n" name="name" [(ngModel)]="form.name" (ngModelChange)="suggest()" maxlength="120" required /></div>
        <div class="field"><label for="s">Identifiant (adresse)</label><input id="s" name="slug" [(ngModel)]="form.slug" (input)="slugTouched = true" [readonly]="!!editId" maxlength="40" pattern="[a-z0-9]([a-z0-9\\-]{0,38}[a-z0-9])?" placeholder="mon-agence" required /></div>
        <div class="field"><label for="t">Phrase d'accroche (page d'accueil)</label><input id="t" name="tagline" [(ngModel)]="form.tagline" maxlength="200" /></div>
        <div class="field"><label for="l">Adresse du logo (https://…)</label><input id="l" name="logo" type="url" [(ngModel)]="form.logoUrl" maxlength="300" placeholder="https://" /></div>
        <div class="row">
          <div class="field"><label for="c1">Couleur principale</label><input id="c1" name="c1" type="color" [(ngModel)]="form.primaryColor" /></div>
          <div class="field"><label for="c2">Couleur d'accent</label><input id="c2" name="c2" type="color" [(ngModel)]="form.accentColor" /></div>
        </div>
        <div class="field field--check" *ngIf="editId"><input id="ac" name="active" type="checkbox" [(ngModel)]="form.active" /><label for="ac">Agence active</label></div>
        <ng-container *ngIf="!editId">
          <h3 class="sect">Syndic de l'agence</h3>
          <div class="row">
            <div class="field"><label for="fn">Prénom du syndic</label><input id="fn" name="fn" [(ngModel)]="form.adminFirstName" maxlength="100" required /></div>
            <div class="field"><label for="ln">Nom du syndic</label><input id="ln" name="ln" [(ngModel)]="form.adminLastName" maxlength="100" required /></div>
          </div>
          <div class="field"><label for="em">Email du syndic</label><input id="em" name="em" type="email" [(ngModel)]="form.adminEmail" autocomplete="off" required /></div>
          <div class="field"><label for="pw">Mot de passe du syndic (8 caractères min.)</label><input id="pw" name="pw" type="password" [(ngModel)]="form.adminPassword" minlength="8" maxlength="72" autocomplete="new-password" required /></div>
        </ng-container>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="close()">Annuler</button>
          <button class="btn" type="submit" [disabled]="saving || !f.valid">{{ editId ? 'Enregistrer les modifications' : "Créer l'agence" }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .dot { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 4px; vertical-align: -1px; } .dot--a { margin-right: 10px; }
    input[type=color] { width: 100%; height: 40px; padding: 3px; border-radius: 8px; cursor: pointer; }
    .sect { font-size: 16px; margin: 6px 0 12px; }
  `],
})
export class AgenciesPage implements OnInit {
  rows: AgencyRow[] | null = null;
  error = '';
  notice = '';
  show = false;
  editId: number | null = null;
  form: AgencyForm = { ...EMPTY };
  formError = '';
  saving = false;
  slugTouched = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.api.get<AgencyRow[]>('/super/agencies', undefined, true).subscribe({
      next: (r) => (this.rows = r),
      error: (e) => (this.error = errorText(e, 'Chargement impossible.')),
    });
  }

  siteUrl(a: AgencyRow): string {
    const base = environment.agencyBaseDomain;
    return base ? `https://${a.slug}.${base}` : `${location.origin}/?agence=${a.slug}`;
  }
  siteLabel(a: AgencyRow): string {
    const base = environment.agencyBaseDomain;
    return base ? `${a.slug}.${base}` : `?agence=${a.slug}`;
  }

  openNew(): void { this.editId = null; this.form = { ...EMPTY }; this.slugTouched = false; this.formError = ''; this.show = true; }
  openEdit(a: AgencyRow): void {
    this.editId = a.id; this.formError = '';
    this.form = { ...EMPTY, name: a.name, slug: a.slug, tagline: a.tagline ?? '', logoUrl: a.logoUrl ?? '',
      primaryColor: a.primaryColor ?? EMPTY.primaryColor, accentColor: a.accentColor ?? EMPTY.accentColor, active: a.active };
    this.show = true;
  }
  close(): void { this.show = false; }

  /** Propose un identifiant d'adresse à partir du nom, tant que l'utilisateur ne l'a pas modifié à la main. */
  suggest(): void {
    if (this.editId || this.slugTouched) return;
    this.form.slug = this.form.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }

  private body(): unknown {
    const f = this.form;
    return { name: f.name, slug: f.slug, tagline: f.tagline || null, logoUrl: f.logoUrl || null,
      primaryColor: f.primaryColor, accentColor: f.accentColor, active: f.active,
      adminFirstName: f.adminFirstName || null, adminLastName: f.adminLastName || null,
      adminEmail: f.adminEmail || null, adminPassword: f.adminPassword || null };
  }

  save(): void {
    if (this.saving) return;
    this.formError = ''; this.saving = true;
    const req = this.editId ? this.api.put<AgencyRow>(`/super/agencies/${this.editId}`, this.body()) : this.api.post<AgencyRow>('/super/agencies', this.body());
    req.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => { this.notice = this.editId ? 'Agence modifiée.' : 'Agence créée.'; this.show = false; this.reload(); },
      error: (e) => (this.formError = errorText(e, 'Enregistrement impossible.')),
    });
  }

  toggle(a: AgencyRow): void {
    this.notice = ''; this.error = '';
    this.api.put<AgencyRow>(`/super/agencies/${a.id}`, { name: a.name, slug: a.slug, tagline: a.tagline, logoUrl: a.logoUrl,
      primaryColor: a.primaryColor, accentColor: a.accentColor, active: !a.active }).subscribe({
      next: () => { this.notice = 'Agence modifiée.'; this.reload(); },
      error: (e) => (this.error = errorText(e, 'Modification impossible.')),
    });
  }
}
