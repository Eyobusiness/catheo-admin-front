import { Routes } from '@angular/router';

export const PRESENCES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/seances-page.component').then(m => m.SeancesPageComponent),
    data: { title: 'Gestion des Séances & Présences' }
  }
];
