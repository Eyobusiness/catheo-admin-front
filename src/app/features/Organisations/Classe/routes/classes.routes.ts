import { Routes } from '@angular/router';

export const CLASSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/classes-page.component').then(m => m.ClassesPageComponent)
  }
];
