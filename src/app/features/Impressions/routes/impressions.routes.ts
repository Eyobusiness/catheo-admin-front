import { Routes } from '@angular/router';

export const IMPRESSIONS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'fiche-notes',
    pathMatch: 'full'
  },
  {
    path: 'fiche-notes',
    loadComponent: () =>
      import('../pages/fiche-notes/fiche-notes.component').then(m => m.FicheNotesPrintComponent),
    data: { title: 'Impression - Fiche de Notes' }
  },
  {
    path: 'liste-presence',
    loadComponent: () =>
      import('../pages/liste-presence/liste-presence.component').then(m => m.ListePresencePrintComponent),
    data: { title: 'Impression - Liste de Présence' }
  },
  {
    path: 'bilan-annuel',
    loadComponent: () =>
      import('../pages/bilan-annuel/bilan-annuel.component').then(m => m.BilanAnnuelPrintComponent),
    data: { title: 'Impression - Fiche de Bilan Annuel' }
  },
  {
    path: 'suivi-sacramentel',
    loadComponent: () =>
      import('../pages/suivi-sacramentel/suivi-sacramentel.component').then(m => m.SuiviSacramentelPrintComponent),
    data: { title: 'Impression - Fiche de Suivi Sacramentel' }
  },
  {
    path: 'renseignements-bapteme',
    loadComponent: () =>
      import('../pages/fiche-bapteme-renseignement/fiche-bapteme-renseignement.component').then(
        m => m.FicheBaptemeRenseignementPrintComponent
      ),
    data: { title: 'Impression - Renseignements Baptême' }
  },
  {
    path: 'fiche-bapteme-renseignement',
    redirectTo: 'renseignements-bapteme',
    pathMatch: 'full'
  },
  {
    path: 'renseignements-premiere-communion',
    loadComponent: () =>
      import('../pages/fiche-communion-renseignement/fiche-communion-renseignement.component').then(
        m => m.FicheCommunionRenseignementPrintComponent
      ),
    data: { title: 'Impression - Renseignements Première Communion' }
  },
  {
    path: 'fiche-communion-renseignement',
    redirectTo: 'renseignements-premiere-communion',
    pathMatch: 'full'
  },
  {
    path: 'renseignements-confirmation',
    loadComponent: () =>
      import('../pages/fiche-confirmation-renseignement/fiche-confirmation-renseignement.component').then(
        m => m.FicheConfirmationRenseignementPrintComponent
      ),
    data: { title: 'Impression - Renseignements Confirmation' }
  },
  {
    path: 'fiche-confirmation-renseignement',
    redirectTo: 'renseignements-confirmation',
    pathMatch: 'full'
  }
];
