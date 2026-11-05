import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BuildingStore } from './building.store';

/** Listes filtrées par le bâtiment sélectionné (syndic). */
const SCOPED = ['/admin/lots', '/admin/expenses', '/admin/budgets', '/admin/suppliers', '/announcements', '/documents', '/works',
  '/assemblies', '/admin/charge-calls', '/admin/charges', '/admin/incidents', '/admin/dashboard', '/admin/messages',
  '/admin/reservations', '/admin/deadlines'];

/** Accès générique à l'API (chemins relatifs à /api). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient, private buildings: BuildingStore) {}

  get<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>, unscoped = false): Observable<T> {
    let p = new HttpParams();
    if (!unscoped && this.buildings.selectedId !== null && SCOPED.includes(path)) p = p.set('buildingId', String(this.buildings.selectedId));
    Object.entries(params ?? {}).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v)); });
    return this.http.get<T>(`${this.base}${path}`, { params: p });
  }
  post<T>(path: string, body: unknown = {}, params?: Record<string, string | number | boolean>): Observable<T> {
    let p = new HttpParams();
    Object.entries(params ?? {}).forEach(([k, v]) => (p = p.set(k, String(v))));
    return this.http.post<T>(`${this.base}${path}`, body, { params: p });
  }
  put<T>(path: string, body: unknown): Observable<T> { return this.http.put<T>(`${this.base}${path}`, body); }
  patch<T>(path: string, params: Record<string, string | number | boolean>): Observable<T> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => (p = p.set(k, String(v))));
    return this.http.patch<T>(`${this.base}${path}`, null, { params: p });
  }
  /** Requête avec un corps (ex. DELETE avec mot de passe). */
  request<T>(method: string, path: string, body?: unknown): Observable<T> {
    return this.http.request<T>(method, `${this.base}${path}`, { body });
  }
  /** Téléchargement d'un fichier protégé (le jeton est ajouté par l'intercepteur). */
  getBlob(path: string, params?: Record<string, string | number | boolean | null | undefined>): Observable<Blob> {
    let p = new HttpParams();
    Object.entries(params ?? {}).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v)); });
    return this.http.get(`${this.base}${path}`, { params: p, responseType: 'blob' });
  }
  /** Envoi d'un fichier (formulaire multipart, champ « file »). */
  upload<T>(path: string, file: Blob, name: string): Observable<T> {
    const fd = new FormData();
    fd.append('file', file, name);
    return this.http.post<T>(`${this.base}${path}`, fd);
  }
  delete(path: string): Observable<void> { return this.http.delete<void>(`${this.base}${path}`); }
}
