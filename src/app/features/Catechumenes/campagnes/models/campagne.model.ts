import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';

export type StatutCampagne = 'ouverte' | 'fermee' | 'suspendue';

export interface CampagnePreinscriptionDto {
  id: string;
  titre: string;
  nom?: string;
  date_debut: string;
  date_fin: string;
  statut: StatutCampagne;
  est_ouverte: boolean;
  description?: string;
  sections_autorisees?: string[];
  public_url?: string;
  qr_code_url?: string;
  annee_catechese?: AnneeCatecheseDto;
  preinscriptions_count?: number;
  created_at?: string;
}

export interface CreateCampagnePreinscriptionDto {
  annee_catechese_id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  sections_autorisees?: string[];
  description?: string;
  statut?: StatutCampagne;
}

export interface UpdateCampagnePreinscriptionDto {
  titre?: string;
  date_debut?: string;
  date_fin?: string;
  sections_autorisees?: string[];
  description?: string;
  statut?: StatutCampagne;
}
