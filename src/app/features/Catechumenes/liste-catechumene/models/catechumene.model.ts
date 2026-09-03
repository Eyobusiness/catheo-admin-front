import { Ceb } from '../../../Organisations/Ceb/models/ceb.model';

export type StatutCatechumene = 'actif' | 'abandon' | 'transfere' | 'complete';
export type TypeParrain = 'parrain' | 'marraine';

export interface CatechumeneDto {
  id: string;
  code_catechumene: string;
  matricule?: string;
  nom: string;
  prenoms: string;
  nom_complet?: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  lieu_naissance?: string;
  adresse?: string;
  domicile?: string;
  profession?: string;
  classe_scolaire?: string;
  situation_matrimoniale?: string;
  telephone?: string;
  photo_path?: string;
  photo_url?: string;
  nom_pere?: string;
  origine_pere?: string;
  telephone_pere?: string;
  nom_mere?: string;
  origine_mere?: string;
  telephone_mere?: string;
  nom_tuteur?: string;
  telephone_tuteur?: string;
  est_baptise: boolean;
  num_carnet_bapteme?: string;
  date_bapteme?: string;
  lieu_bapteme?: string;
  diocese_bapteme?: string;
  ville_bapteme?: string;
  paroisse_bapteme?: string;
  date_premiere_communion?: string;
  paroisse_premiere_communion?: string;
  date_confirmation?: string;
  paroisse_confirmation?: string;
  ministre_confirmation?: string;
  nom_parrain?: string;
  sexe_parrain?: 'M' | 'F';
  telephone_parrain?: string;
  statut: StatutCatechumene;
  ceb_id?: string;
  ceb?: Ceb;
  inscriptions_annuelles?: any[];
  parrains_marraines?: ParrainMarraineDto[];
  created_at: string;
}

export interface CreateCatechumeneDto {
  ceb_id?: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  lieu_naissance?: string;
  adresse?: string;
  domicile?: string;
  profession?: string;
  classe_scolaire?: string;
  situation_matrimoniale?: string;
  telephone?: string;
  photo_url?: string;
  nom_pere?: string;
  origine_pere?: string;
  telephone_pere?: string;
  nom_mere?: string;
  origine_mere?: string;
  telephone_mere?: string;
  nom_tuteur?: string;
  telephone_tuteur?: string;
  est_baptise?: boolean;
  num_carnet_bapteme?: string;
  date_bapteme?: string;
  lieu_bapteme?: string;
  diocese_bapteme?: string;
  ville_bapteme?: string;
  paroisse_bapteme?: string;
  date_premiere_communion?: string;
  paroisse_premiere_communion?: string;
  date_confirmation?: string;
  paroisse_confirmation?: string;
  ministre_confirmation?: string;
  nom_parrain?: string;
  sexe_parrain?: 'M' | 'F';
  telephone_parrain?: string;
  statut?: StatutCatechumene;
}

export interface UpdateCatechumeneDto extends Partial<CreateCatechumeneDto> {}

export interface ParrainMarraineDto {
  id: string;
  catechumene_id?: string;
  type: TypeParrain;
  nom_prenoms: string;
  telephone?: string;
  email?: string;
  domicile?: string;
  paroisse_origine?: string;
  representant_nom?: string;
  representant_contact?: string;
  sacrement_confirmation: boolean;
  catechumene?: CatechumeneDto;
  created_at?: string;
}

export interface CreateParrainMarraineDto {
  catechumene_id: string;
  type: TypeParrain;
  nom_prenoms: string;
  telephone?: string;
  email?: string;
  domicile?: string;
  paroisse_origine?: string;
  representant_nom?: string;
  representant_contact?: string;
  sacrement_confirmation: boolean;
}

export interface UpdateParrainMarraineDto {
  type?: TypeParrain;
  nom_prenoms?: string;
  telephone?: string;
  email?: string;
  domicile?: string;
  paroisse_origine?: string;
  representant_nom?: string;
  representant_contact?: string;
  sacrement_confirmation?: boolean;
}
