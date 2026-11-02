import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAuthCall = req.url.includes('/auth/');
  const token = auth.token;
  const r = token && !isAuthCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(r).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthCall) auth.logout();
      return throwError(() => err);
    }),
  );
};

export function errorText(err: any, fallback = 'Une erreur est survenue.'): string {
  if (err?.status === 0) return 'Impossible de contacter le serveur.';
  if (err?.status === 403 && !err?.error?.message) return 'Accès refusé.';
  const f = err?.error?.fields;
  if (f && Object.keys(f).length) return Object.values(f).join(' ');
  return err?.error?.message || fallback;
}
