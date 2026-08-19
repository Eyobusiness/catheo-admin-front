import { Routes } from '@angular/router';

export const SAUVEGARDES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/sauvegardes-page.component').then(m => m.SauvegardesPageComponent),
    data: { title: 'Sauvegardes & Données' }
  }
];
