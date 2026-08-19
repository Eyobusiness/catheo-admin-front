import { CatechumeneDto } from '../../liste-catechumene/models/catechumene.model';
import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';

export type StatutMutation = 'demande' | 'approuve' | 'refuse';

export interface MutationCatechumeneDto {
  id: string;
  catechumene_id?: string;
  annee_catechese_id?: string;
  paroisse_origine_nom: string;
  paroisse_destination_nom: string;
  motif?: string;
  date_mutation: string;
  statut: StatutMutation;
  catechumene?: CatechumeneDto;
  annee_catechese?: AnneeCatecheseDto;
  created_at?: string;
}

export interface CreateMutationCatechumeneDto {
  catechumene_id: string;
  annee_catechese_id: string;
  paroisse_origine_nom: string;
  paroisse_destination_nom: string;
  motif?: string;
  date_mutation: string;
}

export interface UpdateMutationCatechumeneDto {
  statut: 'approuve' | 'refuse';
}
