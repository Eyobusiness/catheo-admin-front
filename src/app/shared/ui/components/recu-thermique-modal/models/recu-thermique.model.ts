export interface RecuPaiementData {
  reference: string;
  date?: string;
  catechumene_nom: string;
  catechumene_matricule?: string;
  classe_nom?: string;
  niveau_nom?: string;
  section_nom?: string;
  annee_pastorale?: string;
  libelle: string;
  type_operation?: string;
  montant_total: number;
  montant_recu?: number;
  montant_paye: number;
  montant_restant: number;
  montant_rendu?: number;
  mode_paiement?: string;
  statut?: string;
  caissier_nom?: string;
  notes?: string;
}

export type FormatThermique = '58mm' | '80mm';
