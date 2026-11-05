import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { errorText } from '../core/auth.interceptor';
import { compressImage } from './files';

interface Photo { id: number; fileName: string; url: string; }

/** Photos d'un signalement : miniatures, ajout (depuis l'appareil photo ou la galerie) et suppression. */
@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ph" *ngIf="photos.length || canAdd">
      <a *ngFor="let p of photos" class="ph__item" [href]="p.url" target="_blank" rel="noopener">
        <img [src]="p.url" [alt]="p.fileName" loading="lazy" />
        <button type="button" class="ph__x" *ngIf="canAdd" (click)="remove(p, $event)" aria-label="Supprimer la photo">×</button>
      </a>
      <label class="ph__add" *ngIf="canAdd && photos.length < 5">
        <input type="file" accept="image/*" capture="environment" hidden (change)="pick($event)" />
        {{ busy ? '…' : '+ Photo' }}
      </label>
    </div>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
  `,
  styles: [`
    .ph { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .ph__item { position: relative; width: 84px; height: 84px; border-radius: 8px; overflow: hidden; border: 1px solid var(--line); display: block; }
    .ph__item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .ph__x { position: absolute; top: 3px; right: 3px; width: 22px; height: 22px; border-radius: 50%; border: 0; background: rgba(20,29,35,.75); color: #fff; line-height: 1; font-size: 16px; padding: 0; }
    .ph__add { width: 84px; height: 84px; border-radius: 8px; border: 1.5px dashed #b5c0c4; display: grid; place-items: center; color: var(--muted); font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; }
    .ph__add:hover { border-color: var(--navy); color: var(--navy); }
  `],
})
export class PhotosComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) incidentId!: number;
  @Input() canAdd = false;
  photos: Photo[] = [];
  busy = false;
  error = '';

  constructor(private api: ApiService) {}

  ngOnChanges(): void { this.load(); }
  ngOnDestroy(): void { this.photos.forEach((p) => URL.revokeObjectURL(p.url)); }

  private load(): void {
    this.api.get<{ id: number; fileName: string }[]>(`/incidents/${this.incidentId}/photos`).subscribe({
      next: (list) => {
        this.photos.forEach((p) => URL.revokeObjectURL(p.url));
        this.photos = [];
        list.forEach((m) => this.api.getBlob(`/incidents/photos/${m.id}/raw`).subscribe({
          next: (b) => (this.photos = [...this.photos, { id: m.id, fileName: m.fileName, url: URL.createObjectURL(b) }].sort((a, c) => a.id - c.id)),
          error: () => {},
        }));
      },
      error: () => {},
    });
  }

  async pick(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f || this.busy) return;
    this.busy = true;
    this.error = '';
    const { blob, name } = await compressImage(f);
    this.api.upload(`/incidents/${this.incidentId}/photos`, blob, name).subscribe({
      next: () => { this.busy = false; this.load(); },
      error: (e) => { this.busy = false; this.error = errorText(e, 'Photo non envoyée.'); },
    });
  }

  remove(p: Photo, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    if (!confirm('Supprimer cette photo ?')) return;
    this.api.delete(`/incidents/photos/${p.id}`).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e)) });
  }
}
