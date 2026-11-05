import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { errorText } from '../../core/auth.interceptor';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wrap">
      <form class="card box" (ngSubmit)="submit()" #f="ngForm">
        <h1>Mot de passe oublié</h1>
        <p class="sub">Indiquez l'email de votre compte. Nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="alert alert--ok" *ngIf="done">{{ done }}</div>
        <ng-container *ngIf="!done">
          <div class="field"><label for="e">Email</label><input id="e" name="email" type="email" [(ngModel)]="email" autocomplete="email" required /></div>
          <button class="btn btn--block" type="submit" [disabled]="loading || !f.valid">{{ loading ? 'Envoi...' : 'Envoyer le lien' }}</button>
        </ng-container>
        <p class="alt"><a routerLink="/connexion">Retour à la connexion</a></p>
      </form>
    </div>
  `,
  styles: [`
    .wrap { min-height: 70vh; display: grid; place-items: center; padding: 32px 16px; } .box { width: 100%; max-width: 420px; padding: 32px 28px; }
    h1 { font-size: 26px; } .sub { color: var(--muted); margin: 6px 0 20px; font-size: 14px; } .alt { text-align: center; font-size: 14px; margin: 18px 0 0; }
  `],
})
export class ForgotPage {
  email = '';
  loading = false;
  error = '';
  done = '';

  constructor(private api: ApiService) {}

  submit(): void {
    if (this.loading) return;
    this.error = '';
    this.loading = true;
    this.api.post<{ message: string }>('/auth/forgot', { email: this.email.trim().toLowerCase() })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.done = r.message), error: (e) => (this.error = errorText(e, 'Envoi impossible.')) });
  }
}
