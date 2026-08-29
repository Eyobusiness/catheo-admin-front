export type SacrementCode = 'BAPTEME' | 'PREMIERE_COMMUNION' | 'CONFIRMATION';
export type SacrementStatut = 'non_recu' | 'preparation' | 'valide';

/**
 * Type de Sacrement (Baptême, Première Communion, Confirmation)
 */
export interface SacrementDto {
  id: string;
  uuid: string;
  code: SacrementCode;
  nom: string;
  libelle: string;
  description?: string;
  ordre: number;
  statut: string;
}

/**
 * Détail d'un sacrement dans le parcours d'un catéchumène
 */
export interface ParcoursSacrementItemDto {
  id?: string;
  sacrement_id: string;
  sacrement_code: SacrementCode;
  sacrement_nom: string;
  ordre: number;
  statut: SacrementStatut;
  date_sacrement?: string | null;
  lieu?: string | null;
  paroisse_nom?: string | null;
  celebrant?: string | null;
  numero_registre?: string | null;
  num_carnet?: string | null;
  observations?: string | null;
  annee_pastorale?: string | null;
  validated_at?: string | null;
  validated_by?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Ligne du tableau des catéchumènes avec filtres dynamiques
 */
export interface CatechumeneSacrementListRowDto {
  id: string;
  uuid: string;
  matricule: string;
  code_catechumene: string;
  nom: string;
  prenom: string;
  prenoms: string;
  nom_complet: string;
  sexe: 'M' | 'F' | string;
  date_naissance?: string;
  telephone?: string;
  statut: string;
  section_id?: string;
  section_nom?: string;
  niveau_id?: string;
  niveau_nom?: string;
  classe_id?: string;
  classe_nom?: string;
  annee_pastorale?: string;
  sacrements_status: {
    bapteme: SacrementStatut;
    premiere_communion: SacrementStatut;
    confirmation: SacrementStatut;
  };
  est_baptise: boolean;
  date_bapteme?: string;
  date_premiere_communion?: string;
  date_confirmation?: string;
  created_at?: string;
}

/**
 * Payload pour ajouter un sacrement en préparation ou validé
 */
export interface StoreCatechumenSacrementDto {
  sacrement_id: string; // UUID du sacrement ou code (BAPTEME, PREMIERE_COMMUNION, CONFIRMATION)
  annee_catechese_id?: string;
  statut?: 'preparation' | 'valide';
  date_sacrement?: string | null;
  lieu?: string | null;
  paroisse_nom?: string | null;
  celebrant?: string | null;
  numero_registre?: string | null;
  num_carnet?: string | null;
  observations?: string | null;
}

/**
 * Payload pour modifier ou valider un sacrement
 */
export interface UpdateCatechumenSacrementDto {
  statut?: 'preparation' | 'valide';
  date_sacrement?: string | null;
  lieu?: string | null;
  paroisse_nom?: string | null;
  celebrant?: string | null;
  numero_registre?: string | null;
  num_carnet?: string | null;
  observations?: string | null;
}

/**
 * Paramètres de filtrage dynamiques pour le tableau
 */
export interface SacrementFilterParams {
  section_id?: string;
  niveau_id?: string;
  classe_id?: string;
  sacrement_id?: string;
  statut?: 'preparation' | 'valide';
  annee_catechese_id?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

/**
 * Structure de réponse paginée de l'API
 */
export interface PaginatedResponse<T> {
  status: 'success' | 'error';
  meta: {
    current_page: number;
    per_page: number;
    total_elements: number;
    total_pages: number;
    has_next: boolean;
  };
  data: T[];
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
  catechumene?: any;
}
