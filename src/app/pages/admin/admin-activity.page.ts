import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { errorText } from '../../core/auth.interceptor';
import { ActivityEntry } from '../../models/models';

/** Journal d'activité : qui a fait quoi, et quand (200 dernières actions). */
@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="page-head"><div><h1>Journal d'activité</h1><p>Les 200 dernières actions du syndic</p></div></div>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
    <div class="spinner" *ngIf="loading"></div>
    <div class="table-wrap" *ngIf="!loading && items.length">
      <table class="table">
        <thead><tr><th>Date</th><th>Qui</th><th>Action</th><th>Détail</th></tr></thead>
        <tbody>
          <tr *ngFor="let a of items">
            <td data-label="Date">{{ a.createdAt | date:'dd/MM/yyyy HH:mm' }}</td><td data-label="Qui">{{ a.actorName }}</td>
            <td data-label="Action"><strong>{{ a.action }}</strong></td><td data-label="Détail">{{ a.target }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="card empty" *ngIf="!loading && !items.length && !error">Aucune activité enregistrée pour le moment.</div>
  `,
})
export class AdminActivityPage implements OnInit {
  items: ActivityEntry[] = [];
  loading = false;
  error = '';

  constructor(private api: ApiService) {}
  ngOnInit(): void {
    this.loading = true;
    this.api.get<ActivityEntry[]>('/admin/activity').pipe(finalize(() => (this.loading = false)))
      .subscribe({ next: (r) => (this.items = r), error: (e) => (this.error = errorText(e)) });
  }
}
