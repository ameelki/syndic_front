import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localePt from '@angular/common/locales/pt-PT';
import localeLb from '@angular/common/locales/lb';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth.interceptor';
import { I18n, LOCALE_BY_LANG, currentLang } from './app/core/i18n.service';
import { startDomTranslation } from './app/core/dom-translator';

registerLocaleData(localeFr, 'fr');
registerLocaleData(localePt, 'pt-PT');
registerLocaleData(localeLb, 'lb');

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: LOCALE_BY_LANG[currentLang()] },
  ],
}).then((ref) => startDomTranslation(ref.injector.get(I18n))).catch((err) => console.error(err));
