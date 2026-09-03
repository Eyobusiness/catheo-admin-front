import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Racine -> login (guestGuard redirige vers dashboard si déjà connecté)
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // Routes publiques
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/Auth/routes/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'login',
    data: { title: 'Connexion' },
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // Portail public préinscription (sans guard)
  {
    path: 'preinscription-publique',
    loadComponent: () =>
      import('./features/Catechumenes/preinscriptions/pages/public-preinscription/public-preinscription-page.component').then(
        m => m.PublicPreinscriptionPageComponent
      ),
    data: { title: 'Préinscription en Ligne' }
  },
  {
    path: 'preinscription-publique/:campagneId',
    loadComponent: () =>
      import('./features/Catechumenes/preinscriptions/pages/public-preinscription/public-preinscription-page.component').then(
        m => m.PublicPreinscriptionPageComponent
      ),
    data: { title: 'Préinscription en Ligne' }
  },
  {
    path: 'preinscriptions/campagne/:campagneId',
    loadComponent: () =>
      import('./features/Catechumenes/preinscriptions/pages/public-preinscription/public-preinscription-page.component').then(
        m => m.PublicPreinscriptionPageComponent
      ),
    data: { title: 'Préinscription en Ligne' }
  },
  {
    path: 'preinscriptions/campagne',
    loadComponent: () =>
      import('./features/Catechumenes/preinscriptions/pages/public-preinscription/public-preinscription-page.component').then(
        m => m.PublicPreinscriptionPageComponent
      ),
    data: { title: 'Préinscription en Ligne' }
  },

  // =====================================================
  // ROUTES PROTÉGÉES — authGuard sur toutes
  // =====================================================
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Dashboard/pages/dashboard.component').then(m => m.DashboardComponent),
    data: { title: 'Tableau de Bord' }
  },
  {
    path: 'mon-profil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Auth/pages/mon-profil/mon-profil-page.component').then(m => m.MonProfilPageComponent),
    data: { title: 'Mon Profil & Sécurité' }
  },
  { path: 'profile', redirectTo: 'mon-profil', pathMatch: 'full' },

  // Catéchumènes
  {
    path: 'campagnes-preinscriptions',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Catechumenes/campagnes/routes/campagnes.routes').then(m => m.CAMPAGNES_ROUTES),
    data: { title: 'Campagnes de Préinscription' }
  },
  {
    path: 'preinscriptions',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Catechumenes/preinscriptions/routes/preinscriptions.routes').then(m => m.PREINSCRIPTIONS_ROUTES),
    data: { title: 'Gestion des Préinscriptions' }
  },
  {
    path: 'inscriptions-annuelles',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Catechumenes/inscriptions-annuelles/routes/inscriptions-annuelles.routes').then(m => m.INSCRIPTIONS_ANNUELLES_ROUTES),
    data: { title: 'Inscriptions Annuelles' }
  },
  {
    path: 'affectations',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Catechumenes/afefactation-catechumene-classe/routes/affectation-catechumene-classe.routes').then(m => m.AFFECTATION_CATECHUMENE_CLASSE_ROUTES),
    data: { title: 'Affectations des Catéchumènes' }
  },
  {
    path: 'mutations',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Catechumenes/mutation/routes/mutations.routes').then(m => m.MUTATIONS_ROUTES),
    data: { title: 'Mutations & Transferts' }
  },
  {
    path: 'catechumenes',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Catechumenes/liste-catechumene/routes/catechumenes.routes').then(m => m.CATECHUMENES_ROUTES),
    data: { title: 'Liste des Catéchumènes' }
  },

  // Présences
  {
    path: 'seances',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Presences/routes/presences.routes').then(m => m.PRESENCES_ROUTES),
    data: { title: 'Gestion des Séances & Présences' }
  },

  // Évaluations
  {
    path: 'evaluations',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Evaluations/evaluation/routes/evaluation.routes').then(m => m.EVALUATION_ROUTES),
    data: { title: 'Évaluations' }
  },
  {
    path: 'notes',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Evaluations/notes/routes/notes.routes').then(m => m.NOTES_ROUTES),
    data: { title: 'Saisie des Notes' }
  },
  {
    path: 'bilans-annuels',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Evaluations/bilan-annuel/routes/bilan-annuel.routes').then(m => m.BILAN_ANNUEL_ROUTES),
    data: { title: 'Bilans Annuels' }
  },
  {
    path: 'bulletins',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Evaluations/bulletin/routes/bulletin.routes').then(m => m.BULLETIN_ROUTES),
    data: { title: 'Bulletins de Catéchèse' }
  },

  // Sacrements
  {
    path: 'sacrements',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Sacrements/routes/sacrements.routes').then(m => m.SACREMENTS_ROUTES),
    data: { title: 'Sacrements' }
  },
  {
    path: 'sacrements/bapteme',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Sacrements/pages/bapteme/bapteme-page.component').then(m => m.BaptemePageComponent),
    data: { title: 'Sacrement du Baptême' }
  },
  {
    path: 'sacrements/premiere-communion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Sacrements/pages/premiere-communion/premiere-communion-page.component').then(m => m.PremiereCommunionPageComponent),
    data: { title: 'Première Communion' }
  },
  {
    path: 'sacrements/confirmation',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Sacrements/pages/confirmation/confirmation-page.component').then(m => m.ConfirmationPageComponent),
    data: { title: 'Sacrement de Confirmation' }
  },
  {
    path: 'exceptions-pastorales',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Sacrements/pages/exceptions-pastorales/exceptions-pastorales-page.component').then(m => m.ExceptionsPastoralesPageComponent),
    data: { title: 'Exceptions Pastorales' }
  },

  // Finances
  {
    path: 'tarifications',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Finances/tarification/routes/tarification.routes').then(m => m.TARIFICATION_ROUTES),
    data: { title: 'Tarification' }
  },
  {
    path: 'operations-financieres',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Finances/operation-financiere/routes/operation.routes').then(m => m.OPERATION_FINANCIERE_ROUTES),
    data: { title: 'Opérations Financières' }
  },
  {
    path: 'caisse',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Finances/caisse/routes/caisse.routes').then(m => m.CAISSE_ROUTES),
    data: { title: 'Gestion de la Caisse' }
  },
  {
    path: 'versements',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Finances/versements/routes/versements.routes').then(m => m.VERSEMENTS_ROUTES),
    data: { title: 'Versements Paroissiaux' }
  },

  // Communication
  {
    path: 'sms',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Envois SMS' }
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Notifications/pages/notifications-page.component').then(m => m.NotificationsPageComponent),
    data: { title: 'Centre de Notifications & Alertes' }
  },

  // Impressions
  {
    path: 'impressions',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Impressions/routes/impressions.routes').then(m => m.IMPRESSIONS_ROUTES),
    data: { title: "Centre d'Impressions & Fiches Pastorales" }
  },

  // Documents
  {
    path: 'documents',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Documents/routes/documents.routes').then(m => m.DOCUMENTS_ROUTES),
    data: { title: 'Documents Officiels' }
  },
  {
    path: 'modeles-documents',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Documents/pages/modeles/modeles.component').then(m => m.ModelesDocumentsPageComponent),
    data: { title: 'Modèles de Documents' }
  },
  {
    path: 'generation-documents',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Documents/pages/generation/generation.component').then(m => m.GenerationDocumentsPageComponent),
    data: { title: 'Génération de Documents' }
  },

  // Rapports
  { path: 'statistiques', redirectTo: 'rapports', pathMatch: 'full' },
  {
    path: 'rapports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/Rapports/pages/rapports/rapports-page.component').then(m => m.RapportsPageComponent),
    data: { title: 'Rapport Pastoral & Bilan Annuel' }
  },

  // Organisation
  {
    path: 'annees-pastorales',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/AnneesPastorales/routes/annees-pastorales.routes').then(m => m.ANNEES_PASTORALES_ROUTES),
      data: { title: 'Listes des Années Pastorales' }
  },
  {
    path: 'sections',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/Sections/routes/sections.routes').then(m => m.SECTIONS_ROUTES),
    data: { title: 'Listes des Sections' }
  },
  {
    path: 'niveaux',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/Niveaux/routes/niveaux.routes').then(m => m.NIVEAUX_ROUTES),
    data: { title: 'Listes des Niveaux' }
  },
  {
    path: 'classes',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/Classe/routes/classes.routes').then(m => m.CLASSES_ROUTES),
    data: { title: 'Listes des Classes' }
  },
  {
    path: 'groupes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Groupes de Catéchèse' }
  },
  {
    path: 'animateurs',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/Animateurs/routes/animateurs.routes').then(m => m.ANIMATEURS_ROUTES),
    data: { title: 'Listes des Animateurs' }
  },
  {
    path: 'affectations-animateurs',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/affectation-animateurs/routes/affectation-animateurs.routes').then(m => m.AFFECTATIONS_ANIMATEURS_ROUTES),
    data: { title: 'Listes des Affectations des Animateurs' }
  },
  {
    path: 'cebs',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/Ceb/routes/ceb.routes').then(m => m.CEB_ROUTES),
    data: { title: 'Listes des CEBs' }
  },
  {
    path: 'mouvements',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/Mouvements/routes/mouvements.routes').then(m => m.MOUVEMENTS_ROUTES),
    data: { title: 'Listes des Mouvements' }
  },
  {
    path: 'calendrier',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/Calendrier/routes/calendrier.routes').then(m => m.CALENDRIER_ROUTES),
    data: { title: 'Calendrier' }
  },
  {
    path: 'modules-trimestriels',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Organisations/Modules-treimestriels/routes/modules-trimestriels.routes').then(m => m.MODULES_TRIMESTRIELS_ROUTES),
    data: { title: 'Modules Trimestriels' }
  },
  {
    path: 'type-activites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: "Types d'Activités" }
  },

  // Utilisateurs & Sécurité
  {
    path: 'utilisateurs',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Utilisateurs/routes/users.routes').then(m => m.USERS_ROUTES),
    data: { title: 'Listes des Utilisateurs' }
  },
  {
    path: 'profils',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Utilisateurs/Profil/routes/profils.routes').then(m => m.PROFILS_ROUTES),
    data: { title: 'Listes des Profils' }
  },

  // Paramètres
  {
    path: 'parametres/configuration',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Parametes/Configuration/routes/configuration.routes').then(m => m.CONFIGURATION_ROUTES),
    data: { title: 'Configuration' }
  },
  {
    path: 'parametres/sauvegardes',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/Parametes/Sauvegardes/routes/sauvegardes.routes').then(m => m.SAUVEGARDES_ROUTES),
    data: { title: 'Sauvegardes' }
  },

  // Fallback
  {
    path: '**',
    loadComponent: () =>
      import('./features/UnderConstruction/under-construction.component').then(m => m.UnderConstructionComponent),
    data: { title: 'Module en cours de conception' }
  }
];
