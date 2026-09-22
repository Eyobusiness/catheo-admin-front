import { Routes } from '@angular/router';
import { animateurAuthGuard } from '../guards/animateur-auth.guard';
import { animateurGuestGuard } from '../guards/animateur-guest.guard';

export const ANIMATEUR_ROUTES: Routes = [
  // 1. Routes publiques Animateur (avec animateurGuestGuard)
  {
    path: 'login',
    canActivate: [animateurGuestGuard],
    loadComponent: () =>
      import('../pages/login/animateur-login-page.component').then(m => m.AnimateurLoginPageComponent),
    data: { title: 'Connexion Animateur' }
  },
  {
    path: 'forgot-password',
    canActivate: [animateurGuestGuard],
    loadComponent: () =>
      import('../pages/forgot-password/animateur-forgot-password-page.component').then(
        m => m.AnimateurForgotPasswordPageComponent
      ),
    data: { title: 'Mot de passe oublié Animateur' }
  },

  // 2. Espace protégé avec Layout Mobile-First
  {
    path: '',
    canActivate: [animateurAuthGuard],
    loadComponent: () =>
      import('../components/layout/animateur-layout.component').then(m => m.AnimateurLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../pages/dashboard/animateur-dashboard-page.component').then(
            m => m.AnimateurDashboardPageComponent
          ),
        data: { title: 'Tableau de bord Catéchiste' }
      },
      {
        path: 'ma-classe',
        loadComponent: () =>
          import('../pages/ma-classe/animateur-ma-classe-page.component').then(
            m => m.AnimateurMaClassePageComponent
          ),
        data: { title: 'Ma Classe' }
      },
      {
        path: 'catechumenes',
        loadComponent: () =>
          import('../pages/catechumenes/animateur-catechumenes-page.component').then(
            m => m.AnimateurCatechumenesPageComponent
          ),
        data: { title: 'Mes Catéchumènes' }
      },
      {
        path: 'presences',
        loadComponent: () =>
          import('../pages/presences/animateur-presences-page.component').then(
            m => m.AnimateurPresencesPageComponent
          ),
        data: { title: 'Appel & Présences' }
      },
      {
        path: 'evaluations',
        loadComponent: () =>
          import('../pages/evaluations/animateur-evaluations-page.component').then(
            m => m.AnimateurEvaluationsPageComponent
          ),
        data: { title: 'Évaluations & Notes' }
      },
      {
        path: 'evaluations/:uuid',
        loadComponent: () =>
          import('../pages/evaluations-notes/animateur-evaluation-notes-page.component').then(
            m => m.AnimateurEvaluationNotesPageComponent
          ),
        data: { title: 'Saisie des Notes' }
      },
      {
        path: 'seances',
        loadComponent: () =>
          import('../pages/seances/animateur-seances-page.component').then(
            m => m.AnimateurSeancesPageComponent
          ),
        data: { title: 'Séances de Catéchèse' }
      },
      {
        path: 'bilan',
        loadComponent: () =>
          import('../pages/bilan/animateur-bilan-page.component').then(
            m => m.AnimateurBilanPageComponent
          ),
        data: { title: 'Bilan Annuel & Délibérations' }
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('../pages/profil/animateur-profil-page.component').then(
            m => m.AnimateurProfilPageComponent
          ),
        data: { title: 'Mon Profil Animateur' }
      },
      {
        path: 'profil/mot-de-passe',
        loadComponent: () =>
          import('../pages/change-password/animateur-change-password-page.component').then(
            m => m.AnimateurChangePasswordPageComponent
          ),
        data: { title: 'Changer mon mot de passe' }
      }
    ]
  }
];
