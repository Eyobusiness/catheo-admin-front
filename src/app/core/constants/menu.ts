export interface MenuPermissions {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
  [key: string]: boolean | undefined;
}

export interface SubMenuItem {
  order?: number | null;
  id?: string | number | null;
  libelle: string;
  icon?: string;
  path?: string;
  code?: string;
  permission?: string | null;
  permissions?: MenuPermissions;
  reference: string;
}

export interface MenuItem {
  order?: number | null;
  id?: string | number | null;
  libelle: string;
  icon?: string;
  path?: string;
  code?: string;
  permission?: string | null;
  permissions?: MenuPermissions;
  sousMenus?: SubMenuItem[];
  reference: string;
}

export const APP_MENU: MenuItem[] = [
  {
    "order": 1,
    "id": null,
    "libelle": "Tableau de bord",
    "icon": "bi bi-speedometer2",
    "path": "/dashboard",
    "code": "100",
    "permission": "1,2,3,4",
    "sousMenus": [],
    "reference": "dashboard"
  },
  {
    "order": 2,
    "id": null,
    "libelle": "Catéchumènes",
    "icon": "bi bi-people",
    "path": "#",
    "code": "200",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Campagnes",
        "icon": "bi bi-megaphone",
        "path": "/campagnes-preinscriptions",
        "code": "200",
        "permission": null,
        "reference": "campagnes_preinscriptions"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Préinscriptions",
        "icon": "bi bi-person-plus",
        "path": "/preinscriptions",
        "code": "200",
        "permission": null,
        "reference": "preinscriptions"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Inscriptions",
        "icon": "bi bi-journal-check",
        "path": "/inscriptions-annuelles",
        "code": "200",
        "permission": null,
        "reference": "inscriptions_annuelles"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Affectations",
        "icon": "bi bi-diagram-3",
        "path": "/affectations",
        "code": "200",
        "permission": null,
        "reference": "affectations"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Mutations",
        "icon": "bi bi-arrow-left-right",
        "path": "/mutations",
        "code": "200",
        "permission": null,
        "reference": "mutations"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Liste des catéchumènes",
        "icon": "bi bi-person-lines-fill",
        "path": "/catechumenes",
        "code": "200",
        "permission": null,
        "reference": "catechumenes"
      }
    ],
    "reference": "main_catechumenes"
  },
  {
    "order": 3,
    "id": null,
    "libelle": "Gestion présences",
    "icon": "bi bi-calendar-check",
    "path": "#",
    "code": "300",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Séances",
        "icon": "bi bi-calendar-event",
        "path": "/seances",
        "code": "300",
        "permission": null,
        "reference": "seances"
      }
    ],
    "reference": "main_presences"
  },
  {
    "order": 4,
    "id": null,
    "libelle": "Évaluations",
    "icon": "bi bi-clipboard-check",
    "path": "#",
    "code": "400",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Évaluations",
        "icon": "bi bi-clipboard2-check",
        "path": "/evaluations",
        "code": "400",
        "permission": null,
        "reference": "evaluations"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Notes",
        "icon": "bi bi-pencil-square",
        "path": "/notes",
        "code": "400",
        "permission": null,
        "reference": "notes"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Bilans annuels",
        "icon": "bi bi-file-earmark-text",
        "path": "/bilans-annuels",
        "code": "400",
        "permission": null,
        "reference": "bilans_annuels"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Bulletins",
        "icon": "bi bi-file-earmark-bar-graph",
        "path": "/bulletins",
        "code": "400",
        "permission": null,
        "reference": "bulletins"
      }
    ],
    "reference": "main_evaluations"
  },
  {
    "order": 5,
    "id": null,
    "libelle": "Sacrements",
    "icon": "bi bi-droplet-half",
    "path": "#",
    "code": "500",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Baptême",
        "icon": "bi bi-droplet",
        "path": "/sacrements/bapteme",
        "code": "500",
        "permission": null,
        "reference": "bapteme"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Première Communion",
        "icon": "bi bi-cup-hot",
        "path": "/sacrements/premiere-communion",
        "code": "500",
        "permission": null,
        "reference": "premiere_communion"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Confirmation",
        "icon": "bi bi-patch-check",
        "path": "/sacrements/confirmation",
        "code": "500",
        "permission": null,
        "reference": "confirmation"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Exceptions pastorales",
        "icon": "bi bi-exclamation-diamond",
        "path": "/sacrements/exceptions-pastorales",
        "code": "500",
        "permission": null,
        "reference": "exceptions_pastorales"
      }
    ],
    "reference": "main_sacrements"
  },
  {
    "order": 6,
    "id": null,
    "libelle": "Finances",
    "icon": "bi bi-cash-stack",
    "path": "#",
    "code": "600",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Tarification",
        "icon": "bi bi-tags",
        "path": "/tarifications",
        "code": "600",
        "permission": null,
        "reference": "tarifications"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Opérations financières",
        "icon": "bi bi-arrow-repeat",
        "path": "/operations-financieres",
        "code": "600",
        "permission": null,
        "reference": "operations_financieres"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Caisse",
        "icon": "bi bi-safe",
        "path": "/caisse",
        "code": "600",
        "permission": null,
        "reference": "caisse"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Versements",
        "icon": "bi bi-cash-coin",
        "path": "/versements",
        "code": "600",
        "permission": null,
        "reference": "versements"
      }
    ],
    "reference": "main_finances"
  },
  {
    "order": 7,
    "id": null,
    "libelle": "Communication",
    "icon": "bi bi-chat-dots",
    "path": "#",
    "code": "700",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "SMS",
        "icon": "bi bi-phone",
        "path": "/sms",
        "code": "700",
        "permission": null,
        "reference": "sms"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Notifications",
        "icon": "bi bi-bell",
        "path": "/notifications",
        "code": "700",
        "permission": null,
        "reference": "notifications"
      }
    ],
    "reference": "main_communication"
  },
  {
    "order": 8,
    "id": null,
    "libelle": "Impressions",
    "icon": "bi bi-printer",
    "path": "#",
    "code": "800",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Fiche de notes",
        "icon": "bi bi-file-earmark-text",
        "path": "/impressions/fiche-notes",
        "code": "800",
        "permission": null,
        "reference": "fiche_notes"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Liste de présence",
        "icon": "bi bi-list-check",
        "path": "/impressions/liste-presence",
        "code": "800",
        "permission": null,
        "reference": "liste_presence"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Fiche bilan",
        "icon": "bi bi-file-earmark-bar-graph",
        "path": "/impressions/bilan-annuel",
        "code": "800",
        "permission": null,
        "reference": "fiche_bilan_annuel"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Fiche sacramentel",
        "icon": "bi bi-clipboard-pulse",
        "path": "/impressions/suivi-sacramentel",
        "code": "800",
        "permission": null,
        "reference": "fiche_suivi_sacramentel"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Fiche Baptême",
        "icon": "bi bi-file-earmark-person",
        "path": "/impressions/renseignements-bapteme",
        "code": "800",
        "permission": null,
        "reference": "renseignements_bapteme"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Fiche Communion",
        "icon": "bi bi-file-earmark-person",
        "path": "/impressions/renseignements-premiere-communion",
        "code": "800",
        "permission": null,
        "reference": "renseignements_premiere_communion"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Fiche Confirmation",
        "icon": "bi bi-file-earmark-person",
        "path": "/impressions/renseignements-confirmation",
        "code": "800",
        "permission": null,
        "reference": "renseignements_confirmation"
      }
    ],
    "reference": "main_impressions"
  },
  {
    "order": 9,
    "id": null,
    "libelle": "Documents",
    "icon": "bi bi-file-earmark-richtext",
    "path": "#",
    "code": "900",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Modèles documents",
        "icon": "bi bi-file-earmark",
        "path": "/modeles-documents",
        "code": "900",
        "permission": null,
        "reference": "modeles_documents"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Génération documents",
        "icon": "bi bi-file-earmark-plus",
        "path": "/generation-documents",
        "code": "900",
        "permission": null,
        "reference": "generation_documents"
      }
    ],
    "reference": "main_documents_officiels"
  },
  {
    "order": 10,
    "id": null,
    "libelle": "Rapports",
    "icon": "bi bi-file-earmark-bar-graph",
    "path": "/rapports",
    "code": "1000",
    "permission": "1,2,3,4",
    "sousMenus": [],
    "reference": "main_rapports_statistiques"
  },
  {
    "order": 11,
    "id": null,
    "libelle": "Organisation",
    "icon": "bi bi-building",
    "path": "#",
    "code": "1100",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Années pastorales",
        "icon": "bi bi-calendar-range",
        "path": "/annees-pastorales",
        "code": "1100",
        "permission": null,
        "reference": "annees_pastorales"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Sections",
        "icon": "bi bi-diagram-2",
        "path": "/sections",
        "code": "1100",
        "permission": null,
        "reference": "sections"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Niveaux",
        "icon": "bi bi-layers",
        "path": "/niveaux",
        "code": "1100",
        "permission": null,
        "reference": "niveaux"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Classes",
        "icon": "bi bi-door-open",
        "path": "/classes",
        "code": "1100",
        "permission": null,
        "reference": "classes"
      },
    //   {
    //     "order": null,
    //     "id": null,
    //     "libelle": "Groupes",
    //     "icon": "bi bi-collection",
    //     "path": "/groupes",
    //     "code": "1100",
    //     "permission": null,
    //     "reference": "groupes"
    //   },
      {
        "order": null,
        "id": null,
        "libelle": "Animateurs",
        "icon": "bi bi-person-workspace",
        "path": "/animateurs",
        "code": "1100",
        "permission": null,
        "reference": "animateurs"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Affectation animateurs",
        "icon": "bi bi-person-check",
        "path": "/affectations-animateurs",
        "code": "1100",
        "permission": null,
        "reference": "affectations_animateurs"
      },
      {
        "order": null,
        "id": null,
        "libelle": "CEB",
        "icon": "bi bi-house-heart",
        "path": "/cebs",
        "code": "1100",
        "permission": null,
        "reference": "cebs"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Mouvements",
        "icon": "bi bi-people-fill",
        "path": "/mouvements",
        "code": "1100",
        "permission": null,
        "reference": "mouvements"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Calendrier",
        "icon": "bi bi-calendar3",
        "path": "/calendrier",
        "code": "1100",
        "permission": null,
        "reference": "calendrier"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Modules trimestriels",
        "icon": "bi bi-calendar3-range",
        "path": "/modules-trimestriels",
        "code": "1100",
        "permission": null,
        "reference": "modules_trimestriels"
      }
    ],
    "reference": "main_organisation"
  },
  {
    "order": 12,
    "id": null,
    "libelle": "Utilisateurs & Sécurité",
    "icon": "bi bi-shield-lock",
    "path": "#",
    "code": "1300",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Utilisateurs",
        "icon": "bi bi-person-fill",
        "path": "/utilisateurs",
        "code": "1300",
        "permission": null,
        "reference": "utilisateurs"
      },
      {
        "order": null,
        "id": null,
        "libelle": "Profils",
        "icon": "bi bi-shield-fill-check",
        "path": "/profils",
        "code": "1300",
        "permission": null,
        "reference": "profils"
      }
    ],
    "reference": "main_utilisateurs_securite"
  },
  {
    "order": 13,
    "id": null,
    "libelle": "Paramètres",
    "icon": "bi bi-gear-wide-connected",
    "path": "#",
    "code": "1400",
    "permission": "1,2,3,4",
    "sousMenus": [
      {
        "order": null,
        "id": null,
        "libelle": "Configuration",
        "icon": "bi bi-building-gear",
        "path": "/parametres/configuration",
        "code": "1400",
        "permission": null,
        "reference": "configuration_paroisse"
      },
     
      {
        "order": null,
        "id": null,
        "libelle": "Sauvegardes",
        "icon": "bi bi-database-down",
        "path": "/parametres/sauvegardes",
        "code": "1400",
        "permission": null,
        "reference": "sauvegardes"
      }
    ],
    "reference": "main_parametres"
  }
];