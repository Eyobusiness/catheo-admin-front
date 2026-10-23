import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { InactivityService } from '../services/inactivity.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const inactivityService = inject(InactivityService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (inactivityService.isExpired('admin')) {
      authService.clearSession();
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

