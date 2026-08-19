import { Section } from '../../Sections/models/section.model';

export type NiveauStatut = 'actif' | 'inactif' | 'Actif' | 'Inactif';

export interface Niveau {
  id: string;
  nom: string;
  description?: string;
  statut: 'Actif' | 'Inactif' | 'actif' | 'inactif';
  statut_code?: 'actif' | 'inactif';
  ordre_affichage?: number;
  ordre?: number;
  section_id?: string;
  section?: Section;
}

export type NiveauDto = Niveau;

export interface CreateNiveauDto {
  section_id: string;
  nom: string;
  description?: string;
  statut?: 'actif' | 'inactif';
  ordre_affichage?: number;
}

export interface UpdateNiveauDto {
  section_id?: string;
  nom?: string;
  description?: string;
  statut?: 'actif' | 'inactif';
  ordre_affichage?: number;
}
