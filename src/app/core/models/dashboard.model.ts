export type SectionCatechese = 'EVEIL' | 'ANNEE_1' | 'ANNEE_2' | 'ANNEE_3' | 'ANNEE_4' | 'CONFIRMATION';

export type InscriptionStatus = 'VALIDEE' | 'EN_ATTENTE' | 'A_COMPLETER' | 'EN_COURS' | 'REPORTEE';

export interface PastoralStat {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  period: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
}

export interface CatechumeneItem {
  id: string;
  nom: string;
  prenoms: string;
  age: number;
  genre: 'M' | 'F';
  section: string;
  groupe: string;
  catechiste: string;
  statut: InscriptionStatus;
  cotisation: 'PAYE' | 'PARTIEL' | 'EN_ATTENTE';
  sacrementVise: string;
}

export interface ModuleRoadmap {
  id: string;
  libelle: string;
  icon: string;
  description: string;
  avancement: number;
  statut: 'En cours' | 'Planifié' | 'Presque prêt';
}
