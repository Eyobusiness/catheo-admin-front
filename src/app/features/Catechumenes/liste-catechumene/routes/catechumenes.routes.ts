import { Routes } from '@angular/router';

export const CATECHUMENES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/catechumenes-page.component').then(m => m.CatechumenesPageComponent)
  }
];
