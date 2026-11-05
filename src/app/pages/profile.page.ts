import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/auth.interceptor';
import { saveBlob } from '../shared/files';

/** Mon compte : mot de passe, export de mes données et suppression du compte (RGPD). */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-head"><div><h1>Mon compte</h1><p>{{ auth.user()?.firstName }} {{ auth.user()?.lastName }} · {{ auth.user()?.email }}</p></div></div>
    <div class="alert alert--ok" *ngIf="success">{{ success }}</div>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>

    <div class="grid grid--2">
      <form class="card" (ngSubmit)="changePassword()" #f="ngForm">
        <h3>Changer mon mot de passe</h3>
        <div class="field"><label>Mot de passe actuel</label><input name="cur" type="password" [(ngModel)]="pw.currentPassword" autocomplete="current-password" required /></div>
        <div class="field"><label>Nouveau mot de passe (8 caractères min.)</label><input name="new" type="password" [(ngModel)]="pw.newPassword" minlength="8" maxlength="72" autocomplete="new-password" required /></div>
        <div class="field"><label>Confirmer</label><input name="conf" type="password" [(ngModel)]="confirm" autocomplete="new-password" required /></div>
        <button class="btn" type="submit" [disabled]="busy || !f.valid">Enregistrer</button>
      </form>

      <div class="card">
        <h3>Mes données personnelles</h3>
        <p class="muted">Téléchargez une copie de toutes les données enregistrées à votre sujet (profil, lots, charges, signalements, messages, réservations, votes).</p>
        <button class="btn btn--ghost" (click)="exportData()" [disabled]="busy">Télécharger mes données</button>
        <hr />
        <h3>Supprimer mon compte</h3>
        <p class="muted">Vos informations personnelles sont effacées. Les écritures comptables (charges) sont conservées sans votre nom. Cette action est définitive.</p>
        <div class="field"><label>Votre mot de passe</label><input name="delpw" type="password" [(ngModel)]="deletePassword" autocomplete="current-password" /></div>
        <button class="btn btn--danger" (click)="deleteAccount()" [disabled]="busy || !deletePassword">Supprimer mon compte</button>
      </div>
    </div>
  `,
  styles: [`h3 { font-size: 17px; margin-bottom: 12px; } .muted { color: var(--muted); font-size: 14px; margin: 0 0 12px; } hr { border: 0; border-top: 1px solid var(--line); margin: 20px 0; }`],
})
export class ProfilePage {
  pw = { currentPassword: '', newPassword: '' };
  confirm = '';
  deletePassword = '';
  busy = false;
  error = '';
  success = '';

  constructor(private api: ApiService, public auth: AuthService) {}

  private flash(m: string): void { this.success = m; this.error = ''; setTimeout(() => (this.success = ''), 3500); }

  changePassword(): void {
    this.error = '';
    if (this.pw.newPassword !== this.confirm) { this.error = 'Les mots de passe ne correspondent pas.'; return; }
    this.busy = true;
    this.api.post('/me/password', this.pw).pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => { this.pw = { currentPassword: '', newPassword: '' }; this.confirm = ''; this.flash('Mot de passe modifié.'); },
      error: (e) => (this.error = errorText(e)),
    });
  }

  exportData(): void {
    this.busy = true;
    this.api.get<unknown>('/me/export').pipe(finalize(() => (this.busy = false))).subscribe({
      next: (d) => saveBlob(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }), 'mes-donnees.json'),
      error: (e) => (this.error = errorText(e)),
    });
  }

  deleteAccount(): void {
    if (!confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) return;
    this.busy = true;
    this.api.request('DELETE', '/me', { password: this.deletePassword }).pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => this.auth.logout(),
      error: (e) => (this.error = errorText(e)),
    });
  }
}
