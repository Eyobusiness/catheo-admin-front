import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AnimateurAuthService } from '../services/animateur-auth.service';
import { InactivityService } from '../../../core/services/inactivity.service';

export const animateurAuthGuard: CanActivateFn = () => {
  const animateurAuthService = inject(AnimateurAuthService);
  const inactivityService = inject(InactivityService);
  const router = inject(Router);

  if (animateurAuthService.isAuthenticated()) {
    if (inactivityService.isExpired('animateur')) {
      inactivityService.handleTimeout(() => animateurAuthService.clearSession(), 'animateur');
      return false;
    }
    return true;
  }

  return router.createUrlTree(['/animateur/login']);
};

