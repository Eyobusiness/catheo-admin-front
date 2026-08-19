import { ProfilDto } from '../Profil/models/profil.model';
export * from '../Profil/models/profil.model';

export type StatutUtilisateur = 'actif' | 'inactif' | 'suspendu';

export interface ParoisseInfoMini {
  id?: string;
  nom?: string;
  code_paroisse?: string;
  ville?: string;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  telephone?: string;
  statut: StatutUtilisateur;
  profil?: ProfilDto;
  paroisse?: ParoisseInfoMini;
  created_at: string;
}

export type User = UserDto;

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  telephone?: string;
  profil_id: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  telephone?: string;
  profil_id?: string;
}

export interface UpdateUserStatusDto {
  statut: StatutUtilisateur;
}
