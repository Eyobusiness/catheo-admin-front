import { Routes } from '@angular/router';

export const AFFECTATION_CATECHUMENE_CLASSE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/affectations-page.component').then(m => m.AffectationsPageComponent)
  }
];
