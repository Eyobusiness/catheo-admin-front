import { AnimateurProfile } from './animateur-auth.model';

export interface AffectationAnimateurDetail {
  id?: string | number;
  uuid?: string;
  animateur_id?: string | number;
  classe_id?: string | number;
  annee_catechese_id?: string | number;
  role?: string;
  statut?: string;
  date_affectation?: string;
}

export interface ClasseDetail {
  id: string | number;
  uuid?: string;
  nom: string;
  code?: string;
  capacite_max?: number;
  effectif?: number;
  effectif_actuel?: number;
  description?: string;
  niveau_id?: string | number;
  statut?: string;
}

export interface NiveauDetail {
  id: string | number;
  uuid?: string;
  nom: string;
  code?: string;
  section_id?: string | number;
  ordre?: number;
}

export interface SectionDetail {
  id: string | number;
  uuid?: string;
  nom: string;
  code?: string;
  age_min?: number;
  age_max?: number;
}

export interface AnneePastoraleDetail {
  id: string | number;
  uuid?: string;
  libelle: string;
  date_debut?: string;
  date_fin?: string;
  statut?: string;
  is_active?: boolean;
}

export interface CatechumeneInscrit {
  id: string | number;
  uuid?: string;
  matricule?: string;
  nom: string;
  prenoms: string;
  nom_complet?: string;
  sexe?: 'M' | 'F' | string;
  date_naissance?: string;
  telephone?: string;
  telephone_parent?: string;
  telephone_pere?: string;
  nom_pere?: string;
  telephone_mere?: string;
  nom_mere?: string;
  telephone_tuteur?: string;
  nom_tuteur?: string;
  nom_parent?: string;
  photo_url?: string;
  photo?: string;
  statut?: string;
  statut_inscription?: string;
  parrain_nom?: string;
  parrain_telephone?: string;
}

export interface MaClasseResponse {
  data?: {
    animateur?: AnimateurProfile;
    annee_pastorale?: AnneePastoraleDetail;
    annee_catechese?: AnneePastoraleDetail;
    affectation?: AffectationAnimateurDetail;
    classe?: ClasseDetail;
    niveau?: NiveauDetail;
    section?: SectionDetail;
    effectif?: number;
    total_eleves?: number;
    eleves?: any[];
    catechumenes?: CatechumeneInscrit[];
    inscriptions?: any[];
  };
  animateur?: AnimateurProfile;
  annee_pastorale?: AnneePastoraleDetail;
  annee_catechese?: AnneePastoraleDetail;
  affectation?: AffectationAnimateurDetail;
  classe?: ClasseDetail;
  niveau?: NiveauDetail;
  section?: SectionDetail;
  effectif?: number;
  total_eleves?: number;
  eleves?: any[];
  catechumenes?: CatechumeneInscrit[];
  inscriptions?: any[];
  message?: string;
}
