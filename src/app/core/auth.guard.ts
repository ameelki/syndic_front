import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.isLoggedIn ? true : inject(Router).createUrlTree(['/connexion']);
};
export const adminGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.isAdmin() ? true : inject(Router).createUrlTree([a.isLoggedIn ? a.homeUrl() : '/connexion']);
};
export const ownerGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.isLoggedIn && !a.isAdmin() && !a.isSuper() ? true : inject(Router).createUrlTree([a.isLoggedIn ? a.homeUrl() : '/connexion']);
};
export const superGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.isSuper() ? true : inject(Router).createUrlTree([a.isLoggedIn ? a.homeUrl() : '/connexion']);
};
export const guestGuard: CanActivateFn = () => {
  const a = inject(AuthService);
  return a.isLoggedIn ? inject(Router).createUrlTree([a.homeUrl()]) : true;
};
export const homeRedirect: CanActivateFn = () => inject(Router).createUrlTree([inject(AuthService).homeUrl()]);
