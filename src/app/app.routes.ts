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
      import('./features/Dashboard/pages/dashboard.component').then(m => m.DashboardComponent),
    data: { title: 'Tableau de Bord' }
  },
  {
    path: 'mon-profil',
    loadComponent: () =>
      import('./features/Auth/pages/mon-profil/mon-profil-page.component').then(m => m.MonProfilPageComponent),
    data: { title: 'Mon Profil & Sécurité' }
  },
  {
    path: 'profile',
    redirectTo: 'mon-profil',
    pathMatch: 'full'
  },

  // --- Portail Public de Préinscription (Accessible par lien et QR code) ---
  {
    path: 'preinscription-publique',
    loadComponent: () =>
      import('./features/Catechumenes/preinscriptions/pages/public-preinscription/public-preinscription-page.component').then(
        m => m.PublicPreinscriptionPageComponent
      ),
    data: { title: 'Préinscription en Ligne - Paroisse Cœur Immaculé de Marie' }
  },
  {
    path: 'preinscription-publique/:campagneId',
    loadComponent: () =>
      import('./features/Catechumenes/preinscriptions/pages/public-preinscription/public-preinscription-page.component').then(
        m => m.PublicPreinscriptionPageComponent
      ),
    data: { title: 'Préinscription en Ligne - Paroisse Cœur Immaculé de Marie' }
  },
  {
    path: 'preinscriptions/campagne/:campagneId',
    loadComponent: () =>
      import('./features/Catechumenes/preinscriptions/pages/public-preinscription/public-preinscription-page.component').then(
        m => m.PublicPreinscriptionPageComponent
      ),
    data: { title: 'Préinscription en Ligne - Paroisse Cœur Immaculé de Marie' }
  },
  {
    path: 'preinscriptions/campagne',
    loadComponent: () =>
      import('./features/Catechumenes/preinscriptions/pages/public-preinscription/public-preinscription-page.component').then(
        m => m.PublicPreinscriptionPageComponent
      ),
    data: { title: 'Préinscription en Ligne - Paroisse Cœur Immaculé de Marie' }
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
    loadChildren: () =>
      import('./features/Presences/routes/presences.routes').then(m => m.PRESENCES_ROUTES),
    data: { title: 'Gestion des Séances & Présences' }
  },

  // --- Évaluations ---
  {
    path: 'evaluations',
    loadChildren: () =>
      import('./features/Evaluations/evaluation/routes/evaluation.routes').then(m => m.EVALUATION_ROUTES),
    data: { title: 'Évaluations' }
  },
  {
    path: 'notes',
    loadChildren: () =>
      import('./features/Evaluations/notes/routes/notes.routes').then(m => m.NOTES_ROUTES),
    data: { title: 'Saisie des Notes' }
  },
  {
    path: 'bilans-annuels',
    loadChildren: () =>
      import('./features/Evaluations/bilan-annuel/routes/bilan-annuel.routes').then(m => m.BILAN_ANNUEL_ROUTES),
    data: { title: 'Bilans Annuels' }
  },
  {
    path: 'bulletins',
    loadChildren: () =>
      import('./features/Evaluations/bulletin/routes/bulletin.routes').then(m => m.BULLETIN_ROUTES),
    data: { title: 'Bulletins de Catéchèse' }
  },

  // --- Sacrements ---
  {
    path: 'sacrements',
    loadChildren: () =>
      import('./features/Sacrements/routes/sacrements.routes').then(m => m.SACREMENTS_ROUTES),
    data: { title: 'Sacrements' }
  },
  {
    path: 'sacrements/bapteme',
    loadComponent: () =>
      import('./features/Sacrements/pages/bapteme/bapteme-page.component').then(m => m.BaptemePageComponent),
    data: { title: 'Sacrement du Baptême' }
  },
  {
    path: 'sacrements/premiere-communion',
    loadComponent: () =>
      import('./features/Sacrements/pages/premiere-communion/premiere-communion-page.component').then(m => m.PremiereCommunionPageComponent),
    data: { title: 'Première Communion' }
  },
  {
    path: 'sacrements/confirmation',
    loadComponent: () =>
      import('./features/Sacrements/pages/confirmation/confirmation-page.component').then(m => m.ConfirmationPageComponent),
    data: { title: 'Sacrement de Confirmation' }
  },
  {
    path: 'exceptions-pastorales',
    loadComponent: () =>
      import('./features/Sacrements/pages/exceptions-pastorales/exceptions-pastorales-page.component').then(m => m.ExceptionsPastoralesPageComponent),
    data: { title: 'Exceptions Pastorales' }
  },

  // --- Finances ---
  {
    path: 'tarifications',
    loadChildren: () =>
      import('./features/Finances/tarification/routes/tarification.routes').then(m => m.TARIFICATION_ROUTES),
    data: { title: 'Tarification' }
  },
  {
    path: 'operations-financieres',
    loadChildren: () =>
      import('./features/Finances/operation-financiere/routes/operation.routes').then(m => m.OPERATION_FINANCIERE_ROUTES),
    data: { title: 'Opérations Financières' }
  },
  {
    path: 'caisse',
    loadChildren: () =>
      import('./features/Finances/caisse/routes/caisse.routes').then(m => m.CAISSE_ROUTES),
    data: { title: 'Gestion de la Caisse' }
  },
  {
    path: 'versements',
    loadChildren: () =>
      import('./features/Finances/versements/routes/versements.routes').then(m => m.VERSEMENTS_ROUTES),
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
      import('./features/Notifications/pages/notifications-page.component').then(m => m.NotificationsPageComponent),
    data: { title: 'Centre de Notifications & Alertes' }
  },

  // --- Impressions ---
  {
    path: 'impressions',
    loadChildren: () =>
      import('./features/Impressions/routes/impressions.routes').then(m => m.IMPRESSIONS_ROUTES),
    data: { title: 'Centre d\'Impressions & Fiches Pastorales' }
  },

  // --- Documents Officiels ---
  {
    path: 'documents',
    loadChildren: () =>
      import('./features/Documents/routes/documents.routes').then(m => m.DOCUMENTS_ROUTES),
    data: { title: 'Documents Officiels' }
  },
  {
    path: 'modeles-documents',
    loadComponent: () =>
      import('./features/Documents/pages/modeles/modeles.component').then(m => m.ModelesDocumentsPageComponent),
    data: { title: 'Modèles de Documents' }
  },
  {
    path: 'generation-documents',
    loadComponent: () =>
      import('./features/Documents/pages/generation/generation.component').then(m => m.GenerationDocumentsPageComponent),
    data: { title: 'Génération de Documents' }
  },

  // --- Rapports & Bilan Pastoral ---
  {
    path: 'statistiques',
    redirectTo: 'rapports',
    pathMatch: 'full'
  },
  {
    path: 'rapports',
    loadComponent: () =>
      import('./features/Rapports/pages/rapports/rapports-page.component').then(m => m.RapportsPageComponent),
    data: { title: 'Rapport Pastoral & Bilan Annuel' }
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
