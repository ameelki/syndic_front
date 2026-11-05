import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Icônes en traits simples (design uniquement). */
const ICONS: Record<string, string[]> = {
  dot: ['M12 12h.01'],
  home: ['M3 11l9-8 9 8', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  chart: ['M4 20V10', 'M10 20V4', 'M16 20v-8', 'M22 20H2'],
  users: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6', 'M17 11a2.5 2.5 0 1 0 0-5', 'M18 14.2c2 .5 3.5 2.4 3.5 4.8'],
  building: ['M5 21V4h9v17', 'M14 9h5v12', 'M2 21h20', 'M8 8h3', 'M8 12h3', 'M8 16h3'],
  lots: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  euro: ['M18 6.5A7 7 0 1 0 18 17.5', 'M4 10h9', 'M4 14h9'],
  receipt: ['M6 3h12v18l-3-2-3 2-3-2-3 2z', 'M9 8h6', 'M9 12h6'],
  alert: ['M12 4l9 16H3z', 'M12 10v4', 'M12 17h.01'],
  trend: ['M3 17l6-6 4 4 8-8', 'M15 7h6v6'],
  wrench: ['M4 20l9-9', 'M14 4a4 4 0 0 0 5 5l-2 2-5-5z'],
  vote: ['M4 8l8-4 8 4', 'M4 8v2h16V8', 'M6 10v8', 'M10 10v8', 'M14 10v8', 'M18 10v8', 'M3 20h18'],
  megaphone: ['M4 10v4h3l8 4V6L7 10z', 'M18 9a4 4 0 0 1 0 6'],
  doc: ['M7 3h7l5 5v13H7z', 'M14 3v5h5', 'M10 13h6', 'M10 17h6'],
  tools: ['M3 21l7-7', 'M14 4l6 6-4 4-6-6z'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  mail: ['M3 6h18v12H3z', 'M3 7l9 7 9-7'],
  palette: ['M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.5-2.2-.5-1.2.3-2.3 1.6-2.3H17a4 4 0 0 0 4-4C21 7 17 3 12 3z', 'M7.5 11h.01', 'M10 7.5h.01', 'M14.5 7.5h.01'],
  lock: ['M6 11h12v9H6z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  logout: ['M10 4H4v16h6', 'M15 8l5 4-5 4', 'M20 12H9'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  bell: ['M6 17V11a6 6 0 0 1 12 0v6', 'M4 17h16', 'M10 20.5a2 2 0 0 0 4 0'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3.5 6h.01', 'M3.5 12h.01', 'M3.5 18h.01'],
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `<svg viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path *ngFor="let d of paths" [attr.d]="d" /></svg>`,
  styles: [`:host { display: inline-flex; flex: none; }`],
})
export class IconComponent {
  paths: string[] = ICONS['dot'];
  @Input() size = 20;
  @Input() set name(n: string) { this.paths = ICONS[n] ?? ICONS['dot']; }
}

/** Repère de marque : quatre fenêtres d'immeuble, une allumée. */
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `<svg viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" aria-hidden="true">
    <rect x="2" y="2" width="9" height="9" rx="2" fill="currentColor" />
    <rect x="13" y="2" width="9" height="9" rx="2" fill="currentColor" />
    <rect x="2" y="13" width="9" height="9" rx="2" fill="currentColor" />
    <rect x="13" y="13" width="9" height="9" rx="2" fill="var(--gold)" />
  </svg>`,
  styles: [`:host { display: inline-flex; flex: none; }`],
})
export class LogoComponent {
  @Input() size = 24;
}
