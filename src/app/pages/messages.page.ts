import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/auth.interceptor';
import { ContactMessage } from '../models/models';

/** Messagerie : le copropriétaire écrit au syndic, le syndic répond. */
@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <div><h1>Messagerie</h1><p>{{ admin ? 'Messages des copropriétaires' : 'Contactez le syndic' }}</p></div>
      <button class="btn" *ngIf="!admin" (click)="showNew = true">+ Nouveau message</button>
    </div>
    <div class="alert alert--ok" *ngIf="success">{{ success }}</div>
    <div class="alert alert--error" *ngIf="error && !showNew">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>

    <div class="grid" *ngIf="!loading">
      <div class="card" *ngFor="let m of items">
        <div class="head"><strong>{{ m.subject }}</strong><span class="badge" [class.badge--ok]="m.reply" [class.badge--warn]="!m.reply">{{ m.reply ? 'Répondu' : 'En attente' }}</span></div>
        <small>{{ admin ? m.ownerName + ' · ' : '' }}{{ m.createdAt | date:'dd/MM/yyyy HH:mm' }}</small>
        <p>{{ m.content }}</p>
        <p class="reply" *ngIf="m.reply">💬 Syndic : {{ m.reply }}</p>
        <ng-container *ngIf="admin">
          <textarea rows="2" maxlength="3000" placeholder="Votre réponse…" [(ngModel)]="drafts[m.id]"></textarea>
          <button class="btn btn--sm" [disabled]="!drafts[m.id]?.trim()" (click)="reply(m)">{{ m.reply ? 'Modifier la réponse' : 'Répondre' }}</button>
        </ng-container>
      </div>
      <div class="card empty" *ngIf="!items.length">Aucun message.</div>
    </div>

    <div class="modal-bg" *ngIf="showNew" (click)="showNew = false">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="send()" #f="ngForm">
        <h2>Nouveau message</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="field"><label>Objet</label><input name="s" [(ngModel)]="form.subject" maxlength="150" required /></div>
        <div class="field"><label>Message</label><textarea name="c" rows="5" maxlength="3000" [(ngModel)]="form.content" required></textarea></div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="showNew = false">Annuler</button>
          <button type="submit" class="btn" [disabled]="busy || !f.valid">{{ busy ? 'Envoi...' : 'Envoyer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.head { display: flex; justify-content: space-between; gap: 10px; } p { margin: 8px 0; white-space: pre-line; } .reply { background: #f3f5f9; padding: 8px 12px; border-radius: 8px; } textarea { width: 100%; margin: 6px 0; }`],
})
export class MessagesPage implements OnInit {
  items: ContactMessage[] = [];
  drafts: Record<number, string> = {};
  form = { subject: '', content: '' };
  showNew = false; loading = false; busy = false; error = ''; success = '';
  constructor(private api: ApiService, private auth: AuthService) {}
  get admin(): boolean { return this.auth.isAdmin(); }
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<ContactMessage[]>(this.admin ? '/admin/messages' : '/messages').pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.items = r), error: (e) => (this.error = errorText(e, 'Chargement impossible.')) });
  }
  send(): void {
    this.busy = true; this.error = '';
    this.api.post<ContactMessage>('/messages', this.form).pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => { this.showNew = false; this.form = { subject: '', content: '' }; this.success = 'Message envoyé.'; this.load(); },
      error: (e) => (this.error = errorText(e, 'Envoi impossible.')),
    });
  }
  reply(m: ContactMessage): void {
    this.api.put<ContactMessage>(`/admin/messages/${m.id}/reply`, { reply: this.drafts[m.id] }).subscribe({
      next: () => { this.drafts[m.id] = ''; this.success = 'Réponse envoyée.'; this.load(); },
      error: (e) => (this.error = errorText(e, 'Envoi impossible.')),
    });
  }
}
