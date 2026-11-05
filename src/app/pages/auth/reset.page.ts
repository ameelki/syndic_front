import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { errorText } from '../../core/auth.interceptor';

/** Page ouverte depuis l'email : choisir un nouveau mot de passe (ou définir le sien après une invitation). */
@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wrap">
      <form class="card box" (ngSubmit)="submit()" #f="ngForm">
        <h1>Choisir un mot de passe</h1>
        <div class="alert alert--error" *ngIf="!token">Lien incomplet. Ouvrez le lien reçu par email ou refaites une demande.</div>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="alert alert--ok" *ngIf="done">{{ done }}</div>
        <ng-container *ngIf="token && !done">
          <div class="field"><label>Nouveau mot de passe (8 caractères min.)</label><input name="pw" type="password" [(ngModel)]="password" minlength="8" maxlength="72" autocomplete="new-password" required /></div>
          <div class="field"><label>Confirmer le mot de passe</label><input name="pw2" type="password" [(ngModel)]="confirm" autocomplete="new-password" required /></div>
          <button class="btn btn--block" type="submit" [disabled]="loading || !f.valid">{{ loading ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </ng-container>
        <p class="alt"><a routerLink="/connexion">{{ done ? 'Se connecter' : 'Retour à la connexion' }}</a> <span *ngIf="!token || error"> · <a routerLink="/mot-de-passe-oublie">Refaire une demande</a></span></p>
      </form>
    </div>
  `,
  styles: [`
    .wrap { min-height: 70vh; display: grid; place-items: center; padding: 32px 16px; } .box { width: 100%; max-width: 420px; padding: 32px 28px; }
    h1 { font-size: 26px; margin-bottom: 16px; } .alt { text-align: center; font-size: 14px; margin: 18px 0 0; }
  `],
})
export class ResetPage implements OnInit {
  token = '';
  password = '';
  confirm = '';
  loading = false;
  error = '';
  done = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void { this.token = this.route.snapshot.queryParamMap.get('token') ?? ''; }

  submit(): void {
    if (this.loading) return;
    this.error = '';
    if (this.password !== this.confirm) { this.error = 'Les mots de passe ne correspondent pas.'; return; }
    this.loading = true;
    this.api.post<{ message: string }>('/auth/reset', { token: this.token, password: this.password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.done = r.message), error: (e) => (this.error = errorText(e, 'Lien invalide ou expiré.')) });
  }
}
