import { Routes } from '@angular/router';

export const CALENDRIER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/calendrier-page.component').then(m => m.CalendrierPageComponent)
  }
];
