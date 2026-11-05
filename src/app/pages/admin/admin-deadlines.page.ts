import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BuildingStore } from '../../core/building.store';
import { errorText } from '../../core/auth.interceptor';
import { Deadline } from '../../models/models';

const CATEGORIES = ['Ascenseur', 'Assurance', 'Chaudière / chauffage', 'Incendie / sécurité', 'Contrat d’entretien', 'Contrôle réglementaire', 'Autre'];

/** Échéances à surveiller (contrôle d'ascenseur, assurance…). Le syndic est prévenu 30 jours avant. */
@Component({
  selector: 'app-admin-deadlines',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <div><h1>Échéances</h1><p>Contrôles, assurances et contrats à renouveler</p></div>
      <button class="btn" (click)="openNew()">+ Ajouter une échéance</button>
    </div>
    <div class="alert alert--error" *ngIf="error && !showForm">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>
    <div class="table-wrap" *ngIf="!loading && list.length">
      <table class="table">
        <thead><tr><th>Échéance</th><th>Catégorie</th><th>Date</th><th>Répétition</th><th></th></tr></thead>
        <tbody>
          <tr *ngFor="let d of list">
            <td data-label="Échéance"><strong>{{ d.title }}</strong><br /><small>{{ buildingName(d.buildingId) }}</small></td>
            <td data-label="Catégorie">{{ d.category }}</td>
            <td data-label="Date"><span [class]="badge(d)">{{ d.dueDate | date:'dd/MM/yyyy' }}</span></td>
            <td data-label="Répétition">{{ d.recurrenceMonths ? 'Tous les ' + d.recurrenceMonths + ' mois' : '—' }}</td>
            <td class="actions-cell"><div class="actions">
              <button class="btn btn--sm btn--ok" *ngIf="!d.done" (click)="done(d)">Fait</button>
              <button class="btn btn--sm btn--ghost" (click)="edit(d)">Modifier</button>
              <button class="btn btn--sm btn--danger" (click)="remove(d)">Supprimer</button>
            </div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card empty" *ngIf="!loading && !list.length && !error">Aucune échéance. Ajoutez le contrôle de l'ascenseur, l'assurance ou un contrat d'entretien.</div>

    <div class="modal-bg" *ngIf="showForm" (click)="showForm = false">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()" #f="ngForm">
        <h2>{{ form.id ? 'Modifier l’échéance' : 'Nouvelle échéance' }}</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="field"><label>Intitulé</label><input name="t" [(ngModel)]="form.title" maxlength="150" required placeholder="Ex : Contrôle annuel de l'ascenseur" /></div>
        <div class="row">
          <div class="field"><label>Catégorie</label><select name="c" [(ngModel)]="form.category"><option *ngFor="let c of categories" [value]="c">{{ c }}</option></select></div>
          <div class="field"><label>Date limite</label><input name="d" type="date" [(ngModel)]="form.dueDate" required /></div>
        </div>
        <div class="row">
          <div class="field"><label>Bâtiment</label><select name="b" [(ngModel)]="form.buildingId"><option [ngValue]="null">Tous / général</option><option *ngFor="let b of store.list" [ngValue]="b.id">{{ b.name }}</option></select></div>
          <div class="field"><label>Se répète tous les (mois)</label><input name="r" type="number" min="0" max="240" [(ngModel)]="form.recurrenceMonths" placeholder="Ex : 12" /></div>
        </div>
        <div class="field"><label>Notes</label><textarea name="n" rows="3" maxlength="1000" [(ngModel)]="form.notes"></textarea></div>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" (click)="showForm = false">Annuler</button>
          <button type="submit" class="btn" [disabled]="busy || !f.valid">Enregistrer</button>
        </div>
      </form>
    </div>
  `,
})
export class AdminDeadlinesPage implements OnInit {
  categories = CATEGORIES;
  list: Deadline[] = [];
  loading = false;
  busy = false;
  error = '';
  showForm = false;
  form: Partial<Deadline> = {};

  constructor(private api: ApiService, public store: BuildingStore) {}
  ngOnInit(): void { this.load(); }

  buildingName(id?: number | null): string { return id ? (this.store.list.find((b) => b.id === id)?.name ?? '') : 'Général'; }

  badge(d: Deadline): string {
    const days = (new Date(d.dueDate).getTime() - Date.now()) / 86400000;
    return d.done ? 'badge' : days < 0 ? 'badge badge--danger' : days <= 30 ? 'badge badge--warn' : 'badge badge--ok';
  }

  load(): void {
    this.loading = true;
    this.api.get<Deadline[]>('/admin/deadlines').pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.list = r.filter((d) => !d.done)), error: (e) => (this.error = errorText(e)) });
  }

  openNew(): void { this.form = { category: CATEGORIES[0], buildingId: this.store.selectedId, recurrenceMonths: 12, done: false }; this.error = ''; this.showForm = true; }
  edit(d: Deadline): void { this.form = { ...d }; this.error = ''; this.showForm = true; }

  save(): void {
    if (this.busy) return;
    this.busy = true;
    const req = this.form.id ? this.api.put(`/admin/deadlines/${this.form.id}`, this.form) : this.api.post('/admin/deadlines', this.form);
    req.pipe(finalize(() => (this.busy = false))).subscribe({ next: () => { this.showForm = false; this.load(); }, error: (e) => (this.error = errorText(e)) });
  }

  done(d: Deadline): void { this.api.post(`/admin/deadlines/${d.id}/done`).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e)) }); }

  remove(d: Deadline): void {
    if (!confirm('Supprimer cette échéance ?')) return;
    this.api.delete(`/admin/deadlines/${d.id}`).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e)) });
  }
}
