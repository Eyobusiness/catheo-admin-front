import { AnneeCatecheseDto } from '../../AnneesPastorales/models/annee-catechese.model';

export type ModuleTrimestrielStatut = 'en cours' | 'termine' | string;

export interface ModuleTrimestriel {
  id: string;
  annee_catechese_id?: string;
  annee_catechese?: AnneeCatecheseDto;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut?: string;
}

export type ModuleTrimestrielDto = ModuleTrimestriel;

export interface CreateModuleTrimestrielDto {
  annee_catechese_id?: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut?: string;
}

export interface UpdateModuleTrimestrielDto {
  annee_catechese_id?: string;
  libelle?: string;
  date_debut?: string;
  date_fin?: string;
  statut?: string;
}




