import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localePt from '@angular/common/locales/pt-PT';
import localeLb from '@angular/common/locales/lb';
import localeDe from '@angular/common/locales/de-LU';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth.interceptor';
import { AgencyStore } from './app/core/agency.store';
import { AuthService } from './app/core/auth.service';
import { I18n, LOCALE_BY_LANG, currentLang } from './app/core/i18n.service';
import { startDomTranslation } from './app/core/dom-translator';

registerLocaleData(localeFr, 'fr');
registerLocaleData(localePt, 'pt-PT');
registerLocaleData(localeLb, 'lb');
registerLocaleData(localeDe, 'de-LU');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      // Charge l'agence (nom, logo, couleurs) avant l'affichage ; une session d'une autre agence est fermée.
      provide: APP_INITIALIZER, multi: true, deps: [AgencyStore, AuthService],
      useFactory: (agency: AgencyStore, auth: AuthService) => () => agency.load().then(() => {
        const u = auth.user();
        if (u && u.role !== 'SUPER_ADMIN' && u.agencyId && agency.agency().id && u.agencyId !== agency.agency().id) auth.forgetSession();
      }),
    },
    { provide: LOCALE_ID, useValue: LOCALE_BY_LANG[currentLang()] },
  ],
}).then((ref) => startDomTranslation(ref.injector.get(I18n))).catch((err) => console.error(err));
