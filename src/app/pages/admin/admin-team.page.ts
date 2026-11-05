import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { errorText } from '../../core/auth.interceptor';
import { User } from '../../models/models';

/** Équipe du syndic : inviter des collègues gestionnaires (ils choisissent leur mot de passe via un lien par email). */
@Component({
  selector: 'app-admin-team',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <div><h1>Équipe</h1><p>Les gestionnaires qui ont accès à cette agence</p></div>
      <button class="btn" (click)="showNew = true">+ Inviter un gestionnaire</button>
    </div>
    <div class="alert alert--ok" *ngIf="success">{{ success }}</div>
    <div class="alert alert--error" *ngIf="error && !showNew">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>
    <div class="table-wrap" *ngIf="!loading && list.length">
      <table class="table">
        <thead><tr><th>Nom</th><th>Email</th><th>Depuis</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let u of list">
            <td data-label="Nom"><strong>{{ u.firstName }} {{ u.lastName }}</strong> <span class="badge badge--blue" *ngIf="u.id === auth.user()?.id">Vous</span></td>
            <td data-label="Email">{{ u.email }}</td><td data-label="Depuis">{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
            <td class="actions-cell"><div class="actions"><button class="btn btn--sm btn--danger" *ngIf="u.id !== auth.user()?.id" (click)="remove(u)">Retirer</button></div></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal-bg" *ngIf="showNew" (click)="showNew = false">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="invite()" #f="ngForm">
        <h2>Inviter un gestionnaire</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="row">
          <div class="field"><label>Prénom</label><input name="fn" [(ngModel)]="form.firstName" maxlength="100" required /></div>
          <div class="field"><label>Nom</label><input name="ln" [(ngModel)]="form.lastName" maxlength="100" required /></div>
        </div>
        <div class="field"><label>Email</label><input name="em" type="email" [(ngModel)]="form.email" required /></div>
        <p class="hint">Un email avec un lien valable 72 heures lui permet de choisir son mot de passe. Il aura les mêmes droits que vous sur cette agence.</p>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="showNew = false">Annuler</button>
          <button type="submit" class="btn" [disabled]="busy || !f.valid">{{ busy ? 'Envoi...' : 'Envoyer l’invitation' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.hint { font-size: 13px; color: var(--muted); }`],
})
export class AdminTeamPage implements OnInit {
  list: User[] = [];
  loading = false;
  busy = false;
  error = '';
  success = '';
  showNew = false;
  form = { firstName: '', lastName: '', email: '' };

  constructor(private api: ApiService, public auth: AuthService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<User[]>('/admin/staff').pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.list = r), error: (e) => (this.error = errorText(e)) });
  }

  invite(): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.api.post('/admin/staff', this.form).pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => { this.showNew = false; this.form = { firstName: '', lastName: '', email: '' }; this.success = 'Invitation envoyée.'; setTimeout(() => (this.success = ''), 3500); this.load(); },
      error: (e) => (this.error = errorText(e)),
    });
  }

  remove(u: User): void {
    if (!confirm(`Retirer l'accès de ${u.firstName} ${u.lastName} ?`)) return;
    this.api.delete(`/admin/staff/${u.id}`).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e)) });
  }
}
