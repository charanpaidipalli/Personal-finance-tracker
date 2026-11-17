import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  user: AuthUser;
}

interface AuthSessionResponse {
  user: AuthUser | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${API_BASE_URL}/auth`;

  me(): Observable<AuthSessionResponse> {
    return this.http.get<AuthSessionResponse>(`${this.base}/me`);
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, credentials);
  }

  register(details: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, details);
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/logout`, {});
  }
}
