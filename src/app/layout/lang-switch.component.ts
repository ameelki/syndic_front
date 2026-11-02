import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18n, LANGS, Lang } from '../core/i18n.service';

/** Sélecteur de langue (français, portugais, luxembourgeois). */
@Component({
  selector: 'app-lang',
  standalone: true,
  imports: [CommonModule],
  template: `
    <select class="lang" [class.dark]="dark" [value]="i18n.lang" (change)="change($any($event.target).value)" aria-label="Langue">
      <option *ngFor="let l of langs" [value]="l.code" [selected]="l.code === i18n.lang">{{ l.label }}</option>
    </select>
  `,
  styles: [`
    .lang { padding: 6px 8px; border-radius: 8px; border: 1.5px solid var(--line); background: #fff; color: var(--text); font: inherit; font-size: 13px; }
    .lang.dark { background: rgba(255,255,255,.12); color: #fff; border: 0; width: 100%; padding: 9px 10px; }
    .lang.dark option { color: #1c2733; }
  `],
})
export class LangSwitchComponent {
  @Input() dark = false;
  langs = LANGS;
  constructor(public i18n: I18n) {}
  change(code: string): void { this.i18n.set(code as Lang); }
}
