import { AnneeCatecheseDto } from '../../AnneesPastorales/models/annee-catechese.model';

export type StatutCalendrier = 'Planifié' | 'Réalisé' | 'Annulé' | 'planifie' | 'realise' | 'annule';
export type CibleTypeCalendrier =
  | 'Tous'
  | 'Catéchumènes'
  | 'Animateurs'
  | 'Niveau'
  | 'Classe'
  | 'Section'
  | string;

export interface CalendrierDto {
  id: string;
  titre: string;
  type: string; // Champ texte libre (ex: "Récollection", "Messe des jeunes", "Pèlerinage", "Kermesse", etc.)
  date: string;
  heure_debut?: string;
  heure_fin?: string;
  lieu?: string;
  cible_type: CibleTypeCalendrier;
  cible_id?: string;
  cible_ids?: string[];
  cible_nom?: string;
  description?: string;
  statut: 'Planifié' | 'Réalisé' | 'Annulé';
  annee_catechese?: AnneeCatecheseDto;
  annee_catechese_id?: string;
  created_at?: string;
}

export type Calendrier = CalendrierDto;

export interface CreateCalendrierDto {
  annee_catechese_id?: string;
  titre: string;
  type: string; // Champ texte libre saisi par l'utilisateur
  date: string;
  heure_debut?: string;
  heure_fin?: string;
  lieu?: string;
  cible_type?: CibleTypeCalendrier;
  cible_id?: string;
  cible_ids?: string[];
  cible_nom?: string;
  description?: string;
  statut?: StatutCalendrier;
}

export interface UpdateCalendrierDto {
  annee_catechese_id?: string;
  titre?: string;
  type?: string;
  date?: string;
  heure_debut?: string;
  heure_fin?: string;
  lieu?: string;
  cible_type?: CibleTypeCalendrier;
  cible_id?: string;
  cible_ids?: string[];
  cible_nom?: string;
  description?: string;
  statut?: StatutCalendrier;
}
