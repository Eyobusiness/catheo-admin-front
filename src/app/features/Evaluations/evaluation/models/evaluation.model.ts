import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { ModuleTrimestrielDto } from '../../../Organisations/Modules-treimestriels/models/module-trimestriel.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';

export type EvaluationType = 'Interrogation' | 'Devoir' | 'Composition' | 'Examen' | 'Oral' | string;
export type EvaluationStatus = 'Actif' | 'Inactif' | 'actif' | 'inactif';

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
  niveau?: string;
  module_trimestriel_id?: string;
  module_trimestriel?: ModuleTrimestrielDto;
  observation?: string;
  description?: string;
  stats?: {
    moyenne_classe?: number;
    plus_forte_note?: number;
    plus_faible_note?: number;
    saisies_effectuees?: number;
    total_eleves?: number;
    saisies_ratio?: string;
  };
  notes?: any[];
  created_at?: string;
  updated_at?: string;
}

export type EvaluationItem = EvaluationDto;

export interface CreateEvaluationDto {
  nom: string;
  titre?: string;
  type: EvaluationType;
  periode?: string | ModuleTrimestrielDto;
  module_trimestriel_id?: string;
  date: string;
  date_evaluation?: string;
  coefficient: number;
  bareme: number;
  anneePastorale: string;
  annee_catechese_id?: string;
  statut: EvaluationStatus;
  observation?: string;
  section?: string;
  niveau?: string;
  classe?: string;
  classe_id?: string;
}

export interface UpdateEvaluationDto {
  nom?: string;
  titre?: string;
  type?: EvaluationType;
  periode?: string | ModuleTrimestrielDto;
  module_trimestriel_id?: string;
  date?: string;
  date_evaluation?: string;
  coefficient?: number;
  bareme?: number;
  anneePastorale?: string;
  annee_catechese_id?: string;
  statut?: EvaluationStatus;
  observation?: string;
  section?: string;
  niveau?: string;
  classe?: string;
  classe_id?: string;
}

export interface UpdateEvaluationStatutDto {
  statut?: EvaluationStatus | 'actif' | 'inactif';
  status?: EvaluationStatus | 'actif' | 'inactif';
}

export interface CatechumeneNoteDto {
  catechumene_id?: string;
  catechumeneId?: string;
  matricule?: string;
  nom_prenoms?: string;
  nomPrenoms?: string;
  note_obtenue?: number | null;
  note?: number | null;
  appreciation?: string;
}

export interface BatchSaveNotesDto {
  notes: CatechumeneNoteDto[];
}
