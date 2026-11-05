import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { errorText } from '../../core/auth.interceptor';
import { Intervention } from '../../models/models';

interface SupplierInfo { id: number; name: string; trade?: string; contactName?: string; phone?: string; email?: string; annualCost?: number; contractEnd?: string; notes?: string; }

/** Fiche prestataire : coordonnées, contrat et historique des interventions. */
@Component({
  selector: 'app-supplier-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <a routerLink="/app/admin/suppliers" class="back">← Tous les fournisseurs</a>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
    <div class="spinner" *ngIf="!s && !error"></div>
    <ng-container *ngIf="s">
      <div class="page-head"><div><h1>{{ s.name }}</h1><p>{{ s.trade }}</p></div></div>
      <div class="card info">
        <div *ngIf="s.contactName"><small>Contact</small><strong>{{ s.contactName }}</strong></div>
        <div *ngIf="s.phone"><small>Téléphone</small><strong><a [href]="'tel:' + s.phone">{{ s.phone }}</a></strong></div>
        <div *ngIf="s.email"><small>E-mail</small><strong><a [href]="'mailto:' + s.email">{{ s.email }}</a></strong></div>
        <div *ngIf="s.annualCost"><small>Coût annuel</small><strong>{{ s.annualCost | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
        <div *ngIf="s.contractEnd"><small>Fin de contrat</small><strong>{{ s.contractEnd | date:'dd/MM/yyyy' }}</strong></div>
        <div *ngIf="total"><small>Total des interventions</small><strong>{{ total | currency:'EUR':'symbol':'1.2-2' }}</strong></div>
      </div>

      <div class="head2"><h2>Historique des interventions</h2><button class="btn btn--sm" (click)="showNew = true">+ Intervention</button></div>
      <div class="table-wrap" *ngIf="list.length">
        <table class="table">
          <thead><tr><th>Date</th><th>Intervention</th><th>Coût</th><th>Facture</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let i of list">
              <td data-label="Date">{{ i.interventionDate | date:'dd/MM/yyyy' }}</td><td data-label="Intervention">{{ i.description }}</td>
              <td data-label="Coût">{{ i.cost != null ? (i.cost | currency:'EUR':'symbol':'1.2-2') : '—' }}</td><td data-label="Facture">{{ i.invoiceRef || '—' }}</td>
              <td class="actions-cell"><div class="actions"><button class="btn btn--sm btn--danger" (click)="remove(i)">Supprimer</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card empty" *ngIf="!list.length">Aucune intervention enregistrée pour ce prestataire.</div>
    </ng-container>

    <div class="modal-bg" *ngIf="showNew" (click)="showNew = false">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="add()" #f="ngForm">
        <h2>Nouvelle intervention</h2>
        <div class="alert alert--error" *ngIf="error">{{ error }}</div>
        <div class="row">
          <div class="field"><label>Date</label><input name="d" type="date" [(ngModel)]="form.interventionDate" required /></div>
          <div class="field"><label>Coût (€)</label><input name="c" type="number" step="0.01" min="0" [(ngModel)]="form.cost" /></div>
        </div>
        <div class="field"><label>Description</label><textarea name="t" rows="3" maxlength="500" [(ngModel)]="form.description" required></textarea></div>
        <div class="field"><label>N° de facture</label><input name="i" [(ngModel)]="form.invoiceRef" maxlength="100" /></div>
        <div class="modal__actions"><button type="button" class="btn btn--ghost" (click)="showNew = false">Annuler</button><button class="btn" type="submit" [disabled]="busy || !f.valid">Ajouter</button></div>
      </form>
    </div>
  `,
  styles: [`
    .back { display: inline-block; margin-bottom: 12px; font-size: 14px; }
    .info { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; } .info small { display: block; color: var(--muted); font-size: 13px; } .info strong { color: var(--navy); }
    .head2 { display: flex; justify-content: space-between; align-items: center; margin: 24px 0 12px; } .head2 h2 { font-size: 20px; }
  `],
})
export class SupplierDetailPage implements OnInit {
  s: SupplierInfo | null = null;
  list: Intervention[] = [];
  error = '';
  showNew = false;
  busy = false;
  id = 0;
  form: Partial<Intervention> = { interventionDate: new Date().toISOString().slice(0, 10) };

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  get total(): number { return this.list.reduce((t, i) => t + Number(i.cost ?? 0), 0); }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.get<SupplierInfo>(`/admin/suppliers/${this.id}`).subscribe({ next: (s) => (this.s = s), error: (e) => (this.error = errorText(e, 'Prestataire introuvable.')) });
    this.load();
  }

  load(): void { this.api.get<Intervention[]>(`/admin/suppliers/${this.id}/interventions`).subscribe({ next: (r) => (this.list = r), error: () => {} }); }

  add(): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.api.post(`/admin/suppliers/${this.id}/interventions`, this.form).pipe(finalize(() => (this.busy = false))).subscribe({
      next: () => { this.showNew = false; this.form = { interventionDate: new Date().toISOString().slice(0, 10) }; this.load(); },
      error: (e) => (this.error = errorText(e)),
    });
  }

  remove(i: Intervention): void {
    if (!confirm('Supprimer cette intervention ?')) return;
    this.api.delete(`/admin/interventions/${i.id}`).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e)) });
  }
}
