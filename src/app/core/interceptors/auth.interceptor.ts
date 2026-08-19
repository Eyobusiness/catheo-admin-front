import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.token();

  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (token && !req.headers.has('Authorization')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({
    setHeaders: headers
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.clearSession();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
