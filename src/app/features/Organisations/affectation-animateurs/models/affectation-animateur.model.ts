import { AnimateurDto } from '../../Animateurs/models/animateur.model';
import { ClasseDto } from '../../Classe/models/classe.model';

export interface AffectationAnimateur {
  id: string;
  annee_catechese_id?: string;
  animateur_id?: string;
  classe_id?: string;
  animateur: AnimateurDto;
  classe: ClasseDto;
  role: string;
  date_affectation: string;
}

export type AffectationAnimateurDto = AffectationAnimateur;

export interface CreateAffectationAnimateurDto {
  annee_catechese_id?: string;
  animateur_id: string;
  classe_id: string;
  role?: string;
}

export interface UpdateAffectationAnimateurDto {
  animateur_id?: string;
  classe_id?: string;
  role?: string;
}

export interface AffectationFilterParams {
  annee_catechese_id?: string;
  classe_id?: string;
  animateur_id?: string;
  search?: string;
}

