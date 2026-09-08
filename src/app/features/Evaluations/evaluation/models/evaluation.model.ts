import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { ModuleTrimestrielDto } from '../../../Organisations/Modules-treimestriels/models/module-trimestriel.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';

export type EvaluationType = 'Interrogation' | 'Devoir' | 'Composition' | 'Examen' | 'Oral' | string;
export type EvaluationStatus = 'Actif' | 'Inactif' | 'actif' | 'inactif';

export interface EvaluationStats {
  moyenne_classe?: number;
  plus_forte_note?: number;
  plus_faible_note?: number;
  saisies_effectuees?: number;
  total_eleves?: number;
  saisies_ratio?: string;
}

export interface EvaluationDto {
  id: string;
  nom: string;
  titre?: string;
  type: EvaluationType;
  type_eval?: EvaluationType;
  type_eval_code?: string;
  periode?: string | ModuleTrimestrielDto;
  date: string;
  date_evaluation?: string;
  coefficient: number;
  coefficient_label?: string;
  bareme: number;
  note_max?: number;
  bareme_label?: string;
  statut: EvaluationStatus;
  statut_code?: 'actif' | 'inactif';
  anneePastorale?: string;
  annee_catechese_id?: string;
  annee_catechese?: AnneeCatecheseDto;
  classe_id?: string;
  classe?: ClasseDto | any;
  section?: string;
  session?: string;
  section_id?: string;
  niveau?: string;
  niveau_id?: string;
  module_trimestriel_id?: string;
  module_trimestriel?: ModuleTrimestrielDto;
  observation?: string;
  description?: string;
  stats?: EvaluationStats;
  notes?: any[];
  created_at?: string;
  updated_at?: string;
}

export type EvaluationItem = EvaluationDto;

export interface EvaluationFilters {
  section_id?: string;
  session_id?: string;
  niveau_id?: string;
  classe_id?: string;
  annee_catechese_id?: string;
  anneePastorale?: string;
  periode?: string;
  type?: string;
  statut?: string;
  search?: string;
}

export interface CreateEvaluationDto {
  nom?: string;
  titre: string;
  type?: EvaluationType;
  type_eval?: string;
  module_trimestriel_id?: string;
  periode?: string;
  date?: string;
  date_evaluation: string;
  coefficient: number;
  bareme?: number;
  note_max: number;
  anneePastorale?: string;
  annee_catechese_id?: string;
  classe_id?: string;
  classe?: string;
  statut?: EvaluationStatus;
  description?: string;
  observation?: string;
}

export interface UpdateEvaluationDto {
  nom?: string;
  titre?: string;
  type?: EvaluationType;
  type_eval?: string;
  module_trimestriel_id?: string;
  periode?: string;
  date?: string;
  date_evaluation?: string;
  coefficient?: number;
  bareme?: number;
  note_max?: number;
  anneePastorale?: string;
  annee_catechese_id?: string;
  classe_id?: string;
  classe?: string;
  statut?: EvaluationStatus;
  description?: string;
  observation?: string;
}

export interface UpdateEvaluationStatutDto {
  statut?: EvaluationStatus | 'actif' | 'inactif';
  status?: EvaluationStatus | 'actif' | 'inactif';
}

/**
 * Item de la grille de saisie des notes (GET /api/v1/evaluations/{uuid}/notes-grid)
 */
export interface NotesGridItemDto {
  catechumene_id: string;
  catechumeneId?: string;
  matricule?: string;
  code_catechumene?: string;
  nom?: string;
  prenoms?: string;
  nom_prenoms: string;
  nomPrenoms?: string;
  note_obtenue: number | null;
  note?: number | null;
  appreciation?: string | null;
  note_id?: string | null;
}

export interface NotesGridResponse {
  status: string;
  evaluation?: EvaluationDto;
  data: NotesGridItemDto[];
}

/**
 * DTO d'enregistrement par lot des notes (POST /api/v1/evaluations/{uuid}/notes)
 */
export interface SaveNoteItemDto {
  catechumene_id: string;
  note_obtenue?: number | null;
  note?: number | null;
  appreciation?: string | null;
}

export interface SaveNotesBatchDto {
  notes: SaveNoteItemDto[];
}

export type CatechumeneNoteDto = NotesGridItemDto;
export type BatchSaveNotesDto = SaveNotesBatchDto;

/**
 * Réponses pour moyennes de classe (GET /api/v1/evaluations/classes/{classe_uuid}/moyennes)
 */
export interface DetailNoteItemDto {
  evaluation_id: string;
  titre: string;
  coefficient: number;
  note_obtenue: number | null;
  note_max: number;
  note_sur_20: number | null;
  appreciation: string;
}

export interface EleveMoyenneItemDto {
  catechumene_id: string;
  matricule: string;
  nom_prenoms: string;
  nombre_evaluations: number;
  nombre_notes: number;
  moyenne: number | null;
  rang?: number | string;
  appreciation: string;
  details_notes: DetailNoteItemDto[];
}

export interface ClasseStatistiquesDto {
  total_evaluations: number;
  total_eleves: number;
  eleves_evalues: number;
  eleves_non_evalues: number;
  moyenne_classe: number | null;
  meilleure_moyenne: number | null;
  plus_faible_moyenne: number | null;
}

export interface ClasseMoyennesResponse {
  classe: {
    id: string;
    nom: string;
    niveau?: string;
    section?: string;
    session?: string;
    annee?: string;
  };
  statistiques: ClasseStatistiquesDto;
  evaluations: Array<{
    id: string;
    titre: string;
    type_eval: string;
    coefficient: number;
    note_max: number;
    date: string;
  }>;
  eleves: EleveMoyenneItemDto[];
}

/**
 * Synthèse individuelle d'un catéchumène (GET /api/v1/evaluations/catechumenes/{uuid}/synthese)
 */
export interface CatechumeneSyntheseResponse {
  catechumene: {
    id: string;
    matricule: string;
    nom_complet: string;
  };
  classe: {
    id: string;
    nom: string;
    niveau?: string;
    section?: string;
    session?: string;
    annee?: string;
  } | null;
  moyenne: number | null;
  appreciation: string;
  notes: DetailNoteItemDto[];
}
