import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import {
  AnimateurChangePasswordDto,
  AnimateurForgotPasswordDto,
  AnimateurLoginDto,
  AnimateurLoginResponse,
  AnimateurMeResponse,
  AnimateurProfile,
  AnimateurResetPasswordDto,
  AnimateurVerifyCodeDto
} from '../model/animateur-auth.model';

const TOKEN_KEY = 'catheo_animateur_token';
const PROFILE_KEY = 'catheo_animateur_profile';
const ANNEE_KEY = 'catheo_animateur_annee';
const MENUS_KEY = 'catheo_animateur_menus';

@Injectable({
  providedIn: 'root'
})
export class AnimateurAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/animateur`;

  // Signals réactifs pour l'état de l'animateur
  public readonly token = signal<string | null>(this.getStoredToken());
  public readonly profile = signal<AnimateurProfile | null>(this.getStoredProfile());
  public readonly currentAnnee = signal<any | null>(this.getStoredAnnee());
  public readonly menus = signal<any[]>(this.getStoredMenus());
  public readonly isLoading = signal<boolean>(false);
  public readonly isAuthenticated = computed(() => !!this.token());

  // Nom d'affichage pastoral convivial
  public readonly displayName = computed(() => {
    const p = this.profile();
    if (!p) return 'Animateur';
    if ((p as any).nom_complet && typeof (p as any).nom_complet === 'string' && (p as any).nom_complet.trim()) {
      return (p as any).nom_complet.trim();
    }
    if (p.prenoms && p.nom) return `${p.prenoms} ${p.nom}`.trim();
    if (p.nom) return p.nom.trim();
    return p.telephone || 'Animateur';
  });

  constructor() {
    // Si un token animateur est présent au démarrage ou après un refresh F5, actualiser le profil
    if (this.token()) {
      this.getMe().subscribe({
        error: () => {}
      });
    }
  }

  private getStoredToken(): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(TOKEN_KEY);
      }
    } catch {
      return null;
    }
    return null;
  }

  private getStoredProfile(): AnimateurProfile | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = localStorage.getItem(PROFILE_KEY);
        return val ? JSON.parse(val) : null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private getStoredAnnee(): any | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = localStorage.getItem(ANNEE_KEY);
        return val ? JSON.parse(val) : null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private getStoredMenus(): any[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = localStorage.getItem(MENUS_KEY);
        return val ? JSON.parse(val) : [];
      }
    } catch {
      return [];
    }
    return [];
  }

  /**
   * Connexion Animateur via POST /api/v1/animateur/login
   * Le payload utilise "numero" et "password"
   */
  public login(credentials: AnimateurLoginDto): Observable<AnimateurLoginResponse> {
    this.isLoading.set(true);

    const payload = {
      numero: credentials.telephone.trim(),
      password: credentials.password
    };

    return this.http.post<AnimateurLoginResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap(response => {
        this.isLoading.set(false);

        const token =
          response.token ||
          response.access_token ||
          response.data?.token ||
          response.data?.access_token;

        const profile: AnimateurProfile | undefined =
          response.data?.user ||
          response.data?.animateur ||
          response.animateur ||
          response.user;

        const annee = response.annee_courante || response.data?.annee_courante;
        const menus = response.menus || response.data?.menus || [];

        if (token) {
          this.setSession(token, profile || { telephone: credentials.telephone }, annee, menus);
          const name = profile?.nom_complet || (profile?.prenoms && profile?.nom ? `${profile.prenoms} ${profile.nom}` : (profile?.nom || credentials.telephone));
          this.toastService.success(
            'Connexion réussie',
            `Bienvenue dans votre espace catéchiste, ${name} !`
          );
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const errorMsg =
          error.error?.message ||
          error.error?.error ||
          (error.error?.errors ? Object.values(error.error.errors).flat().join(' ') : null) ||
          'Numéro d\'animateur ou mot de passe incorrect.';
        this.toastService.error('Échec de connexion', errorMsg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Profil actuel via GET /api/v1/animateur/me
   */
  public getMe(): Observable<AnimateurMeResponse | null> {
    return this.http.get<AnimateurMeResponse>(`${this.baseUrl}/me`).pipe(
      tap(res => {
        const profile =
          res.data?.user ||
          res.data?.animateur ||
          res.animateur ||
          res.user;
        const annee = res.data?.annee_courante || res.annee_courante;
        const menus = res.data?.menus || res.menus || [];

        if (profile) {
          this.profile.set(profile);
          try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
          } catch {}
        }
        if (annee) {
          this.currentAnnee.set(annee);
          try {
            localStorage.setItem(ANNEE_KEY, JSON.stringify(annee));
          } catch {}
        }
        if (menus && Array.isArray(menus)) {
          this.menus.set(menus);
          try {
            localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
          } catch {}
        }
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Mise à jour des informations de profil de l'animateur
   * via PUT /api/v1/animateur/profile
   */
  public updateProfile(data: {
    nom: string;
    prenoms?: string;
    numero?: string;
    email?: string;
    telephone?: string;
    profession?: string;
  }): Observable<any> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/profile`, data).pipe(
      tap(res => {
        this.isLoading.set(false);
        const updated = res.data?.animateur || res.animateur || res.data || res;
        if (updated) {
          const merged = { ...this.profile(), ...updated };
          this.profile.set(merged);
          try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
          } catch {}
        }
        this.toastService.success('Profil mis à jour', res.message || 'Vos coordonnées ont été mises à jour avec succès.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg =
          error.error?.message ||
          (error.error?.errors ? Object.values(error.error.errors).flat().join(' ') : null) ||
          'Impossible de mettre à jour votre profil.';
        this.toastService.error('Erreur', msg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Déconnexion Animateur via POST /api/v1/animateur/logout
   */
  public logout(): Observable<void> {
    this.isLoading.set(true);
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.clearSession();
        this.router.navigate(['/animateur/login']);
        this.toastService.info('Déconnexion', 'Vous avez été déconnecté de votre espace catéchiste.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.clearSession();
        this.router.navigate(['/animateur/login']);
        return of(void 0);
      })
    );
  }

  /**
   * Changement de mot de passe via POST /api/v1/animateur/change-password
   */
  public changePassword(dto: AnimateurChangePasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/change-password`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        this.toastService.success(
          'Mot de passe mis à jour',
          res.message || 'Votre mot de passe a été modifié avec succès.'
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg =
          error.error?.message ||
          (error.error?.errors ? Object.values(error.error.errors).flat().join(' ') : null) ||
          'Impossible de modifier votre mot de passe.';
        this.toastService.error('Erreur', msg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Étape 1 Oubli de mot de passe via POST /api/v1/animateur/forgot-password
   */
  public forgotPassword(dto: AnimateurForgotPasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/forgot-password`, { email: dto.email.trim() }).pipe(
      tap(res => {
        this.isLoading.set(false);
        this.toastService.success(
          'Code OTP envoyé',
          res.message || 'Un code de réinitialisation à 6 chiffres a été envoyé à votre adresse email.'
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

  /**
   * Étape 2 Vérification code OTP via POST /api/v1/animateur/verify-code
   */
  public verifyCode(dto: AnimateurVerifyCodeDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/verify-code`, {
      email: dto.email.trim(),
      code: dto.code.trim()
    }).pipe(
      tap(res => {
        this.isLoading.set(false);
        this.toastService.success('Code validé', res.message || 'Le code saisi est valide.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Le code saisi est invalide ou expiré.';
        this.toastService.error('Code invalide', msg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Étape 3 Nouveau mot de passe via POST /api/v1/animateur/reset-password
   */
  public resetPassword(dto: AnimateurResetPasswordDto): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/reset-password`, {
      email: dto.email.trim(),
      code: dto.code.trim(),
      password: dto.password,
      password_confirmation: dto.password_confirmation
    }).pipe(
      tap(res => {
        this.isLoading.set(false);
        const token = res.token || res.access_token || res.data?.token || res.data?.access_token;
        const profile = res.animateur || res.data?.animateur;
        if (token) {
          this.setSession(token, profile || { numero: '' });
        }
        this.toastService.success(
          'Mot de passe réinitialisé',
          res.message || 'Votre mot de passe a été réinitialisé avec succès.'
        );
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg =
          error.error?.message ||
          (error.error?.errors ? Object.values(error.error.errors).flat().join(' ') : null) ||
          'Échec de la réinitialisation du mot de passe.';
        this.toastService.error('Erreur', msg);
        return throwError(() => error);
      })
    );
  }

  /**
   * Enregistrement en mémoire et en local storage de la session Animateur
   */
  public setSession(
    token: string,
    profile: AnimateurProfile,
    annee?: any,
    menus?: any[]
  ): void {
    this.token.set(token);
    this.profile.set(profile);
    if (annee) {
      this.currentAnnee.set(annee);
    }
    if (menus && Array.isArray(menus)) {
      this.menus.set(menus);
    }

    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      if (annee) {
        localStorage.setItem(ANNEE_KEY, JSON.stringify(annee));
      }
      if (menus && Array.isArray(menus)) {
        localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
      }
    } catch {}
  }

  /**
   * Nettoyage strict et hermétique de la session Animateur
   * Ne touche JAMAIS aux tokens ou clés de l'espace Utilisateur/Admin.
   */
  public clearSession(): void {
    this.token.set(null);
    this.profile.set(null);
    this.currentAnnee.set(null);
    this.menus.set([]);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(ANNEE_KEY);
      localStorage.removeItem(MENUS_KEY);
      localStorage.removeItem('catheo_animateur_classe');
    } catch {}
  }
}
