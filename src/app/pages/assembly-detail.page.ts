import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { errorText } from '../core/auth.interceptor';
import { AssemblyView, PersonWeight, ResolutionView } from '../models/models';
import { ASSEMBLY_STATUS, MAJORITY, opts } from '../shared/labels';

@Component({
  selector: 'app-assembly-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <a routerLink="/app/assemblies" class="back">← Toutes les assemblées</a>
    <div class="alert alert--error" *ngIf="error">{{ error }}</div>
    <div class="alert alert--ok" *ngIf="success">{{ success }}</div>
    <div class="spinner" *ngIf="!v && !error"></div>

    <ng-container *ngIf="v">
      <div class="page-head">
        <div><h1>{{ v.assembly.title }}</h1>
          <p>{{ v.assembly.meetingDate | date:'EEEE d MMMM y, HH:mm' }} · {{ v.assembly.location || 'Lieu à préciser' }}</p></div>
        <span [class]="statusClass(v.assembly.status)">{{ labels[v.assembly.status] }}</span>
      </div>

      <div class="card" *ngIf="v.assembly.agenda"><h3>Ordre du jour</h3><p class="pre">{{ v.assembly.agenda }}</p></div>

      <div class="card stats">
        <div>
          <small>Participation</small>
          <strong>{{ participation }} %</strong>
          <span>{{ v.votedWeight }} / {{ v.totalWeight }} tantièmes ont voté</span>
          <div class="meter"><div [style.width.%]="participation"></div></div>
        </div>
        <div>
          <small>Quorum</small>
          <strong *ngIf="quorum > 0">{{ quorum }} %</strong><strong *ngIf="quorum === 0">Aucun</strong>
          <span *ngIf="quorum > 0"><span [class]="v.quorumReached ? 'badge badge--ok' : 'badge badge--warn'">{{ v.quorumReached ? 'Atteint' : 'Non atteint' }}</span></span>
        </div>
        <div>
          <small>Fermeture du vote</small>
          <strong *ngIf="v.assembly.votingDeadline">{{ v.assembly.votingDeadline | date:'dd/MM/yyyy HH:mm' }}</strong>
          <strong *ngIf="!v.assembly.votingDeadline">Manuelle</strong>
          <span *ngIf="v.assembly.status === 'OPEN' && !v.votingOpen" class="badge badge--danger">Échéance dépassée</span>
        </div>
      </div>

      <div class="alert alert--info" *ngIf="!isAdmin && v.canVote">
        Le vote est ouvert. Votre poids de vote : <strong>{{ v.myWeight }} tantièmes</strong>
        <span *ngIf="v.myWeight !== v.ownWeight"> (dont {{ v.myWeight - v.ownWeight }} par procuration)</span>.
        Vous pouvez modifier votre vote tant que le vote est ouvert.
      </div>
      <div class="alert alert--warn" *ngIf="!isAdmin && v.assembly.status === 'OPEN' && !v.canVote && v.votingOpen">
        Vous ne pouvez pas voter à cette assemblée : aucun de vos lots n'est concerné, ou vous avez donné procuration.
      </div>

      <!-- Procuration -->
      <div class="card" *ngIf="!isAdmin && v.proxy && v.ownWeight > 0 && v.assembly.status !== 'CLOSED'">
        <h3>Procuration</h3>
        <ng-container *ngIf="v.proxy.givenTo; else noGiven">
          <p>Vous avez donné procuration à <strong>{{ v.proxy.givenTo.name }}</strong> ({{ v.proxy.givenTo.weight }} tantièmes). Il ou elle vote à votre place.</p>
          <button class="btn btn--sm btn--ghost" (click)="revoke()" [disabled]="busy">Retirer la procuration</button>
        </ng-container>
        <ng-template #noGiven>
          <p *ngIf="v.proxy.received.length">
            Vous détenez {{ v.proxy.received.length }} procuration(s) (maximum {{ v.proxy.maxReceived }}) :
            <span *ngFor="let p of v.proxy.received; let last = last"><strong>{{ p.name }}</strong> ({{ p.weight }} tantièmes){{ last ? '' : ', ' }}</span>.
          </p>
          <ng-container *ngIf="!v.proxy.received.length">
            <p class="muted">Vous ne pouvez pas être présent ? Donnez votre voix à un autre copropriétaire.</p>
            <div class="proxy">
              <select [(ngModel)]="proxyTo" name="px"><option [ngValue]="null">— Choisir un copropriétaire —</option>
                <option *ngFor="let c of candidates" [ngValue]="c.id">{{ c.name }} ({{ c.weight }} tantièmes)</option></select>
              <button class="btn btn--sm" (click)="give()" [disabled]="busy || !proxyTo">Donner procuration</button>
            </div>
          </ng-container>
        </ng-template>
      </div>

      <div class="head2">
        <h2>Résolutions</h2>
        <div class="acts" *ngIf="isAdmin">
          <select [ngModel]="v.assembly.status" (ngModelChange)="setStatus($event)" name="st">
            <option value="PLANNED">Planifiée</option><option value="OPEN">Ouvrir le vote</option><option value="CLOSED">Clôturer</option>
          </select>
          <button class="btn btn--sm" (click)="showNew = true">+ Résolution</button>
        </div>
      </div>

      <div class="card res" *ngFor="let r of v.resolutions; let i = index">
        <div class="res__top"><div><strong>{{ i + 1 }}. {{ r.title }}</strong><p *ngIf="r.description">{{ r.description }}</p>
          <small class="rule">{{ majorityLabels[r.majority] }}</small></div>
          <button class="btn btn--sm btn--danger" *ngIf="isAdmin" (click)="removeRes(r)">Supprimer</button></div>

        <div class="bar" title="Pour / Contre / Abstention">
          <span class="f" [style.width.%]="pct(r, r.forWeight)"></span><span class="a" [style.width.%]="pct(r, r.againstWeight)"></span><span class="s" [style.width.%]="pct(r, r.abstainWeight)"></span>
        </div>
        <div class="legend">
          <span><i class="f"></i>Pour : <b>{{ r.forWeight }}</b></span><span><i class="a"></i>Contre : <b>{{ r.againstWeight }}</b></span>
          <span><i class="s"></i>Abstention : <b>{{ r.abstainWeight }}</b></span><span class="muted">{{ r.votersCount }} votant(s)</span>
        </div>
        <div class="verdict" *ngIf="r.result !== 'PENDING'">
          <span *ngIf="r.result === 'ADOPTED'" class="badge badge--ok">Adoptée</span>
          <span *ngIf="r.result === 'REJECTED'" class="badge badge--danger">Rejetée</span>
          <span *ngIf="r.result === 'NO_QUORUM'" class="badge badge--warn">Quorum non atteint</span>
        </div>

        <div class="vote" *ngIf="v.canVote">
          <button class="btn btn--sm" [class.btn--ok]="r.myVote === 'FOR'" [class.btn--ghost]="r.myVote !== 'FOR'" (click)="vote(r, 'FOR')" [disabled]="busy">👍 Pour</button>
          <button class="btn btn--sm" [style.background]="r.myVote === 'AGAINST' ? 'var(--danger)' : ''" [class.btn--ghost]="r.myVote !== 'AGAINST'" (click)="vote(r, 'AGAINST')" [disabled]="busy">👎 Contre</button>
          <button class="btn btn--sm" [class.btn--ghost]="r.myVote !== 'ABSTAIN'" (click)="vote(r, 'ABSTAIN')" [disabled]="busy">⚪ Abstention</button>
        </div>

        <details class="voters" *ngIf="isAdmin && r.voters.length">
          <summary>Détail des votes ({{ r.voters.length }})</summary>
          <table class="table">
            <thead><tr><th>Copropriétaire</th><th>Tantièmes</th><th>Vote</th></tr></thead>
            <tbody><tr *ngFor="let x of r.voters"><td>{{ x.name }}</td><td>{{ x.weight }}</td><td>{{ choiceLabel(x.choice) }}</td></tr></tbody>
          </table>
        </details>
      </div>
      <div class="card empty" *ngIf="!v.resolutions.length">Aucune résolution n'a encore été ajoutée.</div>
    </ng-container>

    <div class="modal-bg" *ngIf="showNew" (click)="showNew = false">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="addRes()" #f="ngForm">
        <h2>Nouvelle résolution</h2>
        <div class="field"><label>Intitulé</label><input name="t" [(ngModel)]="form.title" maxlength="200" required /></div>
        <div class="field"><label>Détails</label><textarea name="d" rows="4" maxlength="2000" [(ngModel)]="form.description"></textarea></div>
        <div class="field"><label>Règle de majorité</label>
          <select name="m" [(ngModel)]="form.majority"><option *ngFor="let o of majorityOpts" [value]="o.value">{{ o.label }}</option></select></div>
        <div class="modal__actions"><button type="button" class="btn btn--ghost" (click)="showNew = false">Annuler</button><button class="btn" type="submit" [disabled]="!f.valid">Ajouter</button></div>
      </form>
    </div>
  `,
  styles: [`
    .back { display: inline-block; margin-bottom: 12px; font-size: 14px; } h3 { font-size: 17px; margin-bottom: 8px; } .pre { white-space: pre-wrap; margin: 0; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px; margin: 14px 0; }
    .stats small { display: block; color: var(--muted); } .stats strong { display: block; font-size: 24px; color: var(--navy); } .stats span { font-size: 13px; color: var(--muted); }
    .meter { height: 8px; background: #e8edf5; border-radius: 6px; overflow: hidden; margin-top: 8px; } .meter div { height: 100%; background: var(--navy); }
    .proxy { display: flex; gap: 8px; flex-wrap: wrap; } .proxy select { padding: 8px 10px; border: 1.5px solid var(--line); border-radius: 8px; font: inherit; flex: 1; min-width: 200px; }
    .muted { color: var(--muted); } .rule { color: var(--blue); font-weight: 600; }
    .head2 { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin: 24px 0 12px; } .head2 h2 { font-size: 20px; }
    .acts { display: flex; gap: 8px; } .acts select { padding: 7px 10px; border: 1.5px solid var(--line); border-radius: 8px; font: inherit; }
    .res { margin-bottom: 14px; } .res__top { display: flex; justify-content: space-between; gap: 12px; } .res p { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
    .bar { display: flex; height: 12px; border-radius: 8px; overflow: hidden; background: #eef1f6; margin: 14px 0 8px; }
    .f { background: var(--ok); } .a { background: var(--danger); } .s { background: #9aa6b8; }
    .legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; } .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }
    .verdict { margin-top: 10px; } .vote { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
    .voters { margin-top: 12px; } .voters summary { cursor: pointer; color: var(--blue); font-size: 14px; }
  `],
})
export class AssemblyDetailPage implements OnInit {
  v: AssemblyView | null = null;
  labels: Record<string, string> = ASSEMBLY_STATUS;
  majorityLabels: Record<string, string> = MAJORITY;
  majorityOpts = opts.MAJORITY;
  candidates: PersonWeight[] = [];
  proxyTo: number | null = null;
  error = '';
  success = '';
  showNew = false;
  busy = false;
  form = { title: '', description: '', majority: 'SIMPLE' };
  id = 0;

  constructor(private route: ActivatedRoute, private api: ApiService, private auth: AuthService) {}

  get isAdmin(): boolean { return this.auth.isAdmin(); }
  get quorum(): number { return this.v?.assembly.quorumPercent ?? 0; }
  get participation(): number { return this.v && this.v.totalWeight > 0 ? Math.round((this.v.votedWeight / this.v.totalWeight) * 100) : 0; }
  statusClass = (s: string) => (s === 'OPEN' ? 'badge badge--ok' : s === 'CLOSED' ? 'badge' : 'badge badge--warn');
  pct(r: ResolutionView, w: number): number { const t = r.forWeight + r.againstWeight + r.abstainWeight; return t ? (w / t) * 100 : 0; }
  choiceLabel(c: string): string { return c === 'FOR' ? 'Pour' : c === 'AGAINST' ? 'Contre' : 'Abstention'; }

  ngOnInit(): void { this.id = Number(this.route.snapshot.paramMap.get('id')); this.load(); }

  load(): void {
    this.api.get<AssemblyView>(`/assemblies/${this.id}/view`).subscribe({
      next: (v) => { this.v = v; this.loadCandidates(); },
      error: (e) => (this.error = errorText(e, 'Assemblée introuvable.')),
    });
  }

  private loadCandidates(): void {
    if (this.isAdmin || !this.v?.proxy || this.v.proxy.givenTo || this.v.ownWeight <= 0 || this.v.assembly.status === 'CLOSED') { this.candidates = []; return; }
    this.api.get<PersonWeight[]>(`/votes/assemblies/${this.id}/candidates`).subscribe({ next: (c) => (this.candidates = c), error: () => (this.candidates = []) });
  }

  private flash(m: string): void { this.success = m; this.error = ''; setTimeout(() => (this.success = ''), 2500); }

  private run(req: Observable<unknown>, ok: string): void {
    this.busy = true;
    req.subscribe({
      next: () => { this.busy = false; this.flash(ok); this.load(); },
      error: (e) => { this.busy = false; this.error = errorText(e); },
    });
  }

  vote(r: ResolutionView, choice: 'FOR' | 'AGAINST' | 'ABSTAIN'): void { this.run(this.api.post(`/votes/${r.id}`, { choice }), 'Vote enregistré.'); }
  give(): void { if (this.proxyTo) this.run(this.api.put(`/votes/assemblies/${this.id}/proxy`, { toOwnerId: this.proxyTo }), 'Procuration enregistrée.'); }
  revoke(): void { this.run(this.api.delete(`/votes/assemblies/${this.id}/proxy`), 'Procuration retirée.'); }

  setStatus(status: string): void {
    if (!this.v) return;
    this.run(this.api.put(`/assemblies/${this.id}`, { ...this.v.assembly, status }), 'Statut mis à jour.');
  }

  addRes(): void {
    this.api.post(`/assemblies/${this.id}/resolutions`, this.form).subscribe({
      next: () => { this.showNew = false; this.form = { title: '', description: '', majority: 'SIMPLE' }; this.load(); },
      error: (e) => (this.error = errorText(e)),
    });
  }

  removeRes(r: ResolutionView): void {
    if (!confirm('Supprimer cette résolution et ses votes ?')) return;
    this.api.delete(`/assemblies/resolutions/${r.id}`).subscribe({ next: () => this.load(), error: (e) => (this.error = errorText(e)) });
  }
}
