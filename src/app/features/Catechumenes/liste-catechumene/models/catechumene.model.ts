import { Ceb } from '../../../Organisations/Ceb/models/ceb.model';

export type StatutCatechumene = 'actif' | 'abandon' | 'transfere' | 'complete';
export type TypeParrain = 'parrain' | 'marraine';

export interface CatechumeneDto {
  id: string;
  uuid?: string;
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
  classe_id?: string;
  classe_nom?: string;
  classe?: any;
  niveau_id?: string;
  niveau_nom?: string;
  niveau?: any;
  section_id?: string;
  section_nom?: string;
  annee_catechese_id?: string;
  annee_libelle?: string;
  inscriptions_annuelles?: any[];
  parrains_marraines?: ParrainMarraineDto[];
  progression_pastorale?: ProgressionPastoraleDto;
  created_at: string;
}

export interface ParcoursInfo {
  section_id?: number | string;
  section_uuid?: string;
  section_nom?: string;
  section_code?: string;
  section_code_normalise?: string;
  niveau_id?: number | string;
  niveau_uuid?: string;
  niveau_nom?: string;
  annee_pastorale?: string;
}

export interface ProgressionPastoraleDto {
  eligible: boolean;
  est_fin_parcours: boolean;
  est_admis: boolean;
  decision_bilan?: string | null;
  decision_normalisee?: string | null;
  parcours_actuel?: ParcoursInfo | null;
  parcours_suivant?: ParcoursInfo | null;
  message?: string;
}

export interface CreateCatechumeneDto {
  ceb_id?: string;
  section_id?: string;
  niveau_id?: string;
  classe_id?: string;
  annee_catechese_id?: string;
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
