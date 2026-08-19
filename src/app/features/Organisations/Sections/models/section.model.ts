export type SectionStatut = 'actif' | 'inactif';

export interface Section {
  id: string;
  nom: string;
  code: string;
  description: string;
  ordre: number;
  statut: SectionStatut;
  total_niveaux?: number;
}

export interface CreateSectionDto {
  nom: string;
  code: string;
  description: string;
  ordre: number;
  statut: SectionStatut;
}

export interface UpdateSectionDto {
  nom: string;
  code: string;
  description: string;
  ordre: number;
  statut: SectionStatut;
}
