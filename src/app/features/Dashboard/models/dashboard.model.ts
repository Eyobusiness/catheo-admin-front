export interface AnneeActiveSummary {
  id: number | string;
  uuid: string;
  libelle: string;
  date_debut?: string;
  date_fin?: string;
  statut?: string;
}

export interface DashboardKPIs {
  catechumenes_actifs: number;
  sections: number;
  classes: number;
  animateurs: number;
  preinscriptions_en_attente: number;
}

export interface SectionEffectif {
  section_id: string;
  section_nom: string;
  code?: string;
  effectif: number;
  pourcentage?: number;
}

export interface NiveauEffectif {
  niveau_id: string;
  niveau_nom: string;
  section_id?: string;
  section_nom: string;
  effectif: number;
}

export interface ClasseEffectif {
  classe_id: string;
  classe_nom: string;
  niveau_id?: string;
  niveau_nom: string;
  section_id?: string;
  section_nom: string;
  effectif: number;
  capacite_max?: number;
  pourcentage?: number;
}

export interface DashboardEffectifs {
  par_section: SectionEffectif[];
  par_niveau: NiveauEffectif[];
  par_classe: ClasseEffectif[];
}

export interface DashboardSacrements {
  bapteme: number;
  premiere_communion: number;
  confirmation: number;
}

export interface DashboardAlerteItem {
  type: string;
  count: number;
  message: string;
}

export interface DashboardAlertes {
  nouvelles_preinscriptions: DashboardAlerteItem;
  appels_non_effectues: DashboardAlerteItem;
  [key: string]: DashboardAlerteItem | any;
}

export interface DashboardActivite {
  id: string;
  action: string;
  entite: string;
  description: string;
  auteur: string;
  date: string;
}

export interface DashboardSummaryData {
  annee_active: AnneeActiveSummary | null;
  summary: DashboardKPIs;
  effectifs: DashboardEffectifs;
  sacrements: DashboardSacrements;
  alertes: DashboardAlertes;
  activites_recentes?: DashboardActivite[];
}

export interface DashboardSummaryResponse {
  status: string;
  user_type: 'admin' | 'super_admin' | 'animateur' | 'parent';
  data: DashboardSummaryData;
}
