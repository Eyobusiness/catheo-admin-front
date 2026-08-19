import { Routes } from '@angular/router';

export const ANIMATEURS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/animateurs-page.component').then(m => m.AnimateursPageComponent)
  }
];
