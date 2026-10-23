import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { InactivityService } from '../services/inactivity.service';
import { ToastService } from '../services/toast.service';
import { AnimateurAuthService } from '../../features/espace-animateur/services/animateur-auth.service';
import { isAnimateurPortalRoute, isPublicRoute } from '../utils/route-context';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const animateurAuthService = inject(AnimateurAuthService);
  const inactivityService = inject(InactivityService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  const currentPath = (typeof window !== 'undefined' ? window.location.pathname : '') || router.url || '';
  
  // Distinguer rigoureusement le portail mobile animateur (/animateur/...) du CRUD administrateur (/animateurs/...)
  const isAnimateurRoute = isAnimateurPortalRoute(currentPath);

  const isAnimateursAdminApi = req.url.includes('/api/v1/animateurs') || req.url.includes('/animateurs');
  const isAnimateurPortalApi =
    !isAnimateursAdminApi && (req.url.includes('/animateur/') || req.url.endsWith('/animateur'));

  const isAnimateurContext = isAnimateurPortalApi || (isAnimateurRoute && !isAnimateursAdminApi);

  const adminToken = authService.token();
  const animateurToken = animateurAuthService.token();

  const headers: Record<string, string> = {};

  if (!req.headers.has('Accept') && req.responseType !== 'blob') {
    headers['Accept'] = 'application/json';
  }

  // Attribution étanche du Bearer Token selon le contexte de la requête
  if (isAnimateurContext) {
    if (animateurToken && !req.headers.has('Authorization')) {
      headers['Authorization'] = `Bearer ${animateurToken}`;
    }
  } else {
    if (adminToken && !req.headers.has('Authorization')) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }
  }

  const isLoginRequest = req.url.includes('/login');

  // Ne jamais forcer de paroisse ou d'année sur les requêtes d'authentification /login
  if (!isLoginRequest) {
    let paroisseId: string | number | undefined | null = null;

    if (isAnimateurContext) {
      const animProfile = animateurAuthService.profile();
      paroisseId = animProfile?.paroisse_configuration_id || (animProfile as any)?.paroisse?.id;
    } else {
      const currentUser = authService.currentUser();
      paroisseId = currentUser?.['paroisse_configuration_id'] || currentUser?.paroisse_id || currentUser?.paroisse?.id;
      if (!paroisseId && typeof window !== 'undefined' && window.localStorage) {
        try {
          const storedConfig = localStorage.getItem('catheo_paroisse_config');
          if (storedConfig) {
            const parsed = JSON.parse(storedConfig);
            paroisseId = parsed?.id || parsed?.paroisse_configuration_id;
          }
        } catch {}
      }
    }

    if (paroisseId && !req.headers.has('X-Paroisse-Id')) {
      headers['X-Paroisse-Id'] = String(paroisseId);
      headers['X-Paroisse-Configuration-Id'] = String(paroisseId);
    }

    let workingAnneeId: string | number | undefined | null = null;
    if (isAnimateurContext) {
      workingAnneeId = animateurAuthService.currentAnnee()?.id;
      if (!workingAnneeId && typeof window !== 'undefined' && window.localStorage) {
        try {
          const storedAnnee = localStorage.getItem('catheo_animateur_annee');
          if (storedAnnee) {
            workingAnneeId = JSON.parse(storedAnnee)?.id;
          }
        } catch {}
      }
    } else {
      workingAnneeId = typeof window !== 'undefined' ? localStorage.getItem('catheo_working_annee_id') : null;
    }

    if (workingAnneeId && !req.headers.has('X-Annee-Id')) {
      headers['X-Annee-Id'] = String(workingAnneeId);
      headers['X-Annee-Catechese-Id'] = String(workingAnneeId);
    }
  }

  const authReq = req.clone({
    setHeaders: headers
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isRequestPublic =
        isPublicRoute(currentPath) ||
        req.url.includes('/preinscriptions/public') ||
        req.url.includes('/campagnes-preinscriptions/public') ||
        req.url.includes('/public/campagnes') ||
        req.url.includes('/catechumenes/matricule') ||
        req.url.includes('/preinscriptions/campagne');

      if (error.status === 401) {
        // Ignorer complètement si une déconnexion volontaire est en cours ou demandée
        const isLogoutRequest =
          req.url.includes('/logout') ||
          authService.isLoggingOut() ||
          animateurAuthService.isLoggingOut();

        if (isLogoutRequest) {
          return throwError(() => error);
        }

        // 1. Gestion de l'expiration Animateur
        if (isAnimateurContext) {
          const isAnimateurLoginUrl =
            req.url.includes('/animateur/login') || currentPath.includes('/animateur/login');

          if (!isAnimateurLoginUrl && animateurAuthService.isAuthenticated()) {
            inactivityService.handleTimeout(() => animateurAuthService.clearSession(), 'animateur');
          }
          return throwError(() => error);
        }

        // 2. Gestion de l'expiration Utilisateur / Admin
        const isUserLoginUrl =
          req.url.includes('/auth/login') || currentPath.includes('/auth/login');

        if (!isUserLoginUrl && !isRequestPublic) {
          if (authService.isAuthenticated()) {
            inactivityService.handleTimeout(() => authService.clearSession(), 'admin');
          }
        }
      }

      return throwError(() => error);
    })
  );
};

