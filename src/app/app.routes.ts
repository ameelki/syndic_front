import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard, homeRedirect, ownerGuard, superGuard } from './core/auth.guard';
import { CONFIGS } from './pages/crud-configs';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/public/home.page').then((m) => m.HomePage) },
      { path: 'connexion', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage) },
      { path: 'inscription', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/register.page').then((m) => m.RegisterPage) },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeRedirect], children: [] },
      // ----- Syndic -----
      { path: 'admin/dashboard', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin-dashboard.page').then((m) => m.AdminDashboardPage) },
      { path: 'admin/users', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin-users.page').then((m) => m.AdminUsersPage) },
      { path: 'admin/buildings', canActivate: [adminGuard], data: { crud: CONFIGS['buildings'] }, loadComponent: () => import('./pages/crud.page').then((m) => m.CrudPage) },
      { path: 'admin/lots', canActivate: [adminGuard], data: { crud: CONFIGS['lots'] }, loadComponent: () => import('./pages/crud.page').then((m) => m.CrudPage) },
      { path: 'admin/charges', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin-charges.page').then((m) => m.AdminChargesPage) },
      { path: 'admin/expenses', canActivate: [adminGuard], data: { crud: CONFIGS['expenses'] }, loadComponent: () => import('./pages/crud.page').then((m) => m.CrudPage) },
      { path: 'admin/incidents', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin-incidents.page').then((m) => m.AdminIncidentsPage) },
      { path: 'admin/suppliers', canActivate: [adminGuard], data: { crud: CONFIGS['suppliers'] }, loadComponent: () => import('./pages/crud.page').then((m) => m.CrudPage) },
      { path: 'admin/agency', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin-agency.page').then((m) => m.AdminAgencyPage) },
      { path: 'admin/budgets', canActivate: [adminGuard], data: { crud: CONFIGS['budgets'] }, loadComponent: () => import('./pages/crud.page').then((m) => m.CrudPage) },
      // ----- Super administrateur -----
      { path: 'super/agencies', canActivate: [superGuard], loadComponent: () => import('./pages/super/agencies.page').then((m) => m.AgenciesPage) },
      { path: 'reservations', loadComponent: () => import('./pages/reservations.page').then((m) => m.ReservationsPage) },
      { path: 'messages', loadComponent: () => import('./pages/messages.page').then((m) => m.MessagesPage) },
      // ----- Copropriétaire -----
      { path: 'mon-espace', canActivate: [ownerGuard], loadComponent: () => import('./pages/owner/owner-dashboard.page').then((m) => m.OwnerDashboardPage) },
      { path: 'mes-charges', canActivate: [ownerGuard], loadComponent: () => import('./pages/owner/owner-charges.page').then((m) => m.OwnerChargesPage) },
      { path: 'mes-incidents', canActivate: [ownerGuard], loadComponent: () => import('./pages/owner/owner-incidents.page').then((m) => m.OwnerIncidentsPage) },
      // ----- Communs (lecture seule pour les copropriétaires) -----
      { path: 'assemblies', data: { crud: CONFIGS['assemblies'] }, loadComponent: () => import('./pages/crud.page').then((m) => m.CrudPage) },
      { path: 'assemblies/:id', loadComponent: () => import('./pages/assembly-detail.page').then((m) => m.AssemblyDetailPage) },
      { path: 'announcements', data: { crud: CONFIGS['announcements'] }, loadComponent: () => import('./pages/crud.page').then((m) => m.CrudPage) },
      { path: 'documents', data: { crud: CONFIGS['documents'] }, loadComponent: () => import('./pages/crud.page').then((m) => m.CrudPage) },
      { path: 'works', data: { crud: CONFIGS['works'] }, loadComponent: () => import('./pages/crud.page').then((m) => m.CrudPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
