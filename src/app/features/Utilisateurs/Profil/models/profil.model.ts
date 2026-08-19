export type StatutProfil = 'actif' | 'inactif';

export interface MenuActionFlagsDto {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  restore: boolean;
  force_delete: boolean;
}

export interface MenuDto {
  id: string;
  uuid: string;
  libelle: string;
  icon?: string;
  path?: string;
  reference: string;
  ordre: number;
  is_active: boolean;
  parent_id?: string;
  sousMenus?: MenuDto[];
}

export interface AccessibleMenuDto {
  uuid: string;
  libelle: string;
  icon?: string;
  path?: string;
  reference: string;
  ordre: number;
  permissions: MenuActionFlagsDto;
  sousMenus?: AccessibleMenuDto[];
}

export interface ProfilMenuPermissionDto {
  uuid?: string;
  profil_id: string;
  menu_id: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_restore: boolean;
  can_force_delete: boolean;
}

export interface PermissionItemDto {
  key: string;
  label: string;
}

export interface SubMenuPermissionDto {
  nom: string;
  code: string;
  permissions: PermissionItemDto[];
}

export interface PermissionTreeNodeDto {
  menu: string;
  code: string;
  permissions?: PermissionItemDto[];
  sous_menus?: SubMenuPermissionDto[];
}

export interface ProfilDto {
  id: string;
  uuid?: string;
  nom: string;
  code: string;
  description?: string;
  statut?: 'Actif' | 'Inactif' | 'actif' | 'inactif';
  statut_code?: 'actif' | 'inactif';
  permissions: string[];
  total_permissions?: number;
  is_system: boolean;
  users_count?: number;
  menus?: AccessibleMenuDto[];
  created_at?: string;
}

export type Profil = ProfilDto;

export interface CreateProfilDto {
  nom: string;
  description?: string;
  permissions: string[];
}

export interface UpdateProfilDto {
  nom?: string;
  description?: string;
  permissions?: string[];
}
