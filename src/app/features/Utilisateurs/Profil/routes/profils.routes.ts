import { Routes } from '@angular/router';

export const PROFILS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/profils-page.component').then(m => m.ProfilsPageComponent),
    data: { title: 'Profils & Permissions (RBAC)' }
  }
];
