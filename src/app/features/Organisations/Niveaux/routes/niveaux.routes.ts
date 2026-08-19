import { Routes } from '@angular/router';

export const NIVEAUX_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/niveaux-page.component').then(m => m.NiveauxPageComponent)
  }
];
