import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/Auth/routes/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Tableau de Bord' }
  },

  // --- Catéchumènes ---
  {
    path: 'campagnes-preinscriptions',
    loadChildren: () =>
      import('./features/Catechumenes/campagnes/routes/campagnes.routes').then(m => m.CAMPAGNES_ROUTES),
    data: { title: 'Campagnes de Préinscription' }
  },
  {
    path: 'preinscriptions',
    loadChildren: () =>
      import('./features/Catechumenes/preinscriptions/routes/preinscriptions.routes').then(m => m.PREINSCRIPTIONS_ROUTES),
    data: { title: 'Gestion des Préinscriptions' }
  },
  {
    path: 'inscriptions-annuelles',
    loadChildren: () =>
      import('./features/Catechumenes/inscriptions-annuelles/routes/inscriptions-annuelles.routes').then(m => m.INSCRIPTIONS_ANNUELLES_ROUTES),
    data: { title: 'Inscriptions Annuelles' }
  },
  {
    path: 'affectations',
    loadChildren: () =>
      import('./features/Catechumenes/afefactation-catechumene-classe/routes/affectation-catechumene-classe.routes').then(m => m.AFFECTATION_CATECHUMENE_CLASSE_ROUTES),
    data: { title: 'Affectations des Catéchumènes' }
  },
  {
    path: 'mutations',
    loadChildren: () =>
      import('./features/Catechumenes/mutation/routes/mutations.routes').then(m => m.MUTATIONS_ROUTES),
    data: { title: 'Mutations & Transferts' }
  },
  {
    path: 'catechumenes',
    loadChildren: () =>
      import('./features/Catechumenes/liste-catechumene/routes/catechumenes.routes').then(m => m.CATECHUMENES_ROUTES),
    data: { title: 'Liste des Catéchumènes' }
  },

  // --- Gestion des Présences ---
  {
    path: 'seances',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Gestion des Séances' }
  },

  // --- Évaluations ---
  {
    path: 'evaluations',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Évaluations' }
  },
  {
    path: 'notes',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Saisie des Notes' }
  },
  {
    path: 'bilans-annuels',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Bilans Annuels' }
  },
  {
    path: 'bulletins',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Bulletins de Catéchèse' }
  },

  // --- Sacrements ---
  {
    path: 'sacrements/bapteme',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Sacrement du Baptême' }
  },
  {
    path: 'sacrements/premiere-communion',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Première Communion' }
  },
  {
    path: 'sacrements/confirmation',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Sacrement de Confirmation' }
  },
  {
    path: 'exceptions-pastorales',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Exceptions Pastorales' }
  },

  // --- Finances ---
  {
    path: 'tarifications',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Tarification' }
  },
  {
    path: 'operations-financieres',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Opérations Financières' }
  },
  {
    path: 'caisse',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Gestion de la Caisse' }
  },
  {
    path: 'versements',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Versements Paroissiaux' }
  },

  // --- Communication ---
  {
    path: 'sms',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Envois SMS' }
  },
  {
    path: 'notifications',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Centre de Notifications' }
  },

  // --- Impressions ---
  {
    path: 'impressions/fiche-notes',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Impression - Fiche de Notes' }
  },
  {
    path: 'impressions/liste-presence',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Impression - Liste de Présence' }
  },
  {
    path: 'impressions/bilan-annuel',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Impression - Fiche de Bilan Annuel' }
  },
  {
    path: 'impressions/suivi-sacramentel',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Impression - Fiche de Suivi Sacramentel' }
  },
  {
    path: 'impressions/renseignements-bapteme',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Impression - Renseignements Baptême' }
  },
  {
    path: 'impressions/renseignements-premiere-communion',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Impression - Renseignements Première Communion' }
  },
  {
    path: 'impressions/renseignements-confirmation',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Impression - Renseignements Confirmation' }
  },

  // --- Documents Officiels ---
  {
    path: 'modeles-documents',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Modèles de Documents' }
  },
  {
    path: 'generation-documents',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Génération de Documents' }
  },

  // --- Rapports & Statistiques ---
  {
    path: 'statistiques',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Statistiques & Indicateurs' }
  },
  {
    path: 'rapports',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Rapports Pastoraux' }
  },

  // --- Organisation ---
  {
    path: 'annees-pastorales',
    loadChildren: () =>
      import('./features/Organisations/AnneesPastorales/routes/annees-pastorales.routes').then(m => m.ANNEES_PASTORALES_ROUTES)
  },
  {
    path: 'sections',
    loadChildren: () =>
      import('./features/Organisations/Sections/routes/sections.routes').then(m => m.SECTIONS_ROUTES)
  },
  {
    path: 'niveaux',
    loadChildren: () =>
      import('./features/Organisations/Niveaux/routes/niveaux.routes').then(m => m.NIVEAUX_ROUTES)
  },
  {
    path: 'classes',
    loadChildren: () =>
      import('./features/Organisations/Classe/routes/classes.routes').then(m => m.CLASSES_ROUTES)
  },
  {
    path: 'groupes',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Groupes de Catéchèse' }
  },
  {
    path: 'animateurs',
    loadChildren: () =>
      import('./features/Organisations/Animateurs/routes/animateurs.routes').then(m => m.ANIMATEURS_ROUTES)
  },
  {
    path: 'affectations-animateurs',
    loadChildren: () =>
      import('./features/Organisations/affectation-animateurs/routes/affectation-animateurs.routes').then(
        m => m.AFFECTATIONS_ANIMATEURS_ROUTES
      )
  },
  {
    path: 'cebs',
    loadChildren: () =>
      import('./features/Organisations/Ceb/routes/ceb.routes').then(m => m.CEB_ROUTES)
  },
  {
    path: 'mouvements',
    loadChildren: () =>
      import('./features/Organisations/Mouvements/routes/mouvements.routes').then(m => m.MOUVEMENTS_ROUTES)
  },
  {
    path: 'calendrier',
    loadChildren: () =>
      import('./features/Organisations/Calendrier/routes/calendrier.routes').then(m => m.CALENDRIER_ROUTES)
  },
  {
    path: 'modules-trimestriels',
    loadChildren: () =>
      import('./features/Organisations/Modules-treimestriels/routes/modules-trimestriels.routes').then(
        m => m.MODULES_TRIMESTRIELS_ROUTES
      )
  },
  {
    path: 'type-activites',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Types d\'Activités' }
  },

  // --- Utilisateurs & Sécurité ---
  {
    path: 'utilisateurs',
    loadChildren: () =>
      import('./features/Utilisateurs/routes/users.routes').then(m => m.USERS_ROUTES)
  },
  {
    path: 'profils',
    loadChildren: () =>
      import('./features/Utilisateurs/Profil/routes/profils.routes').then(m => m.PROFILS_ROUTES)
  },

  // --- Paramètres ---
  {
    path: 'parametres/configuration',
    loadChildren: () =>
      import('./features/Parametes/Configuration/routes/configuration.routes').then(
        m => m.CONFIGURATION_ROUTES
      )
  },
  {
    path: 'parametres/sauvegardes',
    loadChildren: () =>
      import('./features/Parametes/Sauvegardes/routes/sauvegardes.routes').then(
        m => m.SAUVEGARDES_ROUTES
      )
  },

  // Fallback route
  {
    path: '**',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Module en cours de conception' }
  }
];
