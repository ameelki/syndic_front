import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { errorText } from '../../core/auth.interceptor';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wrap">
      <form class="card box" (ngSubmit)="submit()" #f="ngForm">
        <h1>Connexion</h1>
        <p class="sub">Accédez à votre espace syndic ou copropriétaire.</p>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="field"><label for="e">Email</label><input id="e" name="email" type="email" [(ngModel)]="email" autocomplete="email" required /></div>
        <div class="field"><label for="p">Mot de passe</label><input id="p" name="password" type="password" [(ngModel)]="password" autocomplete="current-password" required /></div>
        <button class="btn btn--block" type="submit" [disabled]="loading || !f.valid">{{ loading ? 'Connexion...' : 'Se connecter' }}</button>
        <p class="alt">Pas encore de compte ? <a routerLink="/inscription">Créer un compte</a></p>
      </form>
    </div>
  `,
  styles: [`
    .wrap { min-height: 70vh; display: grid; place-items: center; padding: 32px 16px; } .box { width: 100%; max-width: 420px; padding: 28px; }
    h1 { font-size: 26px; } .sub { color: var(--muted); margin: 6px 0 20px; font-size: 14px; } .alt { text-align: center; font-size: 14px; margin: 18px 0 0; }
  `],
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    if (this.loading) return;
    this.error = '';
    this.loading = true;
    this.auth.login(this.email.trim(), this.password).pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => this.router.navigateByUrl(this.auth.homeUrl()),
      error: (e) => (this.error = errorText(e, 'Connexion impossible.')),
    });
  }
}
