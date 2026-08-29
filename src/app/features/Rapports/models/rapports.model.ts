export type TypeRapport =
  | 'Rentrée Pastorale'
  | 'Bilan Trimestriel'
  | 'Bilan Fin d\'Année'
  | 'Bilan Sacramentel'
  | 'Synthèse Financière';

export type StatutRapport = 'Brouillon' | 'Officiel' | 'Archivé';

export interface SectionStat {
  section: string;
  total: number;
  garcons: number;
  filles: number;
  tauxAssiduite: number;
  tauxReussite: number;
}

export interface NiveauStat {
  niveau: string;
  effectif: number;
  baptises: number;
  nonBaptises: number;
  moyenneGenerale: number;
  tauxRecouvrement: number;
}

export interface SacrementStat {
  sacrement: 'Baptême' | 'Première Communion' | 'Confirmation';
  candidats: number;
  valides: number;
  enAttente: number;
  tauxAccomplissement: number;
}

export interface StatistiquesPastorales {
  totalInscrits: number;
  totalGarcons: number;
  totalFilles: number;
  tauxAssiduiteGlobal: number;
  tauxReussiteGlobal: number;
  totalSacrementsPrevus: number;
  totalSacrementsValides: number;
  totalRecouvrementPct: number;
  repartitionSections: SectionStat[];
  repartitionNiveaux: NiveauStat[];
  statistiquesSacrements: SacrementStat[];
  evolutionPresenceMensuelle: { mois: string; taux: number }[];
}

export interface RapportPastoralItem {
  id: string;
  titre: string;
  type: TypeRapport;
  anneePastorale: string;
  periode: string;
  dateGeneration: string;
  auteur: string;
  statut: StatutRapport;
  resumeExecutif: string;
  inclureEffectifs: boolean;
  inclureAssiduite: boolean;
  inclureEvaluations: boolean;
  inclureSacrements: boolean;
  inclureFinances: boolean;
  commentairesCure?: string;
  statistiques?: StatistiquesPastorales;
}
