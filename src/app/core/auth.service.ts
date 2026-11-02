import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models/models';

const TOKEN = 'sy_token';
const USER = 'sy_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl;
  user = signal<User | null>(this.read());
  isAdmin = computed(() => this.user()?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null { try { return localStorage.getItem(TOKEN); } catch { return null; } }
  get isLoggedIn(): boolean { return !!this.token && !!this.user(); }

  private read(): User | null {
    try { const r = localStorage.getItem(USER); return r ? JSON.parse(r) : null; } catch { return null; }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, { email, password }).pipe(tap((r) => {
      try { localStorage.setItem(TOKEN, r.token); localStorage.setItem(USER, JSON.stringify(r.user)); } catch {}
      this.user.set(r.user);
    }));
  }

  register(body: unknown): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/auth/register`, body);
  }

  logout(): void {
    try { localStorage.removeItem(TOKEN); localStorage.removeItem(USER); } catch {}
    this.user.set(null);
    this.router.navigateByUrl('/connexion');
  }

  homeUrl(): string { return this.isAdmin() ? '/app/admin/dashboard' : '/app/mon-espace'; }
}
