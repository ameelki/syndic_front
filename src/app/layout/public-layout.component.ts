import { LangSwitchComponent } from './lang-switch.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, LangSwitchComponent],
  template: `
    <header class="bar">
      <a routerLink="/" class="brand">Syndic<span>.</span></a>
      <button class="burger" (click)="open = !open" aria-label="Menu">☰</button>
      <nav [class.open]="open" (click)="open = false">
        <a routerLink="/" fragment="fonctions">Fonctionnalités</a>
        <a routerLink="/" fragment="fonctionnement">Comment ça marche</a>
        <app-lang />
        <ng-container *ngIf="!auth.isLoggedIn; else loggedIn">
          <a routerLink="/connexion" class="btn btn--ghost btn--sm">Connexion</a>
          <a routerLink="/inscription" class="btn btn--gold btn--sm">Créer un compte</a>
        </ng-container>
        <ng-template #loggedIn><a [routerLink]="auth.homeUrl()" class="btn btn--gold btn--sm">Mon espace</a></ng-template>
      </nav>
    </header>
    <router-outlet />
    <footer class="foot">
      <strong>Syndic<span>.</span></strong>
      <p>Gestion de copropriété simple, transparente et collaborative.</p>
      <small>© {{ year }} — Tous droits réservés</small>
    </footer>
  `,
  styles: [`
    .bar { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line);
      display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; flex-wrap: wrap; }
    .brand { font-family: 'Merriweather', serif; font-size: 22px; color: var(--navy); font-weight: 700; } .brand span, .foot span { color: var(--gold); }
    nav { display: flex; gap: 18px; align-items: center; } nav > a:not(.btn) { color: var(--text); font-weight: 500; font-size: 14px; }
    .burger { display: none; background: none; border: 0; font-size: 26px; color: var(--navy); }
    .foot { background: var(--navy); color: #cfd8e6; text-align: center; padding: 32px 16px; margin-top: 0; } .foot strong { font-family: 'Merriweather', serif; font-size: 22px; color: #fff; }
    .foot p { margin: 8px 0; } .foot small { color: #8fa3bf; }
    @media (max-width: 760px) {
      .burger { display: block; } nav { display: none; width: 100%; flex-direction: column; align-items: stretch; gap: 10px; padding: 14px 0 6px; } nav.open { display: flex; }
      nav > a:not(.btn) { padding: 6px 0; } nav .btn { width: 100%; padding: 10px; }
    }
  `],
})
export class PublicLayoutComponent {
  open = false;
  year = new Date().getFullYear();
  constructor(public auth: AuthService) {}
}
