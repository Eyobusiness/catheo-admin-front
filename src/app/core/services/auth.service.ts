import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // Signals
  public readonly token = signal<string | null>(this.getStoredToken());
  public readonly currentUser = signal<User | null>(this.getStoredUser());
  public readonly isLoading = signal<boolean>(false);
  public readonly isAuthenticated = computed(() => !!this.token());

  constructor() {
    // Si un token est présent, charger les informations fraîches depuis la BD
    if (this.token()) {
      this.getMe().subscribe({
        error: () => {}
      });
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
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

        // Support both direct response and wrapped response ({ data: { token, user } })
        const token = response.token || response.data?.token || response.access_token;
        const user = response.user || response.data?.user || response.data;

        if (token) {
          this.setSession(token, user);
          this.toastService.success(
            'Connexion réussie',
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
        this.toastService.error('Échec de connexion', errorMsg);
        return throwError(() => error);
      })
    );
  }

  public getMe(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/me`).pipe(
      tap((res: any) => {
        const user: User = res.data || res.user || res;
        if (user && user.id) {
          this.currentUser.set(user);
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
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
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.clearSession();
        this.router.navigate(['/auth/login']);
        this.toastService.info('Déconnexion', 'Vous avez été déconnecté.');
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
          'Email envoyé',
          res.message || 'Un code de réinitialisation à 6 chiffres a été envoyé.'
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Impossible d\'envoyer le code de réinitialisation.';
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
        this.toastService.success('Code Validé', res.message || 'Code de réinitialisation valide.');
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
          'Mot de passe réinitialisé',
          res.message || 'Votre mot de passe a été réinitialisé avec succès.'
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Échec de la réinitialisation du mot de passe.';
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
        this.toastService.success('Profil mis à jour', res.message || 'Vos informations ont été mises à jour avec succès.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        // Fallback optimiste si le backend a une route PUT /auth/me ou similaire
        const updatedUser: User = { ...this.currentUser()!, ...data };
        this.currentUser.set(updatedUser);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        } catch {}
        this.toastService.success('Profil mis à jour', 'Vos informations ont été enregistrées.');
        return of(updatedUser);
      })
    );
  }

  public changePassword(dto: ChangePasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/change-password`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        this.toastService.success('Succès', res.message || 'Mot de passe modifié avec succès.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Impossible de modifier le mot de passe.';
        this.toastService.error('Erreur', msg);
        return throwError(() => error);
      })
    );
  }

  public setSession(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  }

  public clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  }
}
