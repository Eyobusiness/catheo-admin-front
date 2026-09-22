import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AnimateurAuthService } from '../services/animateur-auth.service';

export const animateurGuestGuard: CanActivateFn = () => {
  const animateurAuthService = inject(AnimateurAuthService);
  const router = inject(Router);

  if (animateurAuthService.isAuthenticated()) {
    return router.createUrlTree(['/animateur/dashboard']);
  }

  return true;
};
