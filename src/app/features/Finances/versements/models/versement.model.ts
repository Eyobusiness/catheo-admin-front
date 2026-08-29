export type ModeRemise = 'especes' | 'cheque' | 'virement' | string;
export type StatutVersement = 'valide' | 'en_attente' | 'annule';

export interface VersementDto {
  id: string;
  uuid?: string;
  reference: string; // Ex: VRS-2026-0001
  periode_concernee: string;
  montant_verse: number;
  mode_remise: ModeRemise;
  effectue_par?: string;
  destinataire?: string; // Ex: "Curé de la Paroisse", "Économe Paroissial"
  notes?: string;
  statut?: StatutVersement;
  annee_catechese_id?: string;
  annee_libelle?: string;
  user?: {
    id: number | string;
    name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
}

export type VersementCureDto = VersementDto;

export interface VersementKpiDto {
  total_en_caisse: number;
  total_deja_verse: number;
  reste_a_reverser: number;
}

export type VersementKpisDto = VersementKpiDto;

export interface CreateVersementDto {
  annee_catechese_id?: string;
  periode_concernee: string;
  montant_verse: number;
  mode_remise: ModeRemise;
  effectue_par?: string;
  destinataire?: string;
  notes?: string;
}

export interface UpdateVersementDto extends Partial<CreateVersementDto> {
  statut?: StatutVersement;
}
