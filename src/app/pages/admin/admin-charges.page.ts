import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BuildingStore } from '../../core/building.store';
import { errorText } from '../../core/auth.interceptor';
import { ChargeCall, ChargeView } from '../../models/models';
import { badgeClass } from '../../shared/labels';
import { saveBlob } from '../../shared/files';

@Component({
  selector: 'app-admin-charges',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="page-head">
      <div><h1>Appels de fonds</h1><p>Le montant est réparti automatiquement selon les tantièmes de chaque lot</p></div>
      <button class="btn" (click)="showNew = true">+ Nouvel appel de fonds</button>
    </div>
    <div class="alert alert--ok" *ngIf="success">{{ success }}</div>
    <div class="alert alert--error" *ngIf="error && !showNew">{{ error }}</div>

    <div class="toolbar">
      <select [(ngModel)]="callId" name="call" (ngModelChange)="loadCharges()">
        <option [ngValue]="null">Tous les appels</option>
        <option *ngFor="let c of calls" [ngValue]="c.id">{{ c.title }} — {{ c.dueDate | date:'dd/MM/yyyy' }}</option>
      </select>
      <select [(ngModel)]="status" name="status" (ngModelChange)="loadCharges()">
        <option [ngValue]="''">Tous les statuts</option><option value="UNPAID">Impayés</option><option value="PAID">Payés</option>
      </select>
      <button class="btn btn--sm btn--ghost" *ngIf="callId" (click)="remindCall()">Relancer les impayés</button>
      <button class="btn btn--sm btn--danger" *ngIf="callId" (click)="deleteCall()">Supprimer cet appel</button>
      <button class="btn btn--sm btn--ghost" (click)="exportCsv()" [disabled]="!charges.length">Exporter (CSV)</button>
      <strong class="total">Total affiché : {{ total | currency:'EUR':'symbol':'1.2-2' }}</strong>
    </div>

    <div class="spinner" *ngIf="loading"></div>
    <div class="table-wrap" *ngIf="!loading && charges.length">
      <table class="table">
        <thead><tr><th>Appel</th><th>Échéance</th><th>Lot</th><th>Copropriétaire</th><th>Montant</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let c of charges">
            <td data-label="Appel">{{ c.callTitle }}</td><td data-label="Échéance">{{ c.dueDate | date:'dd/MM/yyyy' }}</td>
            <td data-label="Lot">{{ c.lotNumber }}</td><td data-label="Copropriétaire">{{ c.ownerName }}</td>
            <td data-label="Montant"><strong>{{ c.amount | currency:'EUR':'symbol':'1.2-2' }}</strong></td>
            <td data-label="Statut"><span [class]="c.late ? 'badge badge--danger' : badge(c.status)">{{ c.status === 'PAID' ? 'Payé le ' + (c.paidAt | date:'dd/MM/yyyy') : c.late ? 'En retard' : 'À payer' }}</span>
              <br /><small class="muted" *ngIf="c.reminders">{{ c.reminders }} relance(s)</small></td>
            <td class="actions-cell"><div class="actions">
              <button class="btn btn--sm btn--ghost" *ngIf="c.status === 'UNPAID'" (click)="remind(c)">Relancer</button>
              <button class="btn btn--sm btn--ok" *ngIf="c.status === 'UNPAID'" (click)="setPaid(c, true)">Marquer payé</button>
              <button class="btn btn--sm btn--ghost" *ngIf="c.status === 'PAID'" (click)="setPaid(c, false)">Annuler le paiement</button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card empty" *ngIf="!loading && !charges.length">Aucune charge. Créez un appel de fonds pour commencer.</div>

    <div class="modal-bg" *ngIf="showNew" (click)="showNew = false">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="create()" #f="ngForm">
        <h2>Nouvel appel de fonds</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="field"><label>Intitulé</label><input name="title" [(ngModel)]="form.title" placeholder="Ex : Charges 1er trimestre" maxlength="150" required /></div>
        <div class="row">
          <div class="field"><label>Montant total (€)</label><input name="total" type="number" step="0.01" min="0.01" [(ngModel)]="form.totalAmount" required /></div>
          <div class="field"><label>Date d'échéance</label><input name="due" type="date" [(ngModel)]="form.dueDate" required /></div>
        </div>
        <div class="field"><label>Bâtiment concerné</label>
          <select name="bid" [(ngModel)]="form.buildingId"><option [ngValue]="null">Tous les bâtiments</option><option *ngFor="let b of store.list" [ngValue]="b.id">{{ b.name }}</option></select></div>
        <p class="hint">Chaque lot rattaché à un copropriétaire recevra sa part = montant × tantièmes du lot ÷ total des tantièmes.</p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="showNew = false">Annuler</button>
          <button type="submit" class="btn" [disabled]="busy || !f.valid">{{ busy ? 'Création...' : 'Créer l’appel' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.muted { color: var(--muted); } .total { margin-left: auto; color: var(--navy); } .hint { font-size: 13px; color: var(--muted); }`],
})
export class AdminChargesPage implements OnInit {
  calls: ChargeCall[] = [];
  charges: ChargeView[] = [];
  callId: number | null = null;
  status = '';
  loading = false;
  busy = false;
  error = '';
  success = '';
  showNew = false;
  form: { title: string; totalAmount: number | null; dueDate: string; buildingId: number | null } = { title: '', totalAmount: null, dueDate: '', buildingId: null };

  constructor(private api: ApiService, public store: BuildingStore) {}

  ngOnInit(): void { this.form.buildingId = this.store.selectedId; this.loadCalls(); this.loadCharges(); }

  get total(): number { return this.charges.reduce((s, c) => s + Number(c.amount), 0); }
  badge = (s: string) => badgeClass(s);

  loadCalls(): void { this.api.get<ChargeCall[]>('/admin/charge-calls').subscribe({ next: (c) => (this.calls = c), error: () => {} }); }

  loadCharges(): void {
    this.loading = true;
    this.api.get<ChargeView[]>('/admin/charges', { callId: this.callId, status: this.status })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (c) => (this.charges = c), error: (e) => (this.error = errorText(e)) });
  }

  private flash(m: string): void { this.success = m; setTimeout(() => (this.success = ''), 3000); }

  create(): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.api.post('/admin/charge-calls', this.form).pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => { this.showNew = false; this.form = { title: '', totalAmount: null, dueDate: '', buildingId: null }; this.flash('Appel de fonds créé.'); this.loadCalls(); this.loadCharges(); },
      error: (e) => (this.error = errorText(e)),
    });
  }

  setPaid(c: ChargeView, paid: boolean): void {
    this.api.patch<ChargeView>(`/admin/charges/${c.id}/paid`, { paid }).subscribe({
      next: (r) => Object.assign(c, r), error: (e) => (this.error = errorText(e)),
    });
  }

  remind(c: ChargeView): void {
    this.api.post<ChargeView>(`/admin/charges/${c.id}/remind`).subscribe({
      next: (r) => { Object.assign(c, r); this.flash('Relance envoyée à ' + c.ownerName + '.'); }, error: (e) => (this.error = errorText(e)),
    });
  }

  remindCall(): void {
    if (!this.callId || !confirm('Envoyer un rappel (notification + email) à tous les copropriétaires qui n’ont pas payé cet appel ?')) return;
    this.api.post<{ sent: number }>(`/admin/charge-calls/${this.callId}/remind`).subscribe({
      next: (r) => { this.flash(r.sent + ' relance(s) envoyée(s).'); this.loadCharges(); }, error: (e) => (this.error = errorText(e)),
    });
  }

  exportCsv(): void {
    this.api.getBlob('/admin/charges/export', { callId: this.callId, status: this.status }).subscribe({
      next: (b) => saveBlob(b, 'charges.csv'), error: (e) => (this.error = errorText(e, 'Export impossible.')),
    });
  }

  deleteCall(): void {
    if (!this.callId || !confirm('Supprimer cet appel de fonds et toutes ses charges ?')) return;
    this.api.delete(`/admin/charge-calls/${this.callId}`).subscribe({
      next: () => { this.callId = null; this.flash('Appel supprimé.'); this.loadCalls(); this.loadCharges(); },
      error: (e) => (this.error = errorText(e)),
    });
  }
}
