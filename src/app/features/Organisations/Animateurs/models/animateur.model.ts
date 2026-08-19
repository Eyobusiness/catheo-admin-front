import { User } from '../../../../core/models/auth.model';

export type AnimateurSexe = 'M' | 'F';
export type AnimateurStatut = 'actif' | 'inactif';

export interface Animateur {
  id: string;
  matricule?: string;
  nom: string;
  prenoms: string;
  sexe: AnimateurSexe;
  telephone?: string;
  email?: string;
  profession?: string;
  statut: AnimateurStatut;
  user?: User;
}

export type AnimateurDto = Animateur;

export interface CreateAnimateurDto {
  nom: string;
  prenoms: string;
  sexe: AnimateurSexe;
  telephone?: string;
  email?: string;
  profession?: string;
  create_user_account?: boolean;
}

export interface UpdateAnimateurStatusDto {
  statut: AnimateurStatut;
}

export interface UpdateAnimateurDto {
  nom?: string;
  prenoms?: string;
  sexe?: AnimateurSexe;
  telephone?: string;
  email?: string;
  profession?: string;
  statut?: AnimateurStatut;
}
