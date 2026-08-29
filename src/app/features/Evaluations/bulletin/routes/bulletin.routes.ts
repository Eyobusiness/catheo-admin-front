import { Routes } from '@angular/router';

export const BULLETIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/bulletin-page.component').then(m => m.BulletinPageComponent),
    data: { title: 'Bulletins de Catéchèse' }
  }
];
