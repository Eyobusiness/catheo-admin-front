export interface BilanAnnuelData {
  annee: {
    id: string | number;
    libelle: string;
    date_debut?: string;
    date_fin?: string;
    statut?: string;
  };
  synthese: {
    effectif_total: number;
    catechumenes_actifs: number;
    nouveaux: number;
    reinscriptions: number;
    mutations: number;
    sections: number;
    niveaux: number;
    classes: number;
    animateurs: number;
  };
  effectifs: {
    par_section: Array<{
      section_id: string;
      section_nom: string;
      code?: string;
      effectif: number;
      pourcentage?: number;
    }>;
    par_niveau: Array<{
      niveau_id: string;
      niveau_nom: string;
      section_nom: string;
      effectif: number;
      pourcentage?: number;
    }>;
    par_classe: Array<{
      classe_id: string;
      classe_nom: string;
      niveau_nom: string;
      section_nom: string;
      effectif: number;
      capacite_max?: number;
      taux_remplissage?: number;
    }>;
  };
  evolution: {
    disponible: boolean;
    annee_actuelle_libelle: string;
    annee_precedente_libelle: string;
    annee_actuelle: number;
    annee_precedente: number;
    difference: number;
    pourcentage: number;
  } | null;
  assiduite: {
    seances_prevues: number;
    seances_realisees: number;
    seances_annulees: number;
    seances_passees: number;
    presences: number;
    absences: number;
    absences_justifiees: number;
    taux_presence: number;
  };
  progression: Array<{
    niveau_id: string;
    niveau_nom: string;
    section_nom: string;
    effectif_inscrit: number;
    admis: number;
    ajournes: number;
    en_attente: number;
    taux_reussite?: number;
  }>;
  sacrements: {
    bapteme: { candidats: number; realises: number; restants: number };
    premiere_communion: { candidats: number; realises: number; restants: number };
    confirmation: { candidats: number; realises: number; restants: number };
  };
  inscriptions: {
    preinscriptions_total: number;
    validees: number;
    rejetees: number;
    en_attente: number;
    nouvelles_inscriptions: number;
    reinscriptions: number;
    taux_conversion?: number;
  };
  mutations: {
    total: number;
    departs: number;
    arrivees: number;
    par_statut: Array<{ statut: string; total: number }>;
  };
  animateurs: {
    total: number;
    animateurs_affectes: number;
    classes_affectees: number;
    seances_encadrees: number;
    taux_couverture: number;
  };
  alertes: Array<{
    type: string;
    niveau: 'info' | 'warning' | 'danger';
    count: number;
    message: string;
  }>;
  synthese_finale: {
    resume: string;
    taux_assiduite: number;
    taux_conversion?: number;
    couverture_classes: number;
  };
}

export interface BilanAnnuelResponse {
  status: string;
  data: BilanAnnuelData;
}
