import { ProfilItem } from '../Profil/models/profil.model';
export * from '../Profil/models/profil.model';

export type StatutUtilisateur = 'actif' | 'inactif' | 'suspendu';

export interface UserItem {
  id: string; // UUID
  uuid?: string;
  paroisse_configuration_id?: number;
  paroisse_id?: number;
  name: string;
  nom?: string;
  prenoms?: string;
  lastName?: string;
  firstName?: string;
  email: string;
  username?: string;
  telephone?: string;
  phone?: string;
  user_type?: 'admin' | 'super_admin' | 'animateur' | 'parent';
  statut?: 'actif' | 'inactif';
  status?: 'actif' | 'inactif';
  dernier_login_at?: string;
  profil?: ProfilItem | null;
  paroisse?: {
    id?: string;
    nom_paroisse?: string;
    nom?: string;
    code_paroisse?: string;
    diocese?: string;
    ville?: string;
    commune?: string;
  } | null;
  created_at?: string;
}

export type UserDto = UserItem;
export type User = UserItem;

export interface UserPaginationMeta {
  current_page: number;
  per_page: number;
  total_elements: number;
  total_pages: number;
  has_next: boolean;
}

export interface UserListResponse {
  status: string;
  meta: UserPaginationMeta;
  data: UserItem[];
}

export interface CreateUserDto {
  profil_id: string | number;
  nom?: string;
  prenoms?: string;
  name?: string;
  email: string;
  password: string;
  telephone?: string;
  statut?: 'actif' | 'inactif';
}

export interface UpdateUserDto {
  profil_id?: string | number;
  nom?: string;
  prenoms?: string;
  name?: string;
  email?: string;
  password?: string;
  telephone?: string;
  statut?: 'actif' | 'inactif';
}
