export interface MenuActionPermission {
  read?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  restore?: boolean;
  force_delete?: boolean;
  can_read?: boolean;
  can_create?: boolean;
  can_update?: boolean;
  can_delete?: boolean;
  can_restore?: boolean;
  can_force_delete?: boolean;
}

export interface SousMenuItem {
  uuid: string;
  libelle: string;
  reference: string;
  path: string;
  icon?: string;
  ordre?: number;
  permissions: MenuActionPermission;
}

export interface MenuTreeItem {
  uuid: string;
  menu?: string;
  libelle: string;
  reference: string;
  code?: string;
  path: string;
  icon?: string;
  ordre?: number;
  total_actions?: number;
  permissions: MenuActionPermission;
  sousMenus: SousMenuItem[];
}

export interface ProfilItem {
  id: string; // UUID
  uuid: string;
  nom: string;
  name?: string;
  code: string;
  description?: string;
  statut: 'Actif' | 'Inactif' | 'actif' | 'inactif';
  statut_code: 'actif' | 'inactif';
  permissions: string[];
  total_permissions: number;
  is_system: boolean;
  users_count: number;
  menus?: MenuTreeItem[];
  created_at?: string;
}

export type ProfilDto = ProfilItem;
export type Profil = ProfilItem;

export interface CreateProfilDto {
  nom: string;
  code?: string;
  description?: string;
  statut?: 'actif' | 'inactif';
  permissions?: string[];
  menu_permissions?: {
    uuid?: string;
    menu_id?: number | string;
    reference?: string;
    permissions: {
      read: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
      restore?: boolean;
      force_delete?: boolean;
    };
    sousMenus?: {
      uuid?: string;
      reference?: string;
      permissions: {
        read: boolean;
        create: boolean;
        update: boolean;
        delete: boolean;
        restore?: boolean;
        force_delete?: boolean;
      };
    }[];
  }[];
}

export interface UpdateProfilDto {
  nom?: string;
  code?: string;
  description?: string;
  statut?: 'actif' | 'inactif';
  permissions?: string[];
  menu_permissions?: CreateProfilDto['menu_permissions'];
}
