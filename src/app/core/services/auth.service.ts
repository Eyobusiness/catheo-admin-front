import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';
import { InactivityService } from './inactivity.service';
import { MenuItem } from '../constants/menu';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  LoginResponse,
  ResetPasswordDto,
  User,
  VerifyCodeDto
} from '../models/auth.model';

const TOKEN_KEY = 'catheo_auth_token';
const USER_KEY = 'catheo_auth_user';
const MENUS_KEY = 'catheo_auth_menus';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly inactivityService = inject(InactivityService);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // Signals
  public readonly token = signal<string | null>(this.getStoredToken());
  public readonly currentUser = signal<User | null>(this.getStoredUser());
  public readonly accessibleMenus = signal<MenuItem[]>(this.getStoredMenus());
  public readonly isLoading = signal<boolean>(false);
  public readonly isAuthenticated = computed(() => !!this.token());

  constructor() {
    // 1. Charger les menus stockes en local
    this.loadStoredMenus();

    // 2. Si un token est present, verifier l'inactivite et charger les informations
    if (this.token()) {
      if (this.inactivityService.isExpired()) {
        this.clearSession();
        this.inactivityService.handleTimeout();
      } else {
        this.inactivityService.startTracking();
        this.getMe().subscribe({
          error: () => {}
        });
      }
    }
  }

  private getStoredToken(): string | null {
    try {
      if (this.inactivityService && this.inactivityService.isExpired()) {
        return null;
      }
      return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY) || localStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getStoredMenus(): MenuItem[] {
    try {
      const data = localStorage.getItem(MENUS_KEY) || localStorage.getItem('menus');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public loadStoredMenus(): void {
    const menus = this.getStoredMenus();
    if (menus && menus.length > 0) {
      this.accessibleMenus.set(menus);
    }
  }

  public login(credentials: LoginDto): Observable<any> {
    this.isLoading.set(true);

    const payload = {
      email: credentials.email.trim(),
      password: credentials.password,
      device_name: 'Angular_App'
    };

    return this.http.post<any>(`${this.baseUrl}/login`, payload).pipe(
      tap(response => {
        this.isLoading.set(false);

        const token = response.token || response.data?.token || response.access_token;
        const user = response.user || response.data?.user || response.data;
        const menus: MenuItem[] = response.menus || response.data?.menus || response.data?.accessible_menus || [];

        if (token) {
          this.setSession(token, user, menus);
          this.toastService.success(
            'Connexion reussie',
            `Bienvenue ${user?.name || user?.nom || user?.email} !`
          );
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const errorMsg =
          error.error?.message ||
          error.error?.error ||
          (error.error?.errors ? Object.values(error.error.errors).flat().join(' ') : null) ||
          'Identifiants de connexion invalides.';
        this.toastService.error('Echec de connexion', errorMsg);
        return throwError(() => error);
      })
    );
  }

  public getMe(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/me`).pipe(
      tap((res: any) => {
        const user: User = res.data?.user || res.user || res.data || res;
        const menus: MenuItem[] | undefined = res.data?.menus || res.menus || res.data?.accessible_menus;
        if (user && user.id) {
          this.currentUser.set(user);
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
          } catch {}
        }
        if (menus && Array.isArray(menus) && menus.length > 0) {
          this.accessibleMenus.set(menus);
          try {
            localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
            localStorage.setItem('menus', JSON.stringify(menus));
          } catch {}
        }
      }),
      catchError((err: HttpErrorResponse) => {
        return of(null);
      })
    );
  }

  public logout(): Observable<void> {
    this.isLoading.set(true);
    this.inactivityService.stopTracking();
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.clearSession();
        this.router.navigate(['/auth/login']);
        this.toastService.info('Deconnexion', 'Vous avez ete deconnecte.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.clearSession();
        this.router.navigate(['/auth/login']);
        return of(void 0);
      })
    );
  }

  public forgotPassword(dto: ForgotPasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/forgot-password`, { email: dto.email.trim() }).pipe(
      tap(res => {
        this.isLoading.set(false);
        this.toastService.success(
          'Email envoye',
          res.message || 'Un code de reinitialisation a 6 chiffres a ete envoye.'
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Impossible d\'envoyer le code de reinitialisation.';
        this.toastService.error('Erreur', msg);
        return throwError(() => error);
      })
    );
  }

  public verifyCode(dto: VerifyCodeDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/verify-code`, { email: dto.email.trim(), code: dto.code.trim() }).pipe(
      tap(res => {
        this.isLoading.set(false);
        this.toastService.success('Code Valide', res.message || 'Code de reinitialisation valide.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Le code saisi est invalide.';
        this.toastService.error('Erreur', msg);
        return throwError(() => error);
      })
    );
  }

  public resetPassword(dto: ResetPasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/reset-password`, {
      email: dto.email.trim(),
      code: dto.code.trim(),
      password: dto.password,
      password_confirmation: dto.password_confirmation,
      device_name: dto.device_name || 'Angular_App'
    }).pipe(
      tap(res => {
        this.isLoading.set(false);
        const token = res.token || res.data?.token;
        const user = res.user || res.data?.user;
        if (token && user) {
          this.setSession(token, user);
        }
        this.toastService.success(
          'Mot de passe reinitialise',
          res.message || 'Votre mot de passe a ete reinitialise avec succes.'
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Echec de la reinitialisation du mot de passe.';
        this.toastService.error('Erreur', msg);
        return throwError(() => error);
      })
    );
  }

  public updateProfile(data: { name?: string; nom?: string; prenoms?: string; email: string; telephone?: string }): Observable<any> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/profile`, data).pipe(
      tap(res => {
        this.isLoading.set(false);
        const updatedUser: User = res.user || res.data || { ...this.currentUser(), ...data };
        this.currentUser.set(updatedUser);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        } catch {}
        this.toastService.success('Profil mis a jour', res.message || 'Vos informations ont ete mises a jour avec succes.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const updatedUser: User = { ...this.currentUser()!, ...data };
        this.currentUser.set(updatedUser);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        } catch {}
        this.toastService.success('Profil mis a jour', 'Vos informations ont ete enregistrees.');
        return of(updatedUser);
      })
    );
  }

  public changePassword(dto: ChangePasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/change-password`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        this.toastService.success('Succes', res.message || 'Mot de passe modifie avec succes.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Impossible de modifier le mot de passe.';
        this.toastService.error('Erreur', msg);
        return throwError(() => error);
      })
    );
  }

  public setSession(token: string, user: User, menus?: MenuItem[]): void {
    this.token.set(token);
    this.currentUser.set(user);
    if (menus && Array.isArray(menus)) {
      this.accessibleMenus.set(menus);
    }
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem('token', token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      if (menus && Array.isArray(menus)) {
        localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
        localStorage.setItem('menus', JSON.stringify(menus));
      }
    } catch {}

    // Demarrer la surveillance d'inactivite
    this.inactivityService.startTracking();
  }

  public clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.accessibleMenus.set([]);
    this.inactivityService.stopTracking();
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('user');
      localStorage.removeItem(MENUS_KEY);
      localStorage.removeItem('menus');
      localStorage.removeItem('catheo_paroisse_favicon');
    } catch {}
  }

  public hasPermission(reference: string, action: 'create' | 'read' | 'update' | 'delete'): boolean {
    const menus = this.accessibleMenus();
    if (!menus || menus.length === 0) {
      return true;
    }

    for (const menu of menus) {
      if (menu.reference === reference) {
        if (menu.permissions && typeof menu.permissions[action] === 'boolean') {
          return menu.permissions[action] === true;
        }
        return true;
      }
      if (menu.sousMenus && menu.sousMenus.length > 0) {
        const sub = menu.sousMenus.find(s => s.reference === reference);
        if (sub) {
          if (sub.permissions && typeof sub.permissions[action] === 'boolean') {
            return sub.permissions[action] === true;
          }
          return true;
        }
      }
    }
    return false;
  }
}
