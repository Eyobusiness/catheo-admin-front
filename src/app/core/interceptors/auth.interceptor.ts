import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { AnimateurAuthService } from '../../features/espace-animateur/services/animateur-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const animateurAuthService = inject(AnimateurAuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  const currentPath = (typeof window !== 'undefined' ? window.location.pathname : '') || router.url || '';
  
  // Distinguer rigoureusement le portail mobile animateur (/animateur/...) du CRUD administrateur (/animateurs/...)
  const isAnimateurPortalRoute =
    currentPath === '/animateur' ||
    currentPath.startsWith('/animateur/') ||
    currentPath === '/espace-animateur' ||
    currentPath.startsWith('/espace-animateur/');

  const isAnimateursAdminApi = req.url.includes('/api/v1/animateurs') || req.url.includes('/animateurs');
  const isAnimateurPortalApi =
    !isAnimateursAdminApi && (req.url.includes('/animateur/') || req.url.endsWith('/animateur'));

  const isAnimateurContext = isAnimateurPortalApi || (isAnimateurPortalRoute && !isAnimateursAdminApi);

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

  const currentUser = authService.currentUser();
  const paroisseId = currentUser?.['paroisse_configuration_id'] || currentUser?.paroisse_id || currentUser?.paroisse?.id;
  if (paroisseId && !req.headers.has('X-Paroisse-Id')) {
    headers['X-Paroisse-Id'] = String(paroisseId);
    headers['X-Paroisse-Configuration-Id'] = String(paroisseId);
  }

  const workingAnneeId = typeof window !== 'undefined' ? localStorage.getItem('catheo_working_annee_id') : null;
  if (workingAnneeId && !req.headers.has('X-Annee-Id')) {
    headers['X-Annee-Id'] = workingAnneeId;
    headers['X-Annee-Catechese-Id'] = workingAnneeId;
  }

  const authReq = req.clone({
    setHeaders: headers
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isPublicRoute =
        currentPath.includes('/preinscriptions/campagne') ||
        currentPath.includes('/preinscription-publique') ||
        currentPath.startsWith('/auth') ||
        currentPath.startsWith('/login') ||
        req.url.includes('/preinscriptions/public') ||
        req.url.includes('/campagnes-preinscriptions/public') ||
        req.url.includes('/public/campagnes') ||
        req.url.includes('/catechumenes/matricule') ||
        req.url.includes('/preinscriptions/campagne');

      if (error.status === 401) {
        // 1. Gestion de l'expiration Animateur
        if (isAnimateurContext) {
          if (!req.url.includes('/animateur/login')) {
            animateurAuthService.clearSession();
            toastService.warning(
              'Session expirée',
              'Votre session animateur a expiré. Veuillez vous reconnecter.',
              6000
            );
            router.navigate(['/animateur/login']);
          }
          return throwError(() => error);
        }

        // 2. Gestion de l'expiration Utilisateur / Admin (inchangée)
        if (!req.url.includes('/auth/login') && !isPublicRoute) {
          authService.clearSession();
          toastService.warning(
            'Session expirée',
            'Votre session a expiré après 30 minutes d\'inactivité. Veuillez vous reconnecter.',
            6000
          );
          router.navigate(['/auth/login'], { queryParams: { reason: 'inactivity' } });
        }
      }

      return throwError(() => error);
    })
  );
};

