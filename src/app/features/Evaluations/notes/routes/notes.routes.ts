import { Routes } from '@angular/router';

export const NOTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/notes-page.component').then(m => m.NotesPageComponent),
    data: { title: 'Saisie des Notes' }
  }
];
