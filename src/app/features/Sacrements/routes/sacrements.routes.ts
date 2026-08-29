import { Routes } from '@angular/router';

export const SACREMENTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'bapteme',
    pathMatch: 'full'
  },
  {
    path: 'bapteme',
    loadComponent: () =>
      import('../pages/bapteme/bapteme-page.component').then(m => m.BaptemePageComponent),
    data: { title: 'Baptême' }
  },
  {
    path: 'premiere-communion',
    loadComponent: () =>
      import('../pages/premiere-communion/premiere-communion-page.component').then(m => m.PremiereCommunionPageComponent),
    data: { title: 'Première Communion' }
  },
  {
    path: 'confirmation',
    loadComponent: () =>
      import('../pages/confirmation/confirmation-page.component').then(m => m.ConfirmationPageComponent),
    data: { title: 'Confirmation' }
  },
  {
    path: 'exceptions-pastorales',
    loadComponent: () =>
      import('../pages/exceptions-pastorales/exceptions-pastorales-page.component').then(m => m.ExceptionsPastoralesPageComponent),
    data: { title: 'Exceptions Pastorales' }
  }
];
