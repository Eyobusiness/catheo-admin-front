import { Routes } from '@angular/router';

export const MOUVEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/mouvements-page.component').then(m => m.MouvementsPageComponent)
  }
];
