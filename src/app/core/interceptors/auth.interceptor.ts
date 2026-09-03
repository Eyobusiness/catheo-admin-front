import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);
  const token = authService.token();

  const headers: Record<string, string> = {};

  if (!req.headers.has('Accept') && req.responseType !== 'blob') {
    headers['Accept'] = 'application/json';
  }

  if (token && !req.headers.has('Authorization')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({
    setHeaders: headers
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const currentPath = (typeof window !== 'undefined' ? window.location.pathname : '') || router.url || '';
      const isPublicRoute =
        currentPath.includes('/preinscriptions/campagne') ||
        currentPath.includes('/preinscription-publique') ||
        currentPath.startsWith('/auth') ||
        currentPath.startsWith('/login') ||
        req.url.includes('/preinscriptions/public') ||
        req.url.includes('/preinscriptions/campagne');

      if (error.status === 401 && !req.url.includes('/auth/login') && !isPublicRoute) {
        authService.clearSession();
        toastService.warning(
          'Session expiree',
          'Votre session a expire apres 10 minutes d\'inactivite. Veuillez vous reconnecter.',
          6000
        );
        router.navigate(['/auth/login'], { queryParams: { reason: 'inactivity' } });
      }
      return throwError(() => error);
    })
  );
};
