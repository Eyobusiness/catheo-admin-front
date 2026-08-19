import { Routes } from '@angular/router';

export const PREINSCRIPTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/preinscriptions-page.component').then(m => m.PreinscriptionsPageComponent)
  }
];
