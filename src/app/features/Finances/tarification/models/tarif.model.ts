import { NiveauDto } from '../../../Organisations/Niveaux/models/niveau.model';
import { AnneeCatechese, AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { OperationPaiementDto } from '../../operation-financiere/models/operation.model';

export type TypeTarif =
  | 'inscription'
  | 'bapteme'
  | 'premiere_communion'
  | 'confirmation'
  | 'retraite'
  | 'sacrement_bapteme'
  | 'sacrement_premiere_communion'
  | 'sacrement_confirmation'
  | string;

export type StatutTarif = 'actif' | 'inactif';

export interface TarifDto {
  id: string;
  uuid?: string;
  intitule: string;
  nom?: string;
  description?: string;
  montant: number;
  est_obligatoire?: boolean;
  type_tarif: TypeTarif;
  statut?: StatutTarif;
  periode_debut?: string;
  periode_fin?: string;
  annee_catechese_id?: string;
  annee_libelle?: string;
  annee_catechese?: AnneeCatecheseDto | AnneeCatechese;
  niveaux_concernes?: {
    id: string;
    nom: string;
    code?: string;
  }[];
  niveaux_ids?: string[];
  niveau_ids?: string[];
  niveau_id?: string;
  niveau?: NiveauDto;
  niveaux?: NiveauDto[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateTarifDto {
  intitule: string;
  description?: string;
  montant: number;
  est_obligatoire?: boolean;
  type_tarif?: string;
  statut?: StatutTarif;
  periode_debut?: string;
  periode_fin?: string;
  annee_catechese_id?: string;
  niveaux_ids?: string[];
  niveau_ids?: string[];
  niveau_id?: string;
}

export interface UpdateTarifDto extends Partial<CreateTarifDto> {}

export interface GenererOperationsParTarifResultDto {
  status: 'success' | 'error';
  message: string;
  count: number;
  operations?: OperationPaiementDto[];
}
