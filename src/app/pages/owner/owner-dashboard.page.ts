import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { BuildingStore } from '../../core/building.store';
import { errorText } from '../../core/auth.interceptor';
import { OwnerDashboard } from '../../models/models';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="page-head"><div><h1>Bonjour {{ d?.firstName }} 👋</h1><p>Voici l'essentiel de votre copropriété</p></div></div>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
    <div class="spinner" *ngIf="!d && !error"></div>

    <ng-container *ngIf="d">
      <div class="alert alert--info" *ngIf="!d.lots.length">Aucun lot n'est encore rattaché à votre compte : le syndic va s'en charger. Vous pourrez alors consulter vos charges et voter.</div>
      <div class="grid grid--4">
        <div class="card stat stat--gold" [class.stat--alert]="d.unpaidCount > 0"><small>Reste à payer</small><strong>{{ d.dueTotal | currency:'EUR':'symbol':'1.2-2' }}</strong><a routerLink="/app/mes-charges">{{ d.unpaidCount }} charge(s) en attente</a></div>
        <div class="card stat stat--navy"><small>Mes tantièmes</small><strong>{{ d.myTantiemes }}</strong><span>{{ d.lots.length }} lot(s)</span></div>
        <div class="card stat"><small>Mes incidents ouverts</small><strong>{{ d.openIncidents }}</strong><a routerLink="/app/mes-incidents">Signaler un problème</a></div>
      </div>

      <div class="grid grid--2" style="margin-top:16px">
        <div class="card">
          <h3>Mes lots</h3>
          <div class="line" *ngFor="let l of d.lots"><strong>Lot {{ l.number }}</strong><span>{{ store.nameOf(l.buildingId) }} {{ l.building }} · {{ l.tantiemes }} tantièmes</span></div>
          <p class="muted" *ngIf="!d.lots.length">—</p>
        </div>
        <div class="card">
          <h3>Prochaine assemblée</h3>
          <ng-container *ngIf="d.nextAssembly as a; else none">
            <p><strong>{{ a.title }}</strong><br />{{ a.meetingDate | date:'EEEE d MMMM y, HH:mm' }}<br /><small>{{ a.location }}</small></p>
            <a [routerLink]="['/app/assemblies', a.id]" class="btn btn--sm">Voir / voter</a>
          </ng-container>
          <ng-template #none><p class="muted">Aucune assemblée prévue.</p></ng-template>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <h3>Annonces récentes</h3>
        <div class="line" *ngFor="let a of d.announcements"><strong>{{ a.title }} <span class="badge badge--warn" *ngIf="a.important">Important</span></strong><span>{{ a.content }}</span></div>
        <p class="muted" *ngIf="!d.announcements.length">Aucune annonce.</p>
        <a routerLink="/app/announcements">Toutes les annonces →</a>
      </div>
    </ng-container>
  `,
  styles: [`h3 { font-size: 17px; margin-bottom: 10px; } .muted { color: var(--muted); } .line { display: flex; flex-direction: column; padding: 8px 0; border-bottom: 1px solid var(--line); } .line span { color: var(--muted); font-size: 14px; } .stat a { font-size: 13px; }`],
})
export class OwnerDashboardPage implements OnInit {
  d: OwnerDashboard | null = null;
  error = '';
  constructor(private api: ApiService, public store: BuildingStore) {}
  ngOnInit(): void {
    this.api.get<OwnerDashboard>('/dashboard').subscribe({ next: (d) => (this.d = d), error: (e) => (this.error = errorText(e, 'Chargement impossible.')) });
  }
}
