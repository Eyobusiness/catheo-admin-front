import { Routes } from '@angular/router';

export const INSCRIPTIONS_ANNUELLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/inscriptions-annuelles-page.component').then(m => m.InscriptionsAnnuellesPageComponent)
  }
];
