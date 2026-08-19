import { CampagnePreinscriptionDto } from '../../campagnes/models/campagne.model';
import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { Section } from '../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../Organisations/Niveaux/models/niveau.model';

export type TypeDemandePreinscription = 'nouvelle_inscription' | 'reinscription' | 'premiere_inscription';
export type StatutPreinscription = 'en_attente' | 'validee' | 'rejetee';

export interface PreinscriptionDto {
  id: string;
  code_dossier: string;
  type_demande: TypeDemandePreinscription;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance: string;
  lieu_naissance?: string;
  adresse?: string;
  domicile?: string;
  telephone?: string;
  profession?: string;
  classe_scolaire?: string;
  photo_url?: string;
  situation_matrimoniale?: string;

  // Parents
  nom_pere?: string;
  origine_pere?: string;
  telephone_pere?: string;
  nom_mere?: string;
  origine_mere?: string;
  telephone_mere?: string;
  nom_tuteur?: string;
  telephone_tuteur?: string;

  // Sacrements
  est_baptise: boolean;
  num_carnet_bapteme?: string;
  date_bapteme?: string;
  lieu_bapteme?: string;
  paroisse_bapteme?: string;
  ville_bapteme?: string;
  diocese_bapteme?: string;

  date_premiere_communion?: string;
  paroisse_premiere_communion?: string;

  date_confirmation?: string;
  paroisse_confirmation?: string;
  ministre_confirmation?: string;

  nom_parrain?: string;
  sexe_parrain?: 'M' | 'F';
  telephone_parrain?: string;

  acte_naissance_url?: string;
  campagne_id?: string;
  campagne?: CampagnePreinscriptionDto;
  annee_catechese?: AnneeCatecheseDto;
  section_souhaite_id?: string;
  section_souhaite?: Section;
  niveau_souhaite_id?: string;
  niveau_souhaite?: NiveauDto;
  statut: StatutPreinscription;
  notes_validation?: string;
  frais_payes?: boolean;
  created_at?: string;
}

export interface SubmitPreinscriptionDto {
  campagne_id: string;
  type_demande: TypeDemandePreinscription;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance: string;
  lieu_naissance?: string;
  adresse?: string;
  domicile?: string;
  telephone?: string;
  profession?: string;
  classe_scolaire?: string;
  photo_url?: string;
  situation_matrimoniale?: string;

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
  paroisse_bapteme?: string;
  ville_bapteme?: string;
  diocese_bapteme?: string;

  date_premiere_communion?: string;
  paroisse_premiere_communion?: string;

  date_confirmation?: string;
  paroisse_confirmation?: string;
  ministre_confirmation?: string;

  nom_parrain?: string;
  sexe_parrain?: 'M' | 'F';
  telephone_parrain?: string;

  section_souhaite_id?: string;
  niveau_souhaite_id?: string;
}

export interface UpdatePreinscriptionDto extends Partial<SubmitPreinscriptionDto> {
  statut?: StatutPreinscription;
  notes_validation?: string;
}

export interface ValiderPreinscriptionDto {
  niveau_id: string;
  classe_id?: string;
  frais_payes: boolean;
  notes_validation?: string;
}

export interface RejeterPreinscriptionDto {
  motif?: string;
}
