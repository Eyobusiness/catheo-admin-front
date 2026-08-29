import { Routes } from '@angular/router';

export const CAISSE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/caisse-page.component').then(m => m.CaissePageComponent),
    data: { title: 'Gestion de la Caisse Paroissiale' }
  }
];
