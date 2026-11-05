import { LangSwitchComponent } from './lang-switch.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../shared/icons.component';
import { BrandComponent } from '../shared/brand.component';
import { AgencyStore } from '../core/agency.store';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, LangSwitchComponent, IconComponent, BrandComponent],
  template: `
    <header class="bar">
      <a routerLink="/" class="brand"><app-brand [size]="26" /></a>
      <button class="burger" (click)="open = !open" aria-label="Menu"><app-icon name="menu" [size]="24" /></button>
      <nav [class.open]="open" (click)="open = false">
        <a routerLink="/" fragment="fonctions">Fonctionnalités</a>
        <a routerLink="/" fragment="fonctionnement">Comment ça marche</a>
        <app-lang />
        <ng-container *ngIf="!auth.isLoggedIn; else loggedIn">
          <a routerLink="/connexion" class="btn btn--ghost btn--sm">Connexion</a>
          <a *ngIf="agency.registrable()" routerLink="/inscription" class="btn btn--gold btn--sm">Créer un compte</a>
        </ng-container>
        <ng-template #loggedIn><a [routerLink]="auth.homeUrl()" class="btn btn--gold btn--sm">Mon espace</a></ng-template>
      </nav>
    </header>
    <router-outlet />
    <footer class="foot">
      <strong><app-brand [size]="22" /></strong>
      <p>Gestion de copropriété simple, transparente et collaborative.</p>
      <small>© {{ year }} {{ agency.agency().name }} — Tous droits réservés</small>
    </footer>
  `,
  styles: [`
    .bar { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,.94); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line);
      display: flex; align-items: center; justify-content: space-between; padding: 11px 24px; flex-wrap: wrap; }
    .brand { font-family: var(--font-display); font-size: 22px; color: var(--navy); font-weight: 700; letter-spacing: -.02em; display: inline-flex; align-items: center; } .brand:hover { text-decoration: none; }
    nav { display: flex; gap: 20px; align-items: center; } nav > a:not(.btn) { color: var(--text); font-weight: 500; font-size: 14px; } nav > a:not(.btn):hover { color: var(--blue); }
    .burger { display: none; background: none; border: 0; color: var(--navy); }
    .foot { background: var(--navy); color: #c3ced3; padding: 36px 24px; display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
    .foot strong { font-family: var(--font-display); font-size: 21px; color: #fff; display: inline-flex; align-items: center; gap: 9px; }
    .foot p { margin: 4px 0 0; max-width: 60ch; } .foot small { color: #8fa0a8; }
    @media (max-width: 760px) {
      .burger { display: block; } nav { display: none; width: 100%; flex-direction: column; align-items: stretch; gap: 10px; padding: 14px 0 6px; } nav.open { display: flex; }
      nav > a:not(.btn) { padding: 6px 0; } nav .btn { width: 100%; padding: 10px; }
    }
  `],
})
export class PublicLayoutComponent {
  open = false;
  year = new Date().getFullYear();
  constructor(public auth: AuthService, public agency: AgencyStore) {}
}
