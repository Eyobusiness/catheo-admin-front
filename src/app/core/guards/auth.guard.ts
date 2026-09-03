import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { InactivityService } from '../services/inactivity.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const inactivityService = inject(InactivityService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (inactivityService.isExpired()) {
      inactivityService.handleTimeout(() => authService.clearSession());
      return false;
    }
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const inactivityService = inject(InactivityService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (inactivityService.isExpired()) {
    inactivityService.handleTimeout(() => authService.clearSession());
    return false;
  }

  const currentPath = '/' + (route.routeConfig?.path || '');
  const menus = authService.accessibleMenus();

  // Si pas de menus dynamiques configures, autoriser par defaut
  if (!menus || menus.length === 0) {
    return true;
  }

  const hasAccess = menus.some(
    m => m.path === currentPath || m.sousMenus?.some(s => s.path === currentPath)
  );

  if (hasAccess) {
    return true;
  }

  // Redirection si non autorise
  router.navigate(['/dashboard']);
  return false;
};
