import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { BuildingStore } from '../core/building.store';
import { LangSwitchComponent } from './lang-switch.component';
import { IconComponent } from '../shared/icons.component';
import { BrandComponent } from '../shared/brand.component';
import { BellComponent } from './bell.component';

interface NavItem { label: string; link: string; icon: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet, LangSwitchComponent, IconComponent, BrandComponent, BellComponent],
  template: `
    <div class="shell">
      <header class="topbar">
        <button class="burger" (click)="open = !open" aria-label="Menu"><app-icon name="menu" [size]="24" /></button>
        <strong class="brand"><app-brand [size]="22" /></strong>
        <span class="who">{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</span>
        <app-bell *ngIf="!auth.isSuper()" />
      </header>
      <div class="overlay" *ngIf="open" (click)="open = false"></div>
      <aside class="side" [class.side--open]="open">
        <div class="side__brand"><span class="mark"><app-brand [size]="26" /></span><small>{{ auth.isSuper() ? 'Plateforme' : auth.isAdmin() ? 'Espace syndic' : 'Espace copropriétaire' }}</small>
          <span class="side__bell" *ngIf="!auth.isSuper()"><app-bell /></span></div>
        <div class="bsel" *ngIf="auth.isAdmin() && store.list.length">
          <label>Bâtiment</label>
          <select [ngModel]="store.selectedId" (ngModelChange)="pick($event)" name="bsel">
            <option [ngValue]="null">Tous les bâtiments</option>
            <option *ngFor="let b of store.list" [ngValue]="b.id">{{ b.name }}</option>
          </select>
        </div>
        <nav>
          <a *ngFor="let n of nav" [routerLink]="n.link" routerLinkActive="on" (click)="open = false"><app-icon [name]="n.icon" [size]="19" />{{ n.label }}</a>
        </nav>
        <div class="langbox"><app-lang [dark]="true" /></div>
        <button class="logout" (click)="auth.logout()"><app-icon name="logout" [size]="18" />Se déconnecter</button>
      </aside>
      <main class="content"><router-outlet *ngIf="show" /></main>
      <nav class="tabbar" *ngIf="auth.user()?.role === 'OWNER'">
        <a *ngFor="let t of tabs" [routerLink]="t.link" routerLinkActive="on"><app-icon [name]="t.icon" [size]="22" /><span>{{ t.label }}</span></a>
      </nav>
    </div>
  `,
  styles: [`
    .shell { min-height: 100vh; }
    .topbar { display: none; position: sticky; top: 0; z-index: 60; background: var(--navy); color: #fff; align-items: center; gap: 12px; padding: 11px 14px; }
    .burger { background: none; border: 0; color: #fff; line-height: 1; padding: 2px; display: inline-flex; }
    .brand { font-family: var(--font-display); font-size: 19px; flex: 1; display: inline-flex; align-items: center; min-width: 0; letter-spacing: -.01em; }
    .who { font-size: 13px; opacity: .8; }
    .side { position: fixed; top: 0; bottom: 0; left: 0; width: 252px; background: var(--navy); color: #c3ced3; display: flex; flex-direction: column; padding: 22px 12px; z-index: 80; overflow-y: auto; }
    .side__brand { color: #fff; padding: 0 10px 22px; display: flex; flex-direction: column; gap: 4px; }
    .mark { font-family: var(--font-display); font-size: 24px; font-weight: 700; letter-spacing: -.02em; display: inline-flex; align-items: center; min-width: 0; }
    .side__brand small { font-size: 13px; color: #8fa0a8; padding-left: 36px; }
    .side__brand { position: relative; } .side__bell { position: absolute; top: -2px; right: 6px; color: #c3ced3; }
    @media (max-width: 900px) { .side__bell { display: none; } }
    nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    nav a { color: #c3ced3; padding: 9px 12px; border-radius: 8px; display: flex; gap: 12px; align-items: center; font-weight: 500; font-size: 14px; position: relative; text-decoration: none; }
    nav a:hover { background: rgba(255,255,255,.07); color: #fff; }
    nav a.on { background: rgba(255,255,255,.1); color: #fff; font-weight: 600; }
    nav a.on app-icon { color: var(--gold); }
    nav a.on::before { content: ''; position: absolute; left: -12px; top: 8px; bottom: 8px; width: 4px; border-radius: 0 4px 4px 0; background: var(--gold); }
    .bsel { padding: 0 10px 16px; } .bsel label { display: block; font-size: 13px; color: #8fa0a8; margin-bottom: 5px; }
    .bsel select { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.08); color: #fff; font-size: 14px; } .bsel option { color: #1a2328; }
    .langbox { margin-top: 14px; }
    .logout { margin-top: 12px; background: transparent; border: 1px solid rgba(255,255,255,.16); color: #e4eaec; padding: 9px 12px; border-radius: 8px; text-align: left; font-size: 14px; display: flex; align-items: center; gap: 10px; }
    .logout:hover { background: rgba(255,255,255,.08); }
    .content { margin-left: 252px; padding: 30px 36px 56px; max-width: 1220px; }
    .overlay { position: fixed; inset: 0; background: rgba(20,29,35,.55); z-index: 70; }
    .tabbar { display: none; }
    @media (max-width: 900px) {
      .tabbar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; background: #fff; border-top: 1px solid var(--line); padding-bottom: env(safe-area-inset-bottom); }
      .tabbar a { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 9px 2px 8px; font-size: 11px; color: var(--muted); position: relative; text-decoration: none; }
      .tabbar a.on { color: var(--navy); font-weight: 700; }
      .tabbar a.on::before { content: ''; position: absolute; top: 0; left: 28%; right: 28%; height: 3px; border-radius: 0 0 3px 3px; background: var(--gold); }
      .content { padding-bottom: 84px !important; }
      .topbar { display: flex; } .content { margin-left: 0; padding: 18px 14px 40px; }
      .side { transform: translateX(-100%); transition: transform .25s ease; } .side--open { transform: none; box-shadow: 0 0 40px rgba(0,0,0,.35); }
      nav a.on::before { left: 0; }
    }
  `],
})
export class ShellComponent implements OnDestroy {
  open = false;
  show = true;
  private sub: Subscription;

