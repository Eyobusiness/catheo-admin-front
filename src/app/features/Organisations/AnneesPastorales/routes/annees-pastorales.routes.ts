import { Routes } from '@angular/router';

export const ANNEES_PASTORALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/annees-pastorales-page.component').then(m => m.AnneesPastoralesPageComponent)
  }
];
