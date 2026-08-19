import { Routes } from '@angular/router';

export const SECTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/sections-page.component').then(m => m.SectionsPageComponent)
  }
];
