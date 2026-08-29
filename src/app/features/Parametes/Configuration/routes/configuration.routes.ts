import { Routes } from '@angular/router';

export const CONFIGURATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/configuration-page.component').then(m => m.ConfigurationPageComponent),
    data: { title: 'Configuration de la Catéchèse' }
  }
];
