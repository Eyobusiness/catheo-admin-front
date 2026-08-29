import { Routes } from '@angular/router';

export const OPERATION_FINANCIERE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/operations-page.component').then(m => m.OperationsPageComponent),
    data: { title: 'Opérations Financières & Avis de Paiement' }
  }
];
