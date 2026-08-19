import { Routes } from '@angular/router';

export const CEB_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/ceb-page.component').then(m => m.CebPageComponent)
  }
];
