import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BuildingStore } from '../../core/building.store';
import { errorText } from '../../core/auth.interceptor';
import { AdminDashboard, BuildingSummary } from '../../models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="page-head"><div><h1>Tableau de bord<span *ngIf="store.selectedName"> — {{ store.selectedName }}</span></h1><p>{{ store.selectedName ? 'Chiffres du bâtiment sélectionné' : "Vue d'ensemble de la copropriété (tous les bâtiments)" }}</p></div></div>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
    <div class="spinner" *ngIf="!d && !error"></div>

    <ng-container *ngIf="d">
      <a routerLink="/app/admin/users" class="alert alert--info block" *ngIf="d.pendingUsers > 0">
        👥 <strong>{{ d.pendingUsers }}</strong> inscription(s) en attente de validation — cliquez pour traiter.
      </a>
      <div class="grid grid--4">
        <div class="card stat stat--navy"><small>Copropriétaires validés</small><strong>{{ d.activeOwners }}</strong><span>{{ d.lots }} lots · {{ d.totalTantiemes }} tantièmes</span></div>
        <div class="card stat stat--gold" [class.stat--alert]="d.unpaidCount > 0"><small>Impayés</small><strong>{{ d.unpaidTotal | currency:'EUR':'symbol':'1.2-2' }}</strong><span>{{ d.unpaidCount }} charge(s) à encaisser</span></div>
        <div class="card stat"><small>Incidents ouverts</small><strong>{{ d.openIncidents }}</strong><a routerLink="/app/admin/incidents">Voir les incidents</a></div>
        <div class="card stat"><small>Dépenses de l'année</small><strong>{{ d.expensesThisYear | currency:'EUR':'symbol':'1.2-2' }}</strong><a routerLink="/app/admin/expenses">Voir les dépenses</a></div>
      </div>

      <div class="card" style="margin-top:16px" *ngIf="!store.selectedName && summary.length">
        <h3>Bâtiments</h3>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Bâtiment</th><th>Lots</th><th>Tantièmes</th><th>Copropriétaires</th><th>Impayés</th><th>Incidents ouverts</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let b of summary">
              <td data-label="Bâtiment"><strong>{{ b.name }}</strong><br /><small>{{ b.address }} {{ b.city }}</small></td>
              <td data-label="Lots">{{ b.lots }}</td><td data-label="Tantièmes">{{ b.totalTantiemes }}</td><td data-label="Copropriétaires">{{ b.owners }}</td>
              <td data-label="Impayés">{{ b.unpaidTotal | currency:'EUR':'symbol':'1.2-2' }}</td><td data-label="Incidents">{{ b.openIncidents }}</td>
              <td class="actions-cell"><button class="btn btn--sm btn--ghost" (click)="store.select(b.id)">Ouvrir</button></td>
            </tr>
          </tbody>
        </table></div>
      </div>

      <div class="grid grid--2" style="margin-top:16px">
        <div class="card">
          <h3>Budget {{ year }}</h3>
          <ng-container *ngIf="d.budgetThisYear; else nobudget">
            <p><strong>{{ d.expensesThisYear | currency:'EUR':'symbol':'1.0-0' }}</strong> dépensés sur {{ d.budgetThisYear | currency:'EUR':'symbol':'1.0-0' }} ({{ pct }} %)</p>
            <div class="bar"><div [style.width.%]="pct > 100 ? 100 : pct" [class.over]="pct > 100"></div></div>
          </ng-container>
          <ng-template #nobudget><p class="muted">Aucun budget défini. <a routerLink="/app/admin/budgets">Définir le budget</a></p></ng-template>
          <p *ngIf="d.highPriorityIncidents > 0" class="warn">⚠️ dont {{ d.highPriorityIncidents }} incident(s) en priorité haute</p>
        </div>
        <div class="card">
          <h3>Dernières dépenses</h3>
          <div class="ann" *ngFor="let e of d.recentExpenses"><strong>{{ e.label }}</strong> — {{ e.amount | currency:'EUR':'symbol':'1.2-2' }}<br /><small>{{ e.expenseDate | date:'dd/MM/yyyy' }}</small></div>
          <p class="muted" *ngIf="!d.recentExpenses.length">Aucune dépense.</p>
        </div>
      </div>

      <div class="grid grid--2" style="margin-top:16px">
        <div class="card">
          <h3>Prochaine assemblée</h3>
          <ng-container *ngIf="d.nextAssembly as a; else none">
            <p><strong>{{ a.title }}</strong><br />{{ a.meetingDate | date:'EEEE d MMMM y, HH:mm' }}<br /><small>{{ a.location }}</small></p>
            <a [routerLink]="['/app/assemblies', a.id]" class="btn btn--sm">Ouvrir</a>
          </ng-container>
          <ng-template #none><p class="muted">Aucune assemblée planifiée. <a routerLink="/app/assemblies">En convoquer une</a></p></ng-template>
        </div>
        <div class="card">
          <h3>Dernières annonces</h3>
          <div class="ann" *ngFor="let a of d.announcements"><strong>{{ a.title }}</strong> <span class="badge badge--warn" *ngIf="a.important">Important</span><br /><small>{{ a.createdAt | date:'dd/MM/yyyy' }}</small></div>
          <p class="muted" *ngIf="!d.announcements.length">Aucune annonce. <a routerLink="/app/announcements">Publier</a></p>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`.block { display: block; color: var(--blue); } h3 { font-size: 17px; margin-bottom: 10px; } .muted { color: var(--muted); } .ann { padding: 8px 0; border-bottom: 1px solid var(--line); } .ann:last-child { border: 0; } .stat a { font-size: 13px; } .bar { height: 10px; background: #e8edf5; border-radius: 6px; overflow: hidden; margin: 8px 0; } .bar div { height: 100%; background: var(--navy); } .bar .over { background: var(--danger); } .warn { color: var(--warn); font-weight: 600; }`],
})
export class AdminDashboardPage implements OnInit {
  d: AdminDashboard | null = null;
  year = new Date().getFullYear();
  get pct(): number { return this.d?.budgetThisYear ? Math.round((this.d.expensesThisYear / this.d.budgetThisYear) * 100) : 0; }
  error = '';
  summary: BuildingSummary[] = [];
  constructor(private api: ApiService, public store: BuildingStore) {}
  ngOnInit(): void {
    this.api.get<BuildingSummary[]>('/admin/buildings/summary').subscribe({ next: (s) => (this.summary = s), error: () => {} });
    this.api.get<AdminDashboard>('/admin/dashboard').subscribe({ next: (d) => (this.d = d), error: (e) => (this.error = errorText(e, 'Chargement impossible.')) });
  }
}
