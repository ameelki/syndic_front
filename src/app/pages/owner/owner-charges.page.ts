import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { errorText } from '../../core/auth.interceptor';
import { ChargeView } from '../../models/models';
import { badgeClass } from '../../shared/labels';

@Component({
  selector: 'app-owner-charges',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="page-head"><div><h1>Mes charges</h1><p>Vos appels de fonds et leur état de paiement</p></div></div>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>
    <div class="grid grid--4" *ngIf="!loading">
      <div class="card stat stat--gold" [class.stat--alert]="due > 0"><small>Reste à payer</small><strong>{{ due | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
      <div class="card stat stat--navy"><small>Déjà réglé</small><strong>{{ paid | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
    </div>
    <div class="table-wrap" *ngIf="!loading && charges.length" style="margin-top:16px">
      <table class="table">
        <thead><tr><th>Appel de fonds</th><th>Lot</th><th>Échéance</th><th>Montant</th><th>Statut</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of charges">
            <td data-label="Appel">{{ c.callTitle }}</td><td data-label="Lot">{{ c.lotNumber }}</td><td data-label="Échéance">{{ c.dueDate | date:'dd/MM/yyyy' }}</td>
            <td data-label="Montant"><strong>{{ c.amount | currency:'EUR':'symbol':'1.2-2' }}</strong></td>
            <td data-label="Statut"><span [class]="badge(c.status)">{{ c.status === 'PAID' ? 'Payé' : 'À payer' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card empty" *ngIf="!loading && !charges.length" style="margin-top:16px">Aucune charge pour le moment.</div>
  `,
})
export class OwnerChargesPage implements OnInit {
  charges: ChargeView[] = [];
  loading = true;
  error = '';
  constructor(private api: ApiService) {}
  badge = (s: string) => badgeClass(s);
  get due(): number { return this.sum('UNPAID'); }
  get paid(): number { return this.sum('PAID'); }
  private sum(s: string): number { return this.charges.filter((c) => c.status === s).reduce((t, c) => t + Number(c.amount), 0); }
  ngOnInit(): void {
    this.api.get<ChargeView[]>('/charges').subscribe({
      next: (c) => { this.charges = c; this.loading = false; },
      error: (e) => { this.error = errorText(e); this.loading = false; },
    });
  }
}
