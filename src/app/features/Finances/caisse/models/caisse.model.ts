import { AnneeCatechese, AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';

export type TypeMouvementCaisse = 'entree' | 'recette' | 'sortie' | 'depense' | 'remboursement';

export interface CaisseParoissialeDto {
  id: string;
  uuid?: string;
  reference?: string;
  reference_document?: string;
  date_mouvement: string;
  libelle: string;
  categorie?: string;
  montant: number;
  type_mouvement: TypeMouvementCaisse;
  mode_paiement?: string;
  caissier_nom?: string;
  solde_apres?: number;
  annee_catechese_id?: string;
  annee_catechese?: AnneeCatecheseDto | AnneeCatechese;
  created_at?: string;
  updated_at?: string;
}

export type CaisseMouvementDto = CaisseParoissialeDto;

export interface CaisseKpiDto {
  solde_en_caisse: number;
  total_encaisse: number;
  total_rembourse: number;
  total_depense?: number;
  paiements_valides_count?: number;
}

export type CaisseKpisDto = CaisseKpiDto;

export interface CreateMouvementCaisseDto {
  annee_catechese_id?: string;
  type_mouvement: TypeMouvementCaisse;
  categorie?: string;
  montant: number;
  reference_document?: string;
  libelle: string;
  date_mouvement: string;
  mode_paiement?: string;
}

export interface RemboursementRequestDto {
  montant_rembourse?: number;
  motif: string;
}

export type RemboursementCaisseDto = RemboursementRequestDto;
