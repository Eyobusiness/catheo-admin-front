export interface Section {
  id: string;
  nom: string;
  code: string;
  description?: string;
  ordre: number;
  statut: string;
  total_niveaux?: number;
}

export interface CreateSectionDto {
  nom: string;
  code: string;
  description?: string;
  ordre: number;
  statut: string;
}

export interface UpdateSectionDto {
  nom?: string;
  code?: string;
  description?: string;
  ordre?: number;
  statut?: string;
}

