import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/auth.interceptor';
import { badgeClass } from '../shared/labels';
import { Col, CrudConfig } from './crud-configs';
import { User } from '../models/models';
import { BuildingStore } from '../core/building.store';
import { localeTag } from '../core/i18n.service';

const eur = new Intl.NumberFormat(localeTag(), { style: 'currency', currency: 'EUR' });

/** Page de liste + création/modification/suppression pilotée par une configuration. */
@Component({
  selector: 'app-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-head">
      <div><h1>{{ cfg.title }}</h1><p>{{ cfg.subtitle }}</p></div>
      <button class="btn" *ngIf="canWrite" (click)="add()">+ {{ cfg.addLabel }}</button>
    </div>

    <div class="alert alert--ok" *ngIf="success">{{ success }}</div>
    <div class="alert alert--error" *ngIf="error && !showModal">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>

    <div class="table-wrap" *ngIf="!loading && rows.length">
      <table class="table">
        <thead><tr><th *ngFor="let c of cfg.cols">{{ c.label }}</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let r of rows">
            <td *ngFor="let c of cfg.cols" [attr.data-label]="c.label">
              <ng-container [ngSwitch]="c.type">
                <span *ngSwitchCase="'enum'" [class]="badge(r[c.key])">{{ text(r, c) }}</span>
                <span *ngSwitchCase="'bool'" [class]="r[c.key] ? 'badge badge--warn' : ''">{{ r[c.key] ? 'Important' : '' }}</span>
                <a *ngSwitchCase="'url'" [href]="r[c.key]" target="_blank" rel="noopener" [hidden]="!r[c.key]">Ouvrir ↗</a>
                <span *ngSwitchDefault>{{ text(r, c) }}</span>
              </ng-container>
            </td>
            <td class="actions-cell"><div class="actions">
              <a *ngIf="cfg.rowLink" class="btn btn--sm btn--ghost" [routerLink]="[cfg.rowLink, r.id]">Ouvrir</a>
              <button class="btn btn--sm btn--ghost" (click)="edit(r)">{{ canWrite ? 'Modifier' : 'Voir' }}</button>
              <button class="btn btn--sm btn--danger" *ngIf="canWrite" (click)="askDelete(r)">Supprimer</button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card empty" *ngIf="!loading && !rows.length">Aucun élément pour le moment.</div>

    <div class="modal-bg" *ngIf="showModal" (click)="close()">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()" #f="ngForm">
        <h2>{{ editId ? (canWrite ? 'Modifier' : 'Détails') : cfg.addLabel }}</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="row">
          <ng-container *ngFor="let fd of cfg.fields">
            <div class="field" [class.field--check]="fd.type === 'checkbox'" [style.grid-column]="fd.half ? 'auto' : '1 / -1'">
              <label [for]="fd.key">{{ fd.label }}</label>
              <ng-container [ngSwitch]="fd.type">
                <textarea *ngSwitchCase="'textarea'" [id]="fd.key" [name]="fd.key" rows="4" [(ngModel)]="form[fd.key]" [required]="!!fd.required" [disabled]="!canWrite"></textarea>
                <input *ngSwitchCase="'checkbox'" type="checkbox" [id]="fd.key" [name]="fd.key" [(ngModel)]="form[fd.key]" [disabled]="!canWrite" />
                <select *ngSwitchCase="'select'" [id]="fd.key" [name]="fd.key" [(ngModel)]="form[fd.key]" [required]="!!fd.required" [disabled]="!canWrite">
                  <option *ngFor="let o of fd.options" [ngValue]="o.value">{{ o.label }}</option>
                </select>
 <select *ngSwitchCase="'building'" [id]="fd.key" [name]="fd.key" [(ngModel)]="form[fd.key]" [required]="!!fd.required" [disabled]="!canWrite">
                  <option [ngValue]="null">{{ fd.required ? '— Choisir —' : '— Général (tous les bâtiments) —' }}</option>
                  <option *ngFor="let b of store.list" [ngValue]="b.id">{{ b.name }}</option>
                </select>
                <select *ngSwitchCase="'owner'" [id]="fd.key" [name]="fd.key" [(ngModel)]="form[fd.key]" [disabled]="!canWrite">
                  <option [ngValue]="null">— Aucun —</option>
                  <option *ngFor="let o of owners" [ngValue]="o.id">{{ o.lastName }} {{ o.firstName }}</option>
                </select>
                <input *ngSwitchDefault [id]="fd.key" [name]="fd.key" [type]="fd.type === 'datetime' ? 'datetime-local' : fd.type" [attr.step]="fd.step || null" [attr.min]="fd.min || null"
                       [placeholder]="fd.placeholder || ''" [(ngModel)]="form[fd.key]" [required]="!!fd.required" [disabled]="!canWrite" />
              </ng-container>
            </div>
          </ng-container>
        </div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="close()">{{ canWrite ? 'Annuler' : 'Fermer' }}</button>
          <button type="submit" class="btn" *ngIf="canWrite" [disabled]="saving || !f.valid">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>

    <div class="modal-bg" *ngIf="toDelete" (click)="toDelete = null">
      <div class="modal" (click)="$event.stopPropagation()">
        <h2>Confirmer la suppression</h2>
        <p>Supprimer définitivement {{ cfg.itemLabel }} ?</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" (click)="toDelete = null">Non</button>
          <button class="btn btn--ok" style="background:var(--danger)" (click)="confirmDelete()" [disabled]="saving">Oui, supprimer</button>
        </div>
      </div>
    </div>
  `,
})
export class CrudPage implements OnInit {
  cfg!: CrudConfig;
  rows: any[] = [];
  owners: User[] = [];
  loading = false;
  saving = false;
  error = '';
  success = '';
  showModal = false;
  editId: number | null = null;
  form: Record<string, any> = {};
  toDelete: any = null;
  canWrite = false;

  constructor(private route: ActivatedRoute, private api: ApiService, private auth: AuthService, public store: BuildingStore) {}

  ngOnInit(): void {
    this.cfg = this.route.snapshot.data['crud'];
    this.canWrite = this.cfg.adminWrite ? this.auth.isAdmin() : true;
    if (this.cfg.needsOwners && this.auth.isAdmin()) {
      this.api.get<User[]>('/admin/users', { status: 'ACTIVE' }).subscribe({ next: (u) => (this.owners = u), error: () => {} });
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<any[]>(this.cfg.endpoint).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (r) => (this.rows = r),
      error: (e) => (this.error = errorText(e, 'Chargement impossible.')),
    });
  }

  badge = (v: string) => badgeClass(v);

  text(row: any, c: Col): string {
    const v = row[c.key];
    if (c.type === 'building' && (v === null || v === undefined)) return 'Général';
    if (v === null || v === undefined || v === '') return '';
    switch (c.type) {
      case 'money': return eur.format(Number(v));
      case 'date': return new Date(String(v).length === 10 ? v + 'T00:00:00' : v).toLocaleDateString(localeTag());
      case 'datetime': return new Date(v).toLocaleString(localeTag(), { dateStyle: 'medium', timeStyle: 'short' });
      case 'enum': return c.labels?.[v] ?? v;
      case 'building': return this.store.nameOf(v) || '—';
      case 'owner': { const o = this.owners.find((x) => x.id === v); return o ? `${o.lastName} ${o.firstName}` : '—'; }
      default: return String(v);
    }
  }

  add(): void {
    this.editId = null;
    this.form = this.cfg.defaults();
    if ('buildingId' in this.form && this.store.selectedId !== null) this.form['buildingId'] = this.store.selectedId;
    this.error = '';
    this.showModal = true;
  }

  edit(r: any): void {
    this.editId = r.id;
    this.form = { ...this.cfg.defaults(), ...r };
    for (const f of this.cfg.fields) if (f.type === 'datetime' && this.form[f.key]) this.form[f.key] = String(this.form[f.key]).slice(0, 16);
    this.error = '';
    this.showModal = true;
  }

  close(): void { if (!this.saving) this.showModal = false; }

  private payload(): Record<string, any> {
    const out: Record<string, any> = {};
    for (const f of this.cfg.fields) {
      let v = this.form[f.key];
      if (v === '' || v === undefined) v = null;
      if (f.type === 'number' && v !== null) v = Number(v);
      if (f.type === 'checkbox') v = !!v;
      out[f.key] = v;
    }
    return out;
  }

  save(): void {
    if (this.saving || !this.canWrite) return;
    this.saving = true;
    this.error = '';
    const body = this.payload();
    const req = this.editId ? this.api.put(`${this.cfg.endpoint}/${this.editId}`, body) : this.api.post(this.cfg.endpoint, body);
    req.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => { this.showModal = false; this.flash('Enregistré.'); this.load(); },
      error: (e) => (this.error = errorText(e)),
    });
  }

  askDelete(r: any): void { this.toDelete = r; }

  confirmDelete(): void {
    if (!this.toDelete || this.saving) return;
    this.saving = true;
    this.api.delete(`${this.cfg.endpoint}/${this.toDelete.id}`).pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => { this.toDelete = null; this.flash('Supprimé.'); this.load(); },
      error: (e) => { this.toDelete = null; this.error = errorText(e); },
    });
  }

  private flash(m: string): void { this.success = m; setTimeout(() => (this.success = ''), 3000); }
}
