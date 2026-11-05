import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../shared/icons.component';
import { AgencyStore } from '../../core/agency.store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <section class="hero">
      <div class="hero__in">
        <div class="hero__txt">
          <h1>Votre copropriété, enfin simple et transparente.</h1>
          <p *ngIf="agency.agency().tagline as tagline; else lead">{{ tagline }}</p>
          <ng-template #lead><p>Appels de fonds, dépenses, incidents, assemblées générales et votes en ligne : le syndic et les copropriétaires partagent les mêmes informations, en temps réel.</p></ng-template>
          <div class="cta">
            <a *ngIf="agency.registrable()" routerLink="/inscription" class="btn btn--gold">Je suis copropriétaire — créer mon compte</a>
            <a routerLink="/connexion" class="btn btn--ghost light">Se connecter</a>
          </div>
        </div>
        <div class="facade" aria-hidden="true">
          <span class="win" *ngFor="let w of windows" [class.lit]="w >= 0" [style.--i]="w"></span>
        </div>
      </div>
    </section>

    <section id="fonctions" class="sec">
      <h2>Tout ce dont une copropriété a besoin</h2>
      <p class="lead">Un outil unique pour le syndic et un portail dédié pour chaque copropriétaire.</p>
      <div class="feats">
        <article *ngFor="let f of features"><app-icon [name]="f.icon" [size]="24" /><h3>{{ f.title }}</h3><p>{{ f.text }}</p></article>
      </div>
    </section>

    <section id="fonctionnement" class="sec sec--alt">
      <div class="sec__in">
        <h2>Comment ça marche</h2>
        <div class="steps">
          <div class="step" *ngFor="let s of steps; let i = index"><b>{{ i + 1 }}</b><h3>{{ s.title }}</h3><p>{{ s.text }}</p></div>
        </div>
        <a *ngIf="agency.registrable()" routerLink="/inscription" class="btn">Commencer maintenant</a>
      </div>
    </section>
  `,
  styles: [`
    .hero { background: var(--navy); color: #fff; padding: 72px 24px 80px; }
    .hero__in { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr); gap: 56px; align-items: center; }
    .hero h1 { color: #fff; font-size: clamp(34px, 5.4vw, 58px); font-weight: 800; letter-spacing: -.03em; line-height: 1.04; margin-bottom: 20px; }
    .hero p { font-size: 17px; line-height: 1.6; color: #c3ced3; max-width: 52ch; margin: 0 0 30px; }
    .cta { display: flex; gap: 12px; flex-wrap: wrap; } .light { color: #fff; border-color: rgba(255,255,255,.35); } .light:hover { background: rgba(255,255,255,.1); }
    .facade { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; padding: 18px; background: #18232a; border-radius: 14px 14px 0 0; border: 1px solid rgba(255,255,255,.08); border-bottom: 0; max-width: 340px; width: 100%; justify-self: end; }
    .win { aspect-ratio: 3 / 4; border-radius: 3px; background: #2b3a44; }
    .win.lit { animation: lightup .7s ease-out both; animation-delay: calc(var(--i) * 170ms + 400ms); }
    @keyframes lightup { from { background: #2b3a44; box-shadow: none; } to { background: var(--gold); box-shadow: 0 0 14px rgba(240,180,41,.45); } }
    .sec { max-width: 1100px; margin: 0 auto; padding: 72px 24px; } .sec--alt { max-width: none; background: #fff; border-top: 1px solid var(--line); } .sec__in { max-width: 1100px; margin: 0 auto; }
    .sec h2 { font-size: clamp(26px, 4vw, 36px); max-width: 22ch; } .lead { color: var(--muted); margin: 10px 0 36px; max-width: 56ch; font-size: 16px; }
    .feats { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 28px 32px; }
    .feats article { border-top: 2px solid var(--navy); padding-top: 16px; } .feats app-icon { color: var(--blue); margin-bottom: 10px; }
    .feats h3 { font-size: 18px; margin-bottom: 6px; } .feats p { margin: 0; color: var(--muted); font-size: 14.5px; }
    .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 28px; margin: 32px 0 36px; }
    .step b { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 8px; background: var(--navy); color: var(--gold); font-family: var(--font-display); font-size: 18px; margin-bottom: 12px; }
    .step h3 { font-size: 18px; margin-bottom: 4px; } .step p { color: var(--muted); font-size: 14.5px; margin: 0; }
    @media (max-width: 860px) { .hero { padding: 48px 20px 0; } .hero__in { grid-template-columns: 1fr; gap: 36px; } .facade { justify-self: center; max-width: 300px; } }
  `],
})
export class HomePage {
  constructor(public agency: AgencyStore) {}

  /** Façade : -1 = fenêtre éteinte, sinon rang d'allumage. */
  windows = [-1, 2, -1, -1, -1, -1, -1, 4, -1, 0, -1, -1, -1, 3, -1, 1, -1, -1, -1, -1, -1, -1, 5, -1, -1];
  features = [
    { icon: 'euro', title: 'Appels de fonds', text: 'Répartition automatique des charges selon les tantièmes, suivi des paiements et des impayés.' },
    { icon: 'receipt', title: 'Comptabilité & dépenses', text: 'Toutes les dépenses classées par catégorie et fournisseur, avec le total de l’année.' },
    { icon: 'alert', title: 'Incidents', text: 'Les copropriétaires signalent un problème, le syndic le suit jusqu’à sa résolution.' },
    { icon: 'vote', title: 'Assemblées & votes', text: 'Convocations, ordre du jour, résolutions et vote en ligne pondéré par les tantièmes.' },
    { icon: 'megaphone', title: 'Annonces', text: 'Informez tous les résidents instantanément, avec mise en avant des messages importants.' },
    { icon: 'doc', title: 'Documents', text: 'Règlement, procès-verbaux, contrats et budgets accessibles à tous au même endroit.' },
    { icon: 'tools', title: 'Suivi des travaux', text: 'Planification, budget, fournisseur et avancement de chaque chantier.' },
    { icon: 'lock', title: 'Accès validés', text: 'Chaque inscription est validée par le syndic avant l’accès aux informations.' },
  ];
  steps = [
    { title: 'Inscrivez-vous', text: 'Le copropriétaire crée son compte avec son numéro de lot.' },
    { title: 'Validation par le syndic', text: 'Le syndic vérifie la demande et rattache le copropriétaire à son lot.' },
    { title: 'Accédez à votre espace', text: 'Charges, incidents, annonces, documents et votes en ligne, sur ordinateur comme sur mobile.' },
  ];
}
