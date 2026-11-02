import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/auth.interceptor';
import { Reservation } from '../models/models';

const STATUS: Record<string, string> = { PENDING: 'En attente', APPROVED: 'Validée', REFUSED: 'Refusée' };
const CLS: Record<string, string> = { PENDING: 'badge badge--warn', APPROVED: 'badge badge--ok', REFUSED: 'badge badge--danger' };

/** Réservation des espaces communs : le copropriétaire demande, le syndic valide. */
@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <div><h1>Réservations</h1><p>{{ admin ? 'Demandes de réservation des espaces communs' : 'Réservez la salle commune, le local vélos…' }}</p></div>
      <button class="btn" *ngIf="!admin" (click)="showNew = true">+ Nouvelle réservation</button>
    </div>
    <div class="alert alert--ok" *ngIf="success">{{ success }}</div>
    <div class="alert alert--error" *ngIf="error && !showNew">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>

    <div class="grid" *ngIf="!loading">
      <div class="card" *ngFor="let r of items">
        <div class="head">
          <strong>{{ r.space }}</strong><span [class]="cls[r.status]">{{ st[r.status] }}</span>
        </div>
        <p>📅 {{ r.date | date:'EEEE d MMMM y' }} · {{ r.startTime.slice(0,5) }} – {{ r.endTime.slice(0,5) }}<span *ngIf="admin"> · 👤 {{ r.ownerName }}</span></p>
        <p *ngIf="r.note" class="note">{{ r.note }}</p>
        <div class="actions">
          <ng-container *ngIf="admin">
            <button class="btn btn--ok btn--sm" *ngIf="r.status !== 'APPROVED'" (click)="setStatus(r, 'APPROVED')">Valider</button>
            <button class="btn btn--danger btn--sm" *ngIf="r.status !== 'REFUSED'" (click)="setStatus(r, 'REFUSED')">Refuser</button>
          </ng-container>
          <button class="btn btn--danger btn--sm" *ngIf="!admin" (click)="cancel(r)">Annuler</button>
        </div>
      </div>
      <div class="card empty" *ngIf="!items.length">Aucune réservation.</div>
    </div>

    <div class="modal-bg" *ngIf="showNew" (click)="showNew = false">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="send()" #f="ngForm">
        <h2>Nouvelle réservation</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="field"><label>Espace</label>
          <select name="s" [(ngModel)]="form.space" required><option *ngFor="let s of spaces" [value]="s">{{ s }}</option></select></div>
        <div class="field"><label>Date</label><input type="date" name="d" [(ngModel)]="form.date" [min]="today" required /></div>
        <div class="row">
          <div class="field"><label>Début</label><input type="time" name="a" [(ngModel)]="form.startTime" required /></div>
          <div class="field"><label>Fin</label><input type="time" name="b" [(ngModel)]="form.endTime" required /></div>
        </div>
        <div class="field"><label>Précisions</label><textarea name="n" rows="2" maxlength="500" [(ngModel)]="form.note"></textarea></div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="showNew = false">Annuler</button>
          <button type="submit" class="btn" [disabled]="busy || !f.valid">{{ busy ? 'Envoi...' : 'Envoyer la demande' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.head { display: flex; justify-content: space-between; gap: 10px; } p { margin: 8px 0; } .note { background: #f3f5f9; padding: 8px 12px; border-radius: 8px; } .actions { display: flex; gap: 8px; }`],
})
export class ReservationsPage implements OnInit {
  items: Reservation[] = [];
  st = STATUS; cls = CLS;
  spaces = ['Salle commune', 'Local vélos', 'Terrasse', 'Parking visiteurs'];
  today = new Date().toISOString().slice(0, 10);
  form = this.blank();
  showNew = false; loading = false; busy = false; error = ''; success = '';
  constructor(private api: ApiService, private auth: AuthService) {}
  get admin(): boolean { return this.auth.isAdmin(); }

  private blank() { return { space: 'Salle commune', date: '', startTime: '18:00', endTime: '22:00', note: '' }; }
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<Reservation[]>(this.admin ? '/admin/reservations' : '/reservations').pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.items = r), error: (e) => (this.error = errorText(e, 'Chargement impossible.')) });
  }
  send(): void {
    this.busy = true; this.error = '';
    this.api.post<Reservation>('/reservations', this.form).pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => { this.showNew = false; this.form = this.blank(); this.success = 'Demande envoyée au syndic.'; this.load(); },
      error: (e) => (this.error = errorText(e, 'Envoi impossible.')),
    });
  }
  setStatus(r: Reservation, status: string): void {
    this.error = '';
    this.api.patch<Reservation>(`/admin/reservations/${r.id}/status`, { status }).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e, 'Action impossible.')) });
  }
  cancel(r: Reservation): void {
    if (!confirm('Annuler cette réservation ?')) return;
    this.api.delete(`/reservations/${r.id}`).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e, 'Annulation impossible.')) });
  }
}
