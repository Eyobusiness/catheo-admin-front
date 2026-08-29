import { Routes } from '@angular/router';

export const BILAN_ANNUEL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/bilan-annuel-page.component').then(m => m.BilanAnnuelPageComponent),
    data: { title: 'Bilans Annuels & Décisions' }
  }
];
