import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { errorText } from '../../core/auth.interceptor';
import { Incident } from '../../models/models';
import { badgeClass, INCIDENT_STATUS, opts, PRIORITY } from '../../shared/labels';
import { PhotosComponent } from '../../shared/photos.component';

@Component({
  selector: 'app-admin-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, PhotosComponent],
  template: `
    <div class="page-head"><div><h1>Incidents</h1><p>Signalements des copropriétaires</p></div></div>
    <div class="tabs">
      <button *ngFor="let t of tabs" [class.active]="filter === t.key" (click)="filter = t.key">{{ t.label }} ({{ count(t.key) }})</button>
    </div>
    <div class="alert alert--error" *ngIf="error && !sel">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>

    <div class="grid" *ngIf="!loading">
      <div class="card inc" *ngFor="let i of visible">
        <div class="inc__head">
          <strong>{{ i.title }}</strong>
          <span><span [class]="badge(i.priority)">{{ prio[i.priority] }}</span> <span [class]="badge(i.status)">{{ st[i.status] }}</span></span>
        </div>
        <p *ngIf="i.description">{{ i.description }}</p>
        <small>📍 {{ i.location || 'Lieu non précisé' }} · par {{ i.reporterName }} · {{ i.createdAt | date:'dd/MM/yyyy HH:mm' }}</small>
        <p class="comment" *ngIf="i.adminComment">💬 {{ i.adminComment }}</p>
        <app-photos [incidentId]="i.id" [canAdd]="true" />
        <div class="acts"><button class="btn btn--sm" (click)="open(i)">Traiter</button><button class="btn btn--sm btn--danger" (click)="remove(i)">Supprimer</button></div>
      </div>
      <div class="card empty" *ngIf="!visible.length">Aucun incident.</div>
    </div>

    <div class="modal-bg" *ngIf="sel" (click)="sel = null">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()">
        <h2>{{ sel.title }}</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="row">
          <div class="field"><label>Statut</label><select name="s" [(ngModel)]="form.status"><option *ngFor="let o of statusOpts" [value]="o.value">{{ o.label }}</option></select></div>
          <div class="field"><label>Priorité</label><select name="p" [(ngModel)]="form.priority"><option *ngFor="let o of prioOpts" [value]="o.value">{{ o.label }}</option></select></div>
        </div>
        <div class="field"><label>Commentaire pour le copropriétaire</label><textarea name="c" rows="3" maxlength="1000" [(ngModel)]="form.adminComment"></textarea></div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="sel = null">Annuler</button>
          <button type="submit" class="btn" [disabled]="busy">Enregistrer</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.inc__head { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; } .inc p { margin: 8px 0; } .comment { background: #f3f5f9; padding: 8px 12px; border-radius: 8px; }
    .acts { display: flex; gap: 8px; margin-top: 10px; }`],
})
export class AdminIncidentsPage implements OnInit {
  tabs = [{ key: 'ALL', label: 'Tous' }, { key: 'OPEN', label: 'Ouverts' }, { key: 'IN_PROGRESS', label: 'En cours' }, { key: 'RESOLVED', label: 'Résolus' }];
  statusOpts = opts.INCIDENT_STATUS;
  prioOpts = opts.PRIORITY;
  st = INCIDENT_STATUS;
  prio = PRIORITY;
  filter = 'ALL';
  items: Incident[] = [];
  loading = false;
  busy = false;
  error = '';
  sel: Incident | null = null;
  form = { status: 'OPEN', priority: 'MEDIUM', adminComment: '' };

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  badge = (v: string) => badgeClass(v);
  count = (k: string) => (k === 'ALL' ? this.items.length : this.items.filter((i) => i.status === k).length);
  get visible(): Incident[] { return this.filter === 'ALL' ? this.items : this.items.filter((i) => i.status === this.filter); }

  load(): void {
    this.loading = true;
    this.api.get<Incident[]>('/admin/incidents').pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.items = r), error: (e) => (this.error = errorText(e)) });
  }

  open(i: Incident): void { this.sel = i; this.error = ''; this.form = { status: i.status, priority: i.priority, adminComment: i.adminComment ?? '' }; }

  save(): void {
    if (!this.sel || this.busy) return;
    this.busy = true;
    this.api.put<Incident>(`/admin/incidents/${this.sel.id}`, this.form).pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => { this.sel = null; this.load(); }, error: (e) => (this.error = errorText(e)),
    });
  }

  remove(i: Incident): void {
    if (!confirm('Supprimer cet incident ?')) return;
    this.api.delete(`/admin/incidents/${i.id}`).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e)) });
  }
}
