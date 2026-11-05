import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AgencyStore } from '../../core/agency.store';
import { errorText } from '../../core/auth.interceptor';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wrap">
      <div class="card box" *ngIf="!agency.registrable()">
        <h1>Lien d'inscription requis</h1>
        <div class="alert alert--warn" style="margin-top:16px">Chaque syndic a son propre lien. Utilisez le lien d'inscription que votre syndic vous a envoyé.</div>
        <a routerLink="/connexion" class="btn btn--ghost btn--block">Se connecter</a>
      </div>
      <div class="card box" *ngIf="agency.registrable() && done; else formTpl">
        <h1>Demande envoyée ✔</h1>
        <div class="alert alert--ok" style="margin-top:16px">{{ done }}</div>
        <p class="sub">Vous pourrez vous connecter dès que le syndic aura validé votre compte.</p>
        <a routerLink="/" class="btn btn--ghost btn--block">Retour à l'accueil</a>
      </div>
      <ng-template #formTpl>
        <form *ngIf="agency.registrable()" class="card box" (ngSubmit)="submit()" #f="ngForm">
          <h1>Créer mon compte</h1>
          <p class="sub">Réservé aux copropriétaires. Votre compte sera validé par le syndic.</p>
          <div class="alert alert--error" *ngIf="error">{{ error }}</div>
          <div class="row">
            <div class="field"><label>Prénom</label><input name="fn" [(ngModel)]="form.firstName" maxlength="100" required /></div>
            <div class="field"><label>Nom</label><input name="ln" [(ngModel)]="form.lastName" maxlength="100" required /></div>
          </div>
          <div class="field"><label>Email</label><input name="em" type="email" [(ngModel)]="form.email" autocomplete="email" required /></div>
          <div class="field" *ngIf="buildings.length">
            <label>Bâtiment / résidence</label>
            <select name="bld" [(ngModel)]="buildingName"><option value="">— Choisir —</option><option *ngFor="let b of buildings" [value]="b.name">{{ b.name }}{{ b.city ? ' (' + b.city + ')' : '' }}</option></select>
          </div>
          <div class="row">
            <div class="field"><label>Téléphone</label><input name="ph" type="tel" [(ngModel)]="form.phone" maxlength="40" /></div>
            <div class="field"><label>N° de lot (appartement)</label><input name="lot" [(ngModel)]="form.requestedLot" maxlength="40" placeholder="Ex : A12" /></div>
          </div>
          <div class="field"><label>Mot de passe (8 caractères min.)</label><input name="pw" type="password" [(ngModel)]="form.password" minlength="8" maxlength="72" autocomplete="new-password" required /></div>
          <div class="field"><label>Confirmer le mot de passe</label><input name="pw2" type="password" [(ngModel)]="confirm" autocomplete="new-password" required /></div>
          <div class="field field--check"><input id="t" name="t" type="checkbox" [(ngModel)]="form.termsAccepted" /><label for="t">J'accepte les conditions d'utilisation</label></div>
          <button class="btn btn--block" type="submit" [disabled]="loading || !f.valid || !form.termsAccepted">{{ loading ? 'Envoi...' : 'Envoyer ma demande' }}</button>
          <p class="alt">Déjà inscrit ? <a routerLink="/connexion">Se connecter</a></p>
        </form>
      </ng-template>
    </div>
  `,
  styles: [`
    .wrap { min-height: 70vh; display: grid; place-items: center; padding: 32px 16px; } .box { width: 100%; max-width: 520px; padding: 28px; }
    h1 { font-size: 26px; } .sub { color: var(--muted); margin: 6px 0 20px; font-size: 14px; } .alt { text-align: center; font-size: 14px; margin: 18px 0 0; }
  `],
})
export class RegisterPage implements OnInit {
  buildings: { id: number; name: string; city: string }[] = [];
  buildingName = '';
  form = { firstName: '', lastName: '', email: '', phone: '', requestedLot: '', password: '', termsAccepted: false };
  confirm = '';
  loading = false;
  error = '';
  done = '';

  constructor(private auth: AuthService, private api: ApiService, public agency: AgencyStore) {}

  ngOnInit(): void {
    if (!this.agency.slug) return;
    this.api.get<{ id: number; name: string; city: string }[]>('/auth/buildings', { agency: this.agency.slug }).subscribe({ next: (b) => (this.buildings = b), error: () => {} });
  }

  submit(): void {
    if (this.loading || !this.agency.slug) return;
    this.error = '';
    if (this.form.password !== this.confirm) { this.error = 'Les mots de passe ne correspondent pas.'; return; }
    this.loading = true;
    this.auth.register({ ...this.form, email: this.form.email.trim().toLowerCase(), phone: this.form.phone || null, requestedLot: [this.buildingName, this.form.requestedLot].filter((x) => !!x).join(' — ').slice(0, 120) || null })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.done = r.message), error: (e) => (this.error = errorText(e, 'Inscription impossible.')) });
  }
}
