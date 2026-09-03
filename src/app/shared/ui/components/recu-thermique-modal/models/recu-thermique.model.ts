export interface RecuPaiementLigne {
  designation?: string;
  tarif_nom?: string;
  quantite?: number;
  montant_unitaire?: number;
  montant?: number;
}

export interface RecuPaiementData {
  id?: string;
  reference: string;
  numero_recu?: string;
  date?: string;
  date_paiement?: string;
  created_at?: string;
  catechumene_nom: string;
  catechumene_matricule?: string;
  matricule?: string;
  classe_nom?: string;
  niveau_nom?: string;
  section_nom?: string;
  annee_pastorale?: string;
  libelle: string;
  type_operation?: string;
  montant?: number;
  montant_total: number;
  montant_recu?: number;
  montant_paye: number;
  montant_restant: number;
  reste_a_payer?: number;
  montant_rendu?: number;
  mode_paiement?: string;
  statut?: string;
  caissier_nom?: string;
  notes?: string;
  lignes?: RecuPaiementLigne[];
}

export type FormatThermique = '58mm' | '80mm';
