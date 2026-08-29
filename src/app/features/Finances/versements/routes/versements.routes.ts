import { Routes } from '@angular/router';

export const VERSEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/versements-page.component').then(m => m.VersementsPageComponent),
    data: { title: 'Versements Paroissiaux / au Curé' }
  }
];
