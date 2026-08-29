import { Routes } from '@angular/router';

export const EVALUATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/evaluation-page.component').then(m => m.EvaluationPageComponent),
    data: { title: 'Gestion des Évaluations' }
  }
];
