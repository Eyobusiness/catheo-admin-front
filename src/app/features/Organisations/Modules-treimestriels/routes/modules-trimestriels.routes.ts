import { Routes } from '@angular/router';

export const MODULES_TRIMESTRIELS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/modules-trimestriels-page.component').then(m => m.ModulesTrimestrielsPageComponent)
  }
];
