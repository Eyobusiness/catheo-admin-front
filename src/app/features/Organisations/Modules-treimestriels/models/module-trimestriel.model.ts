import { AnneeCatecheseDto } from '../../AnneesPastorales/models/annee-catechese.model';

export type TrimestreCode = 'T1' | 'T2' | 'T3';

export interface ModuleTrimestriel {
  id: string;
  annee_catechese_id?: string;
  annee_catechese?: AnneeCatecheseDto;
  trimestre: TrimestreCode;
  libelle: string;
  date_debut: string;
  date_fin: string;
}

export type ModuleTrimestrielDto = ModuleTrimestriel;

export interface CreateModuleTrimestrielDto {
  annee_catechese_id: string;
  trimestre: TrimestreCode;
  libelle: string;
  date_debut: string;
  date_fin: string;
}

export interface UpdateModuleTrimestrielDto {
  annee_catechese_id?: string;
  trimestre?: TrimestreCode;
  libelle?: string;
  date_debut?: string;
  date_fin?: string;
}

