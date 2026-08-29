import { Routes } from '@angular/router';

export const TARIFICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/tarifs-page.component').then(m => m.TarifsPageComponent),
    data: { title: 'Configuration des Tarifs & Frais' }
  }
];
