import { NiveauDto } from '../../Niveaux/models/niveau.model';
import { AnneeCatechese, AnneeCatecheseDto } from '../../AnneesPastorales/models/annee-catechese.model';

export type ClasseStatut = 'active' | 'inactive';

export interface Classe {
  id: string;
  nom: string;
  capacite_max: number;
  statut: ClasseStatut;
  niveau_id?: string;
  niveau?: NiveauDto;
  annee_catechese_id?: string;
  annee_catechese?: AnneeCatechese;
  effectif_actuel?: number;
}

export type ClasseDto = Classe;

export interface CreateClasseDto {
  niveau_id: string;
  annee_catechese_id?: string;
  nom: string;
  capacite_max?: number;
  statut?: ClasseStatut;
}

export interface UpdateClasseDto {
  niveau_id?: string;
  annee_catechese_id?: string;
  nom?: string;
  capacite_max?: number;
  statut?: ClasseStatut;
}
