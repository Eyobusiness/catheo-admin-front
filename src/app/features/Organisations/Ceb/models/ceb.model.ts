export type CebStatut = 'Active' | 'Inactive';
export type CebStatutCode = 'active' | 'inactive';

export interface Ceb {
  id: string;
  nom: string;
  responsable?: string;
  telephone?: string;
  adresse?: string;
  description?: string;
  statut: CebStatut;
  statut_code: CebStatutCode;
  total_inscriptions?: number;
  created_at?: string;
}

export type CebDto = Ceb;

export interface CreateCebDto {
  nom: string;
  responsable?: string;
  telephone?: string;
  adresse?: string;
  description?: string;
  statut?: 'Active' | 'Inactive' | 'active' | 'inactive';
}

export interface UpdateCebDto {
  nom?: string;
  responsable?: string;
  telephone?: string;
  adresse?: string;
  description?: string;
  statut?: 'Active' | 'Inactive' | 'active' | 'inactive';
}
