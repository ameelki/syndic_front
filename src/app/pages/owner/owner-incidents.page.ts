import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BuildingStore } from '../../core/building.store';
import { errorText } from '../../core/auth.interceptor';
import { Incident } from '../../models/models';
import { badgeClass, INCIDENT_STATUS, opts, PRIORITY } from '../../shared/labels';
import { PhotosComponent } from '../../shared/photos.component';
import { compressImage } from '../../shared/files';

@Component({
  selector: 'app-owner-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, PhotosComponent],
  template: `
    <div class="page-head">
      <div><h1>Mes incidents</h1><p>Signalez un problème dans la copropriété et suivez son traitement</p></div>
      <button class="btn" (click)="showNew = true">+ Signaler un incident</button>
    </div>
    <div class="alert alert--ok" *ngIf="success">{{ success }}</div>
    <div class="alert alert--error" *ngIf="error && !showNew">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>

    <div class="grid" *ngIf="!loading">
      <div class="card" *ngFor="let i of items">
        <div class="head"><strong>{{ i.title }}</strong><span><span [class]="badge(i.priority)">{{ prio[i.priority] }}</span> <span [class]="badge(i.status)">{{ st[i.status] }}</span></span></div>
        <p *ngIf="i.description">{{ i.description }}</p>
        <small>📍 {{ i.location || 'Lieu non précisé' }} · {{ i.createdAt | date:'dd/MM/yyyy' }}</small>
        <p class="comment" *ngIf="i.adminComment">💬 Syndic : {{ i.adminComment }}</p>
        <app-photos [incidentId]="i.id" [canAdd]="i.status !== 'RESOLVED'" />
      </div>
      <div class="card empty" *ngIf="!items.length">Vous n'avez signalé aucun incident.</div>
    </div>

    <div class="modal-bg" *ngIf="showNew" (click)="showNew = false">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="send()" #f="ngForm">
        <h2>Signaler un incident</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="field"><label>Titre</label><input name="t" [(ngModel)]="form.title" maxlength="150" placeholder="Ex : Ampoule grillée dans le hall" required /></div>
        <div class="field"><label>Description</label><textarea name="d" rows="3" maxlength="2000" [(ngModel)]="form.description"></textarea></div>
        <div class="field" *ngIf="store.list.length > 1"><label>Bâtiment</label>
          <select name="b" [(ngModel)]="form.buildingId"><option [ngValue]="null">— Choisir —</option><option *ngFor="let b of store.list" [ngValue]="b.id">{{ b.name }}</option></select></div>
        <div class="row">
          <div class="field"><label>Lieu</label><input name="l" [(ngModel)]="form.location" maxlength="150" placeholder="Hall, parking, étage 3…" /></div>
          <div class="field"><label>Urgence</label><select name="p" [(ngModel)]="form.priority"><option *ngFor="let o of prioOpts" [value]="o.value">{{ o.label }}</option></select></div>
        </div>
        <div class="field"><label>Photos (jusqu'à 5)</label>
          <input name="ph" type="file" accept="image/*" multiple (change)="pickFiles($event)" />
          <small class="muted" *ngIf="files.length">{{ files.length }} photo(s) sélectionnée(s)</small></div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="showNew = false">Annuler</button>
          <button type="submit" class="btn" [disabled]="busy || !f.valid">{{ busy ? 'Envoi...' : 'Envoyer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.muted { color: var(--muted); } .head { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; } p { margin: 8px 0; } .comment { background: #f3f5f9; padding: 8px 12px; border-radius: 8px; }`],
})
export class OwnerIncidentsPage implements OnInit {
  items: Incident[] = [];
  prioOpts = opts.PRIORITY;
  st = INCIDENT_STATUS;
  prio = PRIORITY;
  loading = false;
  busy = false;
  error = '';
  success = '';
  showNew = false;
  files: File[] = [];
  form: { title: string; description: string; location: string; priority: string; buildingId: number | null } = { title: '', description: '', location: '', priority: 'MEDIUM', buildingId: null };

  constructor(private api: ApiService, public store: BuildingStore) {}
  ngOnInit(): void { this.load(); }
  badge = (v: string) => badgeClass(v);

  load(): void {
    this.loading = true;
    this.api.get<Incident[]>('/incidents').pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.items = r), error: (e) => (this.error = errorText(e)) });
  }

  pickFiles(ev: Event): void { this.files = Array.from((ev.target as HTMLInputElement).files ?? []).slice(0, 5); }

  /** Envoie les photos choisies (réduites) puis recharge la liste. */
  private async uploadPhotos(id: number): Promise<void> {
    for (const f of this.files) {
      const { blob, name } = await compressImage(f);
      await new Promise<void>((res) => this.api.upload(`/incidents/${id}/photos`, blob, name).subscribe({ next: () => res(), error: () => res() }));
    }
    this.files = [];
    this.load();
  }

  send(): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.api.post<Incident>('/incidents', this.form).pipe(finalize(() => (this.busy = false))).subscribe({
      next: (created) => { if (this.files.length) void this.uploadPhotos(created.id); this.showNew = false; this.form = { title: '', description: '', location: '', priority: 'MEDIUM', buildingId: null }; this.success = 'Incident signalé. Le syndic a été informé.'; setTimeout(() => (this.success = ''), 3500); this.load(); },
      error: (e) => (this.error = errorText(e)),
    });
  }
}
