import { CatechumeneDto } from '../../../Catechumenes/liste-catechumene/models/catechumene.model';
import { TarifDto } from '../../tarification/models/tarif.model';
import { AnneeCatechese, AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';

export type StatutOperation = 'en_attente' | 'partiellement_paye' | 'paye' | 'annule';
export type ModePaiement = 'especes' | 'mobile_money' | 'cheque' | 'virement' | 'carte_bancaire' | string;

export interface LignePaiementDto {
  id?: string;
  uuid?: string;
  tarif_id?: string;
  tarif_intitule?: string;
  type_frais?: string;
  montant: number;
  notes?: string;
  designation?: string;
  quantite?: number;
}

export interface OperationPaiementDto {
  id: string;
  uuid?: string;
  reference: string; // Ex: OP-2026-0001
  libelle: string;
  type_tarif?: string;
  montant_total: number;
  montant?: number; // legacy alias
  montant_paye: number;
  montant_restant: number;
  statut: StatutOperation;
  annee_catechese_id?: string;
  annee_libelle?: string;
  annee_catechese?: AnneeCatecheseDto | AnneeCatechese;
  tarif_id?: string;
  tarif_intitule?: string;
  tarif?: TarifDto;
  inscription_annuelle_id?: string;
  catechumene_id?: string;
  catechumene?: {
    id: string;
    matricule?: string;
    code_catechumene?: string;
    nom: string;
    prenom?: string;
    prenoms?: string;
    nom_complet?: string;
    classe_nom?: string;
    niveau_nom?: string;
    telephone?: string;
    sexe?: 'M' | 'F';
  } | CatechumeneDto;
  lignes_paiements?: LignePaiementDto[];
  echeance?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOperationPaiementDto {
  catechumene_id?: string;
  tarif_id?: string;
  inscription_annuelle_id?: string;
  libelle?: string;
  type_tarif?: string;
  montant_total?: number;
  montant?: number; // alias
  annee_catechese_id?: string;
  echeance?: string;
}

export type CreateOperationDto = CreateOperationPaiementDto;

export interface UpdateOperationDto {
  libelle?: string;
  montant_total?: number;
  montant?: number;
  echeance?: string;
  statut?: StatutOperation;
}

export interface PayerOperationDto {
  mode_paiement?: 'especes' | 'mobile_money' | string;
  reference_paiement?: string;
  notes?: string;
}

// ==========================================
// 3. PAIEMENTS & REÇUS
// ==========================================
export interface PaiementDto {
  id: string;
  uuid?: string;
  numero_recu: string; // Ex: REC-2026-0001
  reference_transaction?: string;
  date_paiement: string;
  montant_total: number;
  mode_paiement: 'especes' | 'mobile_money' | string;
  statut: 'valide' | 'annule' | 'rembourse';
  notes?: string;
  catechumene?: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
    nom_complet: string;
  };
  lignes?: LignePaiementDto[];
  created_at?: string;
}

export interface CreatePaiementDto {
  catechumene_id?: string;
  annee_catechese_id?: string;
  inscription_annuelle_id?: string;
  mode_paiement: 'especes' | 'mobile_money' | string;
  reference_transaction?: string;
  date_paiement?: string;
  notes?: string;
  lignes: {
    tarif_id?: string;
    operation_paiement_id?: string;
    type_frais?: string;
    montant: number;
    notes?: string;
    designation?: string;
    quantite?: number;
  }[];
}

export type StorePaiementDto = CreatePaiementDto;
export type EncaissementLigneDto = LignePaiementDto;
