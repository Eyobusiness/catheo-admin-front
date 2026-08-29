import { Routes } from '@angular/router';

export const RAPPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/rapports/rapports-page.component').then(m => m.RapportsPageComponent),
    data: { title: 'Rapport Pastoral & Bilan Annuel' }
  },
  {
    path: 'statistiques',
    loadComponent: () =>
      import('../pages/rapports/rapports-page.component').then(m => m.RapportsPageComponent),
    data: { title: 'Statistiques & Bilan Annuel' }
  },
  {
    path: 'rapports',
    loadComponent: () =>
      import('../pages/rapports/rapports-page.component').then(m => m.RapportsPageComponent),
    data: { title: 'Rapports Pastoraux' }
  }
];
