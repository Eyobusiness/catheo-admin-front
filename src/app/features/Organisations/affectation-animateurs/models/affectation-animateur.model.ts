import { AnimateurDto } from '../../Animateurs/models/animateur.model';
import { ClasseDto } from '../../Classe/models/classe.model';

export type RoleAnimateur = 'principal' | 'adjoint' | 'assistant';

export interface AffectationAnimateur {
  id: string;
  animateur_id?: string;
  classe_id?: string;
  animateur: AnimateurDto;
  classe: ClasseDto;
  role: RoleAnimateur;
  date_affectation: string;
}

export type AffectationAnimateurDto = AffectationAnimateur;

export interface CreateAffectationAnimateurDto {
  animateur_id: string;
  classe_id: string;
  role?: RoleAnimateur;
}

export interface UpdateAffectationAnimateurDto {
  animateur_id?: string;
  classe_id?: string;
  role?: RoleAnimateur;
}
