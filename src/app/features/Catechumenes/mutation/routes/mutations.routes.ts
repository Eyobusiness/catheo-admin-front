import { Routes } from '@angular/router';

export const MUTATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/mutations-page.component').then(m => m.MutationsPageComponent)
  }
];