  constructor(public auth: AuthService, public store: BuildingStore) {
    if (auth.isAdmin()) store.init(); else store.reset();
    store.load();
    // Changement de bâtiment : on recrée la page courante pour qu'elle recharge ses données.
    this.sub = store.changed.subscribe(() => { this.show = false; setTimeout(() => (this.show = true)); });
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  pick(id: number | null): void { this.open = false; this.store.select(id); }

  tabs: NavItem[] = [
    { label: 'Accueil', link: '/app/mon-espace', icon: 'home' },
    { label: 'Charges', link: '/app/mes-charges', icon: 'euro' },
    { label: 'Incidents', link: '/app/mes-incidents', icon: 'alert' },
    { label: 'Votes', link: '/app/assemblies', icon: 'vote' },
    { label: 'Messages', link: '/app/messages', icon: 'mail' },
  ];

  /** Tableau construit une seule fois : un getter qui recrée les objets à chaque cycle fait boucler ngFor + routerLinkActive. */
  nav: NavItem[] = this.buildNav();

  private buildNav(): NavItem[] {
    const common: NavItem[] = [
      { label: 'Assemblées & votes', link: '/app/assemblies', icon: 'vote' },
      { label: 'Annonces', link: '/app/announcements', icon: 'megaphone' },
      { label: 'Documents', link: '/app/documents', icon: 'doc' },
      { label: 'Travaux', link: '/app/works', icon: 'tools' },
      { label: 'Réservations', link: '/app/reservations', icon: 'calendar' },
      { label: 'Messagerie', link: '/app/messages', icon: 'mail' },
    ];
    if (this.auth.isSuper()) {
      return [
        { label: 'Agences', link: '/app/super/agencies', icon: 'building' },
        { label: 'Mon compte', link: '/app/profil', icon: 'user' },
      ];
    }
    if (this.auth.isAdmin()) {
      return [
        { label: 'Tableau de bord', link: '/app/admin/dashboard', icon: 'chart' },
        { label: 'Copropriétaires', link: '/app/admin/users', icon: 'users' },
        { label: 'Bâtiments', link: '/app/admin/buildings', icon: 'building' },
        { label: 'Lots & tantièmes', link: '/app/admin/lots', icon: 'lots' },
        { label: 'Appels de fonds', link: '/app/admin/charges', icon: 'euro' },
        { label: 'Dépenses', link: '/app/admin/expenses', icon: 'receipt' },
        { label: 'Incidents', link: '/app/admin/incidents', icon: 'alert' },
        { label: 'Budget', link: '/app/admin/budgets', icon: 'trend' },
        { label: 'Fournisseurs', link: '/app/admin/suppliers', icon: 'wrench' },
        { label: 'Échéances', link: '/app/admin/deadlines', icon: 'clock' },
        ...common,
        { label: 'Équipe', link: '/app/admin/team', icon: 'users' },
        { label: 'Journal d’activité', link: '/app/admin/activity', icon: 'list' },
        { label: 'Mon agence', link: '/app/admin/agency', icon: 'palette' },
        { label: 'Mon compte', link: '/app/profil', icon: 'user' },
      ];
    }
    return [
      { label: 'Mon espace', link: '/app/mon-espace', icon: 'home' },
      { label: 'Mes charges', link: '/app/mes-charges', icon: 'euro' },
      { label: 'Mes incidents', link: '/app/mes-incidents', icon: 'alert' },
      ...common,
      { label: 'Mon compte', link: '/app/profil', icon: 'user' },
    ];
  }
}
