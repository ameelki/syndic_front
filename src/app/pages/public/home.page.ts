import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <div class="hero__in">
        <span class="tag">Gestion de copropriété</span>
        <h1>Votre copropriété, enfin simple et transparente.</h1>
        <p>Appels de fonds, dépenses, incidents, assemblées générales et votes en ligne : le syndic et les copropriétaires partagent les mêmes informations, en temps réel.</p>
        <div class="cta">
          <a routerLink="/inscription" class="btn btn--gold">Je suis copropriétaire — créer mon compte</a>
          <a routerLink="/connexion" class="btn btn--ghost light">Se connecter</a>
        </div>
      </div>
    </section>

    <section id="fonctions" class="sec">
      <h2>Tout ce dont une copropriété a besoin</h2>
      <p class="lead">Un outil unique pour le syndic et un portail dédié pour chaque copropriétaire.</p>
      <div class="feats">
        <article class="card" *ngFor="let f of features"><div class="ico">{{ f.icon }}</div><h3>{{ f.title }}</h3><p>{{ f.text }}</p></article>
      </div>
    </section>

    <section id="fonctionnement" class="sec sec--alt">
      <h2>Comment ça marche</h2>
      <div class="steps">
        <div class="step" *ngFor="let s of steps; let i = index"><b>{{ i + 1 }}</b><h3>{{ s.title }}</h3><p>{{ s.text }}</p></div>
      </div>
      <div class="center"><a routerLink="/inscription" class="btn">Commencer maintenant</a></div>
    </section>
  `,
  styles: [`
    .hero { background: linear-gradient(135deg, var(--navy-dark), var(--navy) 60%, #2d5586); color: #fff; padding: 84px 24px; }
    .hero__in { max-width: 820px; margin: 0 auto; text-align: center; }
    .tag { display: inline-block; background: rgba(200,150,62,.2); color: #f0c97a; padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 18px; }
    .hero h1 { color: #fff; font-size: clamp(28px, 5vw, 46px); margin-bottom: 18px; }
    .hero p { font-size: 17px; color: #cfd8e6; max-width: 640px; margin: 0 auto 28px; }
    .cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; } .light { color: #fff; border-color: rgba(255,255,255,.4); } .light:hover { background: rgba(255,255,255,.1); }
    .sec { max-width: 1100px; margin: 0 auto; padding: 64px 20px; text-align: center; } .sec--alt { max-width: none; background: #fff; }
    .sec h2 { font-size: clamp(24px, 4vw, 32px); } .lead { color: var(--muted); margin: 8px 0 32px; }
    .feats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 18px; text-align: left; }
    .ico { font-size: 30px; margin-bottom: 8px; } .feats h3 { font-size: 17px; margin-bottom: 6px; } .feats p { margin: 0; color: var(--muted); font-size: 14px; }
    .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 24px; max-width: 1000px; margin: 32px auto; text-align: left; }
    .step b { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--navy); color: #fff; margin-bottom: 10px; }
    .step h3 { font-size: 17px; } .step p { color: var(--muted); font-size: 14px; } .center { text-align: center; }
  `],
})
export class HomePage {
  features = [
    { icon: '💶', title: 'Appels de fonds', text: 'Répartition automatique des charges selon les tantièmes, suivi des paiements et des impayés.' },
    { icon: '🧾', title: 'Comptabilité & dépenses', text: 'Toutes les dépenses classées par catégorie et fournisseur, avec le total de l’année.' },
    { icon: '⚠️', title: 'Incidents', text: 'Les copropriétaires signalent un problème, le syndic le suit jusqu’à sa résolution.' },
    { icon: '🗳', title: 'Assemblées & votes', text: 'Convocations, ordre du jour, résolutions et vote en ligne pondéré par les tantièmes.' },
    { icon: '📢', title: 'Annonces', text: 'Informez tous les résidents instantanément, avec mise en avant des messages importants.' },
    { icon: '📄', title: 'Documents', text: 'Règlement, procès-verbaux, contrats et budgets accessibles à tous au même endroit.' },
    { icon: '🛠', title: 'Suivi des travaux', text: 'Planification, budget, fournisseur et avancement de chaque chantier.' },
    { icon: '🔐', title: 'Accès validés', text: 'Chaque inscription est validée par le syndic avant l’accès aux informations.' },
  ];
  steps = [
    { title: 'Inscrivez-vous', text: 'Le copropriétaire crée son compte avec son numéro de lot.' },
    { title: 'Validation par le syndic', text: 'Le syndic vérifie la demande et rattache le copropriétaire à son lot.' },
    { title: 'Accédez à votre espace', text: 'Charges, incidents, annonces, documents et votes en ligne, sur ordinateur comme sur mobile.' },
  ];
}
