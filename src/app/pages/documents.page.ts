import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Observable, switchMap, of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { BuildingStore } from '../core/building.store';
import { errorText } from '../core/auth.interceptor';
import { DocumentItem } from '../models/models';
import { DOC_CAT, opts } from '../shared/labels';
import { saveBlob } from '../shared/files';

/** Coffre de documents : fichiers (PDF, images, Word, Excel) ou liens, avec visibilité réservée au syndic. */
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <div><h1>Documents</h1><p>Règlement, procès-verbaux, contrats et budgets</p></div>
      <button class="btn" *ngIf="isAdmin" (click)="openNew()">+ Ajouter un document</button>
    </div>
    <div class="alert alert--error" *ngIf="error && !showForm">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>
    <div class="table-wrap" *ngIf="!loading && list.length">
      <table class="table">
        <thead><tr><th>Titre</th><th>Catégorie</th><th>Bâtiment</th><th>Ajouté le</th><th>Fichier</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let d of list">
            <td data-label="Titre"><strong>{{ d.title }}</strong> <span class="badge badge--warn" *ngIf="isAdmin && d.ownersVisible === false">Syndic seul</span><br /><small *ngIf="d.notes">{{ d.notes }}</small></td>
            <td data-label="Catégorie">{{ cat[d.category] || d.category }}</td>
            <td data-label="Bâtiment">{{ d.buildingId ? store.nameOf(d.buildingId) : 'Général' }}</td>
            <td data-label="Ajouté le">{{ d.createdAt | date:'dd/MM/yyyy' }}</td>
            <td data-label="Fichier">
              <button class="btn btn--sm btn--ghost" *ngIf="d.fileName" (click)="download(d)">Télécharger · {{ size(d.fileSize) }}</button>
              <a *ngIf="d.url" [href]="d.url" target="_blank" rel="noopener noreferrer">Ouvrir le lien</a>
              <span *ngIf="!d.fileName && !d.url" class="muted">—</span>
            </td>
            <td class="actions-cell"><div class="actions" *ngIf="isAdmin">
              <button class="btn btn--sm btn--ghost" (click)="edit(d)">Modifier</button>
              <button class="btn btn--sm btn--danger" (click)="remove(d)">Supprimer</button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card empty" *ngIf="!loading && !list.length && !error">Aucun document pour le moment.</div>

    <div class="modal-bg" *ngIf="showForm" (click)="showForm = false">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()" #f="ngForm">
        <h2>{{ form.id ? 'Modifier le document' : 'Nouveau document' }}</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="field"><label>Titre</label><input name="t" [(ngModel)]="form.title" maxlength="150" required /></div>
        <div class="row">
          <div class="field"><label>Catégorie</label><select name="c" [(ngModel)]="form.category"><option *ngFor="let o of catOpts" [value]="o.value">{{ o.label }}</option></select></div>
          <div class="field"><label>Bâtiment</label><select name="b" [(ngModel)]="form.buildingId"><option [ngValue]="null">Général</option><option *ngFor="let b of store.list" [ngValue]="b.id">{{ b.name }}</option></select></div>
        </div>
        <div class="field"><label>Fichier (PDF, image, Word, Excel — 10 Mo max)</label>
          <input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xls,.xlsx" (change)="pick($event)" />
          <small class="muted" *ngIf="form.fileName">Fichier actuel : {{ form.fileName }} (choisir un autre fichier le remplace)</small></div>
        <div class="field"><label>… ou lien externe (Drive, Dropbox)</label><input name="u" [(ngModel)]="form.url" maxlength="500" placeholder="https://…" /></div>
        <div class="field"><label>Notes</label><textarea name="n" rows="2" maxlength="1000" [(ngModel)]="form.notes"></textarea></div>
        <div class="field field--check"><input id="ov" name="ov" type="checkbox" [(ngModel)]="visibleToOwners" /><label for="ov">Visible par les copropriétaires</label></div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="showForm = false">Annuler</button>
          <button type="submit" class="btn" [disabled]="busy || !f.valid">{{ busy ? 'Enregistrement...' : 'Enregistrer' }}</button>
        </div>
      </form>
    </div>
  `,
  styles: [`.muted { color: var(--muted); }`],
})
export class DocumentsPage implements OnInit {
  list: DocumentItem[] = [];
  cat: Record<string, string> = DOC_CAT;
  catOpts = opts.DOC_CAT;
  loading = false;
  busy = false;
  error = '';
  showForm = false;
  form: Partial<DocumentItem> = {};
  visibleToOwners = true;
  file: File | null = null;

  constructor(private api: ApiService, private auth: AuthService, public store: BuildingStore) {}

  get isAdmin(): boolean { return this.auth.isAdmin(); }
  ngOnInit(): void { this.load(); }

  size(n?: number): string { return !n ? '' : n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' Ko' : (n / 1048576).toFixed(1) + ' Mo'; }

  load(): void {
    this.loading = true;
    this.api.get<DocumentItem[]>('/documents').pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.list = r), error: (e) => (this.error = errorText(e)) });
  }

  openNew(): void { this.form = { category: 'OTHER', buildingId: this.store.selectedId, title: '', url: '', notes: '' }; this.visibleToOwners = true; this.file = null; this.error = ''; this.showForm = true; }
  edit(d: DocumentItem): void { this.form = { ...d }; this.visibleToOwners = d.ownersVisible !== false; this.file = null; this.error = ''; this.showForm = true; }
  pick(ev: Event): void { this.file = (ev.target as HTMLInputElement).files?.[0] ?? null; }

  save(): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    const body = { ...this.form, ownersVisible: this.visibleToOwners };
    const saved$: Observable<DocumentItem> = this.form.id ? this.api.put<DocumentItem>(`/documents/${this.form.id}`, body) : this.api.post<DocumentItem>('/documents', body);
    saved$.pipe(
      switchMap((d) => (this.file ? this.api.upload<DocumentItem>(`/documents/${d.id}/file`, this.file, this.file.name) : of(d))),
      finalize(() => (this.busy = false)),
    ).subscribe({ next: () => { this.showForm = false; this.load(); }, error: (e) => { this.error = errorText(e); this.load(); } });
  }

  download(d: DocumentItem): void {
    this.api.getBlob(`/documents/${d.id}/file`).subscribe({ next: (b) => saveBlob(b, d.fileName || 'document'), error: (e) => (this.error = errorText(e, 'Téléchargement impossible.')) });
  }

  remove(d: DocumentItem): void {
    if (!confirm('Supprimer ce document ?')) return;
    this.api.delete(`/documents/${d.id}`).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e)) });
  }
}
