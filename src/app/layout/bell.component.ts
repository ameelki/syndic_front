import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AppNotification } from '../models/models';
import { IconComponent } from '../shared/icons.component';

/** Cloche de notifications : compteur, liste des 30 dernières, vérification toutes les 60 secondes. */
@Component({
  selector: 'app-bell',
  standalone: true,
  imports: [CommonModule, DatePipe, IconComponent],
  template: `
    <button class="bell" (click)="toggle()" [attr.aria-label]="'Notifications'" [class.bell--dark]="dark">
      <app-icon name="bell" [size]="20" />
      <span class="bell__n" *ngIf="unread > 0">{{ unread > 9 ? '9+' : unread }}</span>
    </button>
    <div class="bell__bg" *ngIf="open" (click)="open = false"></div>
    <div class="bell__panel" *ngIf="open">
      <div class="bell__head"><strong>Notifications</strong><button class="bell__all" *ngIf="unread > 0" (click)="readAll()">Tout marquer comme lu</button></div>
      <div class="bell__empty" *ngIf="!items.length">Aucune notification.</div>
      <button class="bell__item" *ngFor="let n of items" [class.bell__item--new]="!n.readAt" (click)="go(n)">
        <strong>{{ n.title }}</strong><span *ngIf="n.body">{{ n.body }}</span><small>{{ n.createdAt | date:'dd/MM HH:mm' }}</small>
      </button>
    </div>
  `,
  styles: [`
    :host { position: relative; display: inline-flex; }
    .bell { position: relative; background: transparent; border: 0; color: inherit; padding: 6px; display: inline-flex; border-radius: 8px; }
    .bell:hover { background: rgba(255,255,255,.1); }
    .bell__n { position: absolute; top: 0; right: 0; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px; background: var(--gold); color: var(--on-gold, #1f2b33); font-size: 11px; font-weight: 700; display: grid; place-items: center; }
    :host-context(.side__brand) .bell__panel { left: 262px; right: auto; top: 14px; }
    .bell__bg { position: fixed; inset: 0; z-index: 190; }
    .bell__panel { position: fixed; top: 54px; right: 12px; z-index: 200; width: min(380px, calc(100vw - 24px)); max-height: 70vh; overflow-y: auto; background: #fff; color: var(--text); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 16px 40px rgba(20,29,35,.25); }
    .bell__head { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-bottom: 1px solid var(--line); position: sticky; top: 0; background: #fff; }
    .bell__all { background: none; border: 0; color: var(--blue); font-size: 13px; cursor: pointer; }
    .bell__empty { padding: 28px 14px; text-align: center; color: var(--muted); }
    .bell__item { display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left; padding: 11px 14px; border: 0; border-bottom: 1px solid var(--line); background: #fff; cursor: pointer; font: inherit; color: inherit; }
    .bell__item:hover { background: #f5f8f8; } .bell__item--new { background: #fbf6e8; } .bell__item span { font-size: 13px; color: var(--muted); white-space: pre-line; } .bell__item small { color: var(--muted); font-size: 12px; }
  `],
})
export class BellComponent implements OnInit, OnDestroy {
  items: AppNotification[] = [];
  unread = 0;
  open = false;
  dark = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void { this.refresh(); this.timer = setInterval(() => this.refresh(), 60000); }
  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  refresh(): void {
    this.api.get<{ unread: number; items: AppNotification[] }>('/notifications').subscribe({ next: (r) => { this.unread = r.unread; this.items = r.items; }, error: () => {} });
  }

  toggle(): void { this.open = !this.open; if (this.open) this.refresh(); }

  readAll(): void { this.api.post('/notifications/read-all').subscribe({ next: () => this.refresh(), error: () => {} }); }

  go(n: AppNotification): void {
    this.open = false;
    if (!n.readAt) this.api.post(`/notifications/${n.id}/read`).subscribe({ next: () => this.refresh(), error: () => {} });
    if (n.link && n.link.startsWith('/app/')) this.router.navigateByUrl(n.link);
  }
}
