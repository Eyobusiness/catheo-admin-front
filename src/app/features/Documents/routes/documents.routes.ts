import { Routes } from '@angular/router';

export const DOCUMENTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'modeles',
    pathMatch: 'full'
  },
  {
    path: 'modeles',
    loadComponent: () =>
      import('../pages/modeles/modeles.component').then(m => m.ModelesDocumentsPageComponent),
    data: { title: 'Modèles de Documents' }
  },
  {
    path: 'modeles/nouveau',
    loadComponent: () =>
      import('../pages/editeur-modele/editeur-modele.component').then(m => m.EditeurModelePageComponent),
    data: { title: 'Nouveau Modèle de Document' }
  },
  {
    path: 'modeles/editer/:id',
    loadComponent: () =>
      import('../pages/editeur-modele/editeur-modele.component').then(m => m.EditeurModelePageComponent),
    data: { title: 'Modifier Modèle de Document' }
  },
  {
    path: 'generation',
    loadComponent: () =>
      import('../pages/generation/generation.component').then(m => m.GenerationDocumentsPageComponent),
    data: { title: 'Génération de Documents' }
  },
  {
    path: 'apercu/:id',
    loadComponent: () =>
      import('../pages/apercu/apercu.component').then(m => m.ApercuDocumentPageComponent),
    data: { title: 'Aperçu Document Officiel' }
  }
];
