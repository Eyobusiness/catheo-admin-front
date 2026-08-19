import { Routes } from '@angular/router';
import { guestGuard } from '../../../core/guards/guest.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../pages/login-page/login-page.component').then(m => m.LoginPageComponent),
    canActivate: [guestGuard],
    data: { title: 'Connexion - Cathéo CIM' }
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('../pages/forgot-password-page/forgot-password-page.component').then(
        m => m.ForgotPasswordPageComponent
      ),
    canActivate: [guestGuard],
    data: { title: 'Mot de passe oublié - Cathéo CIM' }
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('../pages/reset-password-page/reset-password-page.component').then(
        m => m.ResetPasswordPageComponent
      ),
    canActivate: [guestGuard],
    data: { title: 'Réinitialisation du mot de passe - Cathéo CIM' }
  }
];
