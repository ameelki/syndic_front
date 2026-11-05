import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgencyStore } from '../core/agency.store';
import { LogoComponent } from './icons.component';

/** Logo + nom de l'agence (logo de l'agence s'il existe, sinon le repère aux quatre fenêtres). */
@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [CommonModule, LogoComponent],
  template: `
    <span class="brand">
      <img *ngIf="store.agency().logoUrl as src; else mark" [src]="src" [style.height.px]="size + 6" alt="" />
      <ng-template #mark><app-logo [size]="size" /></ng-template>
      <span class="nm" *ngIf="showName">{{ store.agency().name }}</span>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; min-width: 0; }
    .brand { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
    img { width: auto; max-width: 140px; object-fit: contain; border-radius: 4px; }
    .nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class BrandComponent {
  @Input() size = 24;
  @Input() showName = true;
  constructor(public store: AgencyStore) {}
}
