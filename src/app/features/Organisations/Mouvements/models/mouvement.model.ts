export type MouvementStatut = 'Active' | 'Inactive';
export type MouvementStatutCode = 'active' | 'inactive';

export interface Mouvement {
  id: string;
  nom: string;
  responsable?: string;
  telephone?: string;
  description?: string;
  statut: MouvementStatut;
  statut_code: MouvementStatutCode;
  total_inscriptions?: number;
  created_at?: string;
}

export type MouvementDto = Mouvement;

export interface CreateMouvementDto {
  nom: string;
  responsable?: string;
  telephone?: string;
  description?: string;
  statut?: 'Active' | 'Inactive' | 'active' | 'inactive';
}

export interface UpdateMouvementDto {
  nom?: string;
  responsable?: string;
  telephone?: string;
  description?: string;
  statut?: 'Active' | 'Inactive' | 'active' | 'inactive';
}
