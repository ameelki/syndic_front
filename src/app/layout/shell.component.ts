import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { BuildingStore } from '../core/building.store';
import { LangSwitchComponent } from './lang-switch.component';

interface NavItem { label: string; link: string; icon: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet, LangSwitchComponent],
  template: `
    <div class="shell">
      <header class="topbar">
        <button class="burger" (click)="open = !open" aria-label="Menu">☰</button>
        <strong class="brand">Syndic<span>.</span></strong>
        <span class="who">{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</span>
      </header>
      <div class="overlay" *ngIf="open" (click)="open = false"></div>
      <aside class="side" [class.side--open]="open">
        <div class="side__brand">Syndic<span>.</span><small>{{ auth.isAdmin() ? 'Espace syndic' : 'Espace copropriétaire' }}</small></div>
        <div class="bsel" *ngIf="auth.isAdmin() && store.list.length">
          <label>Bâtiment</label>
          <select [ngModel]="store.selectedId" (ngModelChange)="pick($event)" name="bsel">
            <option [ngValue]="null">Tous les bâtiments</option>
            <option *ngFor="let b of store.list" [ngValue]="b.id">{{ b.name }}</option>
          </select>
        </div>
        <nav>
          <a *ngFor="let n of nav" [routerLink]="n.link" routerLinkActive="on" (click)="open = false"><i>{{ n.icon }}</i>{{ n.label }}</a>
        </nav>
        <div class="langbox"><app-lang [dark]="true" /></div>
        <button class="logout" (click)="auth.logout()">⎋ Se déconnecter</button>
      </aside>
      <main class="content"><router-outlet *ngIf="show" /></main>
      <nav class="tabbar" *ngIf="!auth.isAdmin()">
        <a *ngFor="let t of tabs" [routerLink]="t.link" routerLinkActive="on"><i>{{ t.icon }}</i><span>{{ t.label }}</span></a>
      </nav>
    </div>
  `,
  styles: [`
    .shell { min-height: 100vh; }
    .topbar { display: none; position: sticky; top: 0; z-index: 60; background: var(--navy); color: #fff; align-items: center; gap: 12px; padding: 12px 16px; }
    .burger { background: none; border: 0; color: #fff; font-size: 24px; line-height: 1; padding: 0 4px; }
    .brand { font-family: 'Merriweather', serif; font-size: 18px; flex: 1; } .brand span, .side__brand span { color: var(--gold); }
    .who { font-size: 13px; opacity: .85; }
    .side { position: fixed; top: 0; bottom: 0; left: 0; width: 256px; background: var(--navy); color: #cfd8e6; display: flex; flex-direction: column; padding: 22px 14px; z-index: 80; overflow-y: auto; }
    .side__brand { font-family: 'Merriweather', serif; color: #fff; font-size: 24px; padding: 0 10px 22px; display: flex; flex-direction: column; }
    .side__brand small { font-family: 'Inter', sans-serif; font-size: 12px; color: #8fa3bf; margin-top: 2px; }
    nav { display: flex; flex-direction: column; gap: 3px; flex: 1; }
    nav a { color: #cfd8e6; padding: 10px 12px; border-radius: 10px; display: flex; gap: 12px; align-items: center; font-weight: 500; font-size: 14px; }
    nav a i { font-style: normal; width: 22px; text-align: center; }
    nav a:hover { background: rgba(255,255,255,.08); } nav a.on { background: rgba(200,150,62,.2); color: #fff; box-shadow: inset 3px 0 0 var(--gold); }
    .bsel { padding: 0 10px 14px; } .bsel label { display: block; font-size: 11px; color: #8fa3bf; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .05em; }
    .bsel select { width: 100%; padding: 8px; border-radius: 8px; border: 0; background: rgba(255,255,255,.12); color: #fff; font-size: 14px; } .bsel option { color: #1c2733; }
    .langbox { margin-top: 14px; }
    .logout { margin-top: 14px; background: rgba(255,255,255,.08); border: 0; color: #fff; padding: 10px 12px; border-radius: 10px; text-align: left; font-size: 14px; }
    .content { margin-left: 256px; padding: 28px 32px 48px; max-width: 1200px; }
    .overlay { position: fixed; inset: 0; background: rgba(15,28,46,.5); z-index: 70; }
    .tabbar { display: none; }
    @media (max-width: 900px) {
      .tabbar { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; background: #fff; border-top: 1px solid var(--line); padding-bottom: env(safe-area-inset-bottom); }
      .tabbar a { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 2px; font-size: 11px; color: var(--muted); }
      .tabbar a i { font-style: normal; font-size: 20px; } .tabbar a.on { color: var(--navy); font-weight: 600; }
      .content { padding-bottom: 84px !important; }
      .topbar { display: flex; } .content { margin-left: 0; padding: 18px 14px 40px; }
      .side { transform: translateX(-100%); transition: transform .25s ease; } .side--open { transform: none; box-shadow: 0 0 40px rgba(0,0,0,.35); }
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
    { label: 'Accueil', link: '/app/mon-espace', icon: '🏠' },
    { label: 'Charges', link: '/app/mes-charges', icon: '💶' },
    { label: 'Incidents', link: '/app/mes-incidents', icon: '⚠️' },
    { label: 'Votes', link: '/app/assemblies', icon: '🗳' },
    { label: 'Messages', link: '/app/messages', icon: '✉️' },
  ];

  /** Tableau construit une seule fois : un getter qui recrée les objets à chaque cycle fait boucler ngFor + routerLinkActive. */
  nav: NavItem[] = this.buildNav();

  private buildNav(): NavItem[] {
    const common: NavItem[] = [
      { label: 'Assemblées & votes', link: '/app/assemblies', icon: '🗳' },
      { label: 'Annonces', link: '/app/announcements', icon: '📢' },
      { label: 'Documents', link: '/app/documents', icon: '📄' },
      { label: 'Travaux', link: '/app/works', icon: '🛠' },
      { label: 'Réservations', link: '/app/reservations', icon: '📅' },
      { label: 'Messagerie', link: '/app/messages', icon: '✉️' },
    ];
    if (this.auth.isAdmin()) {
      return [
        { label: 'Tableau de bord', link: '/app/admin/dashboard', icon: '📊' },
        { label: 'Copropriétaires', link: '/app/admin/users', icon: '👥' },
        { label: 'Bâtiments', link: '/app/admin/buildings', icon: '🏙' },
        { label: 'Lots & tantièmes', link: '/app/admin/lots', icon: '🏢' },
        { label: 'Appels de fonds', link: '/app/admin/charges', icon: '💶' },
        { label: 'Dépenses', link: '/app/admin/expenses', icon: '🧾' },
        { label: 'Incidents', link: '/app/admin/incidents', icon: '⚠️' },
        { label: 'Budget', link: '/app/admin/budgets', icon: '📈' },
        { label: 'Fournisseurs', link: '/app/admin/suppliers', icon: '🔧' },
        ...common,
      ];
    }
    return [
      { label: 'Mon espace', link: '/app/mon-espace', icon: '🏠' },
      { label: 'Mes charges', link: '/app/mes-charges', icon: '💶' },
      { label: 'Mes incidents', link: '/app/mes-incidents', icon: '⚠️' },
      ...common,
    ];
  }
}
