import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AnimateurAuthService } from '../services/animateur-auth.service';
import { InactivityService } from '../../../core/services/inactivity.service';

export const animateurGuestGuard: CanActivateFn = () => {
  const animateurAuthService = inject(AnimateurAuthService);
  const inactivityService = inject(InactivityService);
  const router = inject(Router);

  if (animateurAuthService.isAuthenticated()) {
    if (inactivityService.isExpired('animateur')) {
      animateurAuthService.clearSession();
      return true;
    }
    return router.createUrlTree(['/animateur/dashboard']);
  }

  return true;
};

