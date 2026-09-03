import { CampagnePreinscriptionDto } from '../../campagnes/models/campagne.model';
import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';
import { Section } from '../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../Organisations/Niveaux/models/niveau.model';

export type TypeDemandePreinscription = 'nouvelle_inscription' | 'reinscription' | 'premiere_inscription';
export type StatutPreinscription = 'en_attente' | 'validee' | 'rejetee';

interface PreinscriptionIdentiteFields {
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  lieu_naissance?: string;
  adresse?: string;
  domicile?: string;
  telephone?: string;
  profession?: string;
  classe_scolaire?: string;
  photo_url?: string;
  situation_matrimoniale?: string;
}

interface PreinscriptionFamilleFields {
  nom_pere?: string;
  origine_pere?: string;
  telephone_pere?: string;
  nom_mere?: string;
  origine_mere?: string;
  telephone_mere?: string;
  nom_tuteur?: string;
  telephone_tuteur?: string;
}

interface PreinscriptionSacrementFields {
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
}

interface PreinscriptionOrientationFields {
  campagne_id: string;
  type_demande: TypeDemandePreinscription;
  section_souhaite_id: string;
  niveau_souhaite_id: string;
}

type PreinscriptionMutableFields =
  & PreinscriptionOrientationFields
  & PreinscriptionIdentiteFields
  & PreinscriptionFamilleFields
  & PreinscriptionSacrementFields;

export interface PreinscriptionDto extends PreinscriptionMutableFields {
  id: string;
  code_dossier: string;
  nom_complet?: string;
  campagne?: CampagnePreinscriptionDto;
  annee_catechese?: AnneeCatecheseDto;
  section_souhaite?: Section;
  niveau_souhaite?: NiveauDto;
  classe_affectee?: ClasseDto;
  acte_naissance_url?: string;
  statut: StatutPreinscription;
  notes_validation?: string;
  frais_payes?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubmitPreinscriptionDto extends PreinscriptionMutableFields {}

export interface UpdatePreinscriptionDto {
  campagne_id?: string;
  type_demande?: TypeDemandePreinscription;
  section_souhaite_id?: string;
  niveau_souhaite_id?: string;
  nom?: string;
  prenoms?: string;
  sexe?: 'M' | 'F';
  date_naissance?: string;
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
}

export interface ValiderPreinscriptionDto {
  niveau_id: string;
  classe_id?: string;
  frais_payes?: boolean;
  notes_validation?: string;
}

export interface RejeterPreinscriptionDto {
  motif: string;
}
