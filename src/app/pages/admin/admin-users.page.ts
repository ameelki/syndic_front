import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BuildingStore } from '../../core/building.store';
import { errorText } from '../../core/auth.interceptor';
import { Lot, User, UserStatus } from '../../models/models';
import { badgeClass, USER_STATUS } from '../../shared/labels';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page-head"><div><h1>Copropriétaires</h1><p>Validez les inscriptions et rattachez chaque copropriétaire à son lot</p></div></div>
    <div class="tabs">
      <button *ngFor="let t of tabs" [class.active]="tab === t.key" (click)="setTab(t.key)">{{ t.label }} <span *ngIf="t.key === 'PENDING' && pending">({{ pending }})</span></button>
    </div>
    <div class="alert alert--ok" *ngIf="success">{{ success }}</div>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>

    <div class="table-wrap" *ngIf="!loading && users.length">
      <table class="table">
        <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Lot demandé</th><th>Lots rattachés</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let u of users">
            <td data-label="Nom"><strong>{{ u.lastName }} {{ u.firstName }}</strong><br /><small>{{ u.createdAt | date:'dd/MM/yyyy' }}</small></td>
            <td data-label="Email">{{ u.email }}</td>
            <td data-label="Téléphone">{{ u.phone || '—' }}</td>
            <td data-label="Lot demandé">{{ u.requestedLot || '—' }}</td>
            <td data-label="Lots rattachés">{{ lotsOf(u) || '—' }}</td>
            <td data-label="Statut"><span [class]="badge(u.status)">{{ labels[u.status] }}</span></td>
            <td class="actions-cell"><div class="actions">
              <button class="btn btn--sm btn--ok" *ngIf="u.status !== 'ACTIVE'" (click)="openApprove(u)">Valider</button>
              <button class="btn btn--sm btn--ghost" *ngIf="u.status === 'ACTIVE'" (click)="openApprove(u)">Rattacher un lot</button>
              <button class="btn btn--sm btn--danger" *ngIf="u.status !== 'REJECTED'" (click)="reject(u)">Refuser</button>
              <button class="btn btn--sm btn--danger" (click)="remove(u)">Supprimer</button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card empty" *ngIf="!loading && !users.length">Aucun compte dans cette catégorie.</div>

    <div class="modal-bg" *ngIf="sel" (click)="sel = null">
      <div class="modal" (click)="$event.stopPropagation()">
        <h2>{{ sel.status === 'ACTIVE' ? 'Rattacher un lot' : 'Valider l’inscription' }}</h2>
        <p><strong>{{ sel.firstName }} {{ sel.lastName }}</strong> — {{ sel.email }}<br />Lot indiqué à l'inscription : <strong>{{ sel.requestedLot || 'non précisé' }}</strong></p>
        <div class="field"><label>Lot à rattacher</label>
          <select [(ngModel)]="lotId" name="lot">
            <option [ngValue]="null">{{ sel.status === 'ACTIVE' ? '— Choisir —' : '— Aucun pour le moment —' }}</option>
            <option *ngFor="let l of freeLots" [ngValue]="l.id">{{ store.nameOf(l.buildingId) }} {{ store.nameOf(l.buildingId) ? '· ' : '' }}Lot {{ l.number }} {{ l.building ? '· ' + l.building : '' }} ({{ l.tantiemes }} tantièmes)</option>
          </select>
        </div>
        <div class="modal__actions">
          <button class="btn btn--ghost" (click)="sel = null">Annuler</button>
          <button class="btn btn--ok" (click)="confirm()" [disabled]="busy || (sel.status === 'ACTIVE' && !lotId)">{{ sel.status === 'ACTIVE' ? 'Rattacher' : 'Valider le compte' }}</button>
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersPage implements OnInit {
  tabs: { key: UserStatus | 'ALL'; label: string }[] = [
    { key: 'PENDING', label: 'En attente' }, { key: 'ACTIVE', label: 'Validés' }, { key: 'REJECTED', label: 'Refusés' },
  ];
  labels = USER_STATUS;
  tab: UserStatus | 'ALL' = 'PENDING';
  users: User[] = [];
  lots: Lot[] = [];
  pending = 0;
  loading = false;
  busy = false;
  error = '';
  success = '';
  sel: User | null = null;
  lotId: number | null = null;

  constructor(private api: ApiService, public store: BuildingStore) {}

  ngOnInit(): void { this.load(); }

  badge = (s: string) => badgeClass(s);
  setTab(t: UserStatus | 'ALL'): void { this.tab = t; this.load(); }

  get freeLots(): Lot[] { return this.lots.filter((l) => !l.ownerId); }
  lotsOf(u: User): string { return this.lots.filter((l) => l.ownerId === u.id).map((l) => l.number).join(', '); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.get<Lot[]>('/admin/lots', undefined, true).subscribe({ next: (l) => (this.lots = l), error: () => {} });
    this.api.get<User[]>('/admin/users', { status: 'PENDING' }).subscribe({ next: (p) => (this.pending = p.length), error: () => {} });
    this.api.get<User[]>('/admin/users', { status: this.tab === 'ALL' ? null : this.tab })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (u) => (this.users = u), error: (e) => (this.error = errorText(e)) });
  }

  openApprove(u: User): void { this.sel = u; this.lotId = null; }

  private run(req: ReturnType<ApiService['post']>, ok: string): void {
    this.busy = true;
    req.pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => { this.sel = null; this.success = ok; setTimeout(() => (this.success = ''), 3000); this.load(); },
      error: (e) => { this.sel = null; this.error = errorText(e); },
    });
  }

  confirm(): void {
    if (!this.sel || this.busy) return;
    if (this.sel.status === 'ACTIVE') this.run(this.api.post(`/admin/users/${this.sel.id}/assign-lot`, {}, { lotId: this.lotId! }), 'Lot rattaché.');
    else this.run(this.api.post(`/admin/users/${this.sel.id}/approve`, {}, this.lotId ? { lotId: this.lotId } : {}), 'Compte validé : le copropriétaire peut se connecter.');
  }

  reject(u: User): void {
    if (confirm(`Refuser l'accès à ${u.firstName} ${u.lastName} ?`)) this.run(this.api.post(`/admin/users/${u.id}/reject`), 'Demande refusée.');
  }

  remove(u: User): void {
    if (!confirm(`Supprimer définitivement le compte de ${u.firstName} ${u.lastName} ?`)) return;
    this.busy = true;
    this.api.delete(`/admin/users/${u.id}`).pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => { this.success = 'Compte supprimé.'; setTimeout(() => (this.success = ''), 3000); this.load(); },
      error: (e) => (this.error = errorText(e)),
    });
  }
}
