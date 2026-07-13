import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthResponse, BackendRole, ChangePasswordRequest, LoginRequest, RegisterRequest, mapBackendRole } from '../models/auth.model';
import { AppUser, UserRole } from '../models/user.model';

const SESSION_STORAGE_KEY = 'edusync.session.user';
const TOKEN_STORAGE_KEY = 'edusync.jwt';
const TEACHER_SUBJECT_STORAGE_KEY = 'edusync.teacher.subject';

const TITLE_BY_ROLE: Record<UserRole, string> = {
  admin: 'Super Admin',
  teacher: 'Professor',
  student: 'Área do Aluno',
};

const AVATAR_PALETTE = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#db2777', '#0891b2'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _currentUser = signal<AppUser | null>(this.restoreSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly role = computed<UserRole | null>(() => this._currentUser()?.role ?? null);

  isForcePasswordChange(): boolean {
    return this._currentUser()?.forcePasswordChange === true;
  }

  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/api/auth/change-password`, data);
  }

  markPasswordChanged(): void {
    const user = this._currentUser();
    if (!user) return;

    const { forcePasswordChange: _removed, ...rest } = user;
    this.setSession(rest);
  }

  hasTeacherSubject(): boolean {
    const user = this._currentUser();
    if (!user || user.role !== 'teacher') return false;
    return Boolean(user.subjectName?.trim()) || user.subjectId != null;
  }

  setSubjectName(subjectName: string, subjectId?: number): void {
    const user = this._currentUser();
    if (!user || user.role !== 'teacher') return;

    const name = subjectName.trim();
    this.setSession({
      ...user,
      ...(name ? { subjectName: name } : { subjectName: undefined }),
      ...(subjectId != null ? { subjectId } : {}),
      title: name ? `Professor · ${name}` : 'Professor',
    });
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<AppUser> {
    const body: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, body).pipe(
      tap((response) => this.persistToken(response.token)),
      map((response) => this.buildUserFromResponse(response, { fallbackEmail: email })),
      tap((user) => this.setSession(user))
    );
  }

  register(input: {
    name: string;
    email: string;
    password: string;
    role: BackendRole;
    subjectId?: number;
  }): Observable<AppUser> {
    const body: RegisterRequest = {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      ...(input.subjectId != null ? { subjectId: input.subjectId } : {}),
    };
    return this.http.post<AuthResponse>(`${API_BASE_URL}/api/auth/register`, body).pipe(
      tap((response) => this.persistToken(response.token)),
      map((response) => this.buildUserFromResponse(response, { fallbackEmail: input.email, fallbackName: input.name })),
      tap((user) => this.setSession(user))
    );
  }

  logout(): void {
    this._currentUser.set(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TEACHER_SUBJECT_STORAGE_KEY);
    } catch {
    }
  }

  private buildUserFromResponse(
    response: AuthResponse,
    fallback: { fallbackEmail: string; fallbackName?: string }
  ): AppUser {
    const role = mapBackendRole(response.role);
    const name = response.name?.trim() || fallback.fallbackName?.trim() || fallback.fallbackEmail.split('@')[0];
    const email = response.email?.trim() || fallback.fallbackEmail;
    const subjectName = response.subjectName?.trim();
    const subjectId =
      typeof response.subjectId === 'number' && Number.isFinite(response.subjectId)
        ? response.subjectId
        : undefined;

    return {
      id: response.userId,
      name,
      email,
      role,
      title:
        role === 'teacher' && subjectName
          ? `Professor · ${subjectName}`
          : TITLE_BY_ROLE[role],
      avatarInitials: this.initialsFrom(name),
      avatarColor: AVATAR_PALETTE[response.userId % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0],
      ...(subjectName ? { subjectName } : {}),
      ...(subjectId != null ? { subjectId } : {}),
      ...(response.forcePasswordChange === true ? { forcePasswordChange: true } : {}),
    };
  }

  private initialsFrom(name: string): string {
    return (
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'NA'
    );
  }

  private persistToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
    }
  }

  private setSession(user: AppUser): void {
    this._currentUser.set(user);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch {
    }
  }

  private restoreSession(): AppUser | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppUser) : null;
    } catch {
      return null;
    }
  }
}
