import { Routes } from '@angular/router';

export const AFFECTATIONS_ANIMATEURS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/affectations-page.component').then(m => m.AffectationsPageComponent)
  }
];
