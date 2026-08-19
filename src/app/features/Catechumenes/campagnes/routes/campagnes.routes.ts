import { Routes } from '@angular/router';

export const CAMPAGNES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/campagnes-page.component').then(m => m.CampagnesPageComponent)
  }
];
