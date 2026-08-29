import { ClasseDto } from '../../Organisations/Classe/models/classe.model';
import { AnimateurDto } from '../../Organisations/Animateurs/models/animateur.model';
import { CatechumeneDto } from '../../Catechumenes/liste-catechumene/models/catechumene.model';
import { AnneeCatechese, AnneeCatecheseDto } from '../../Organisations/AnneesPastorales/models/annee-catechese.model';

export type StatutSeance = 'planifiee' | 'effectuee' | 'annulee';
export type StatutPresence = 'present' | 'absent' | 'retard' | 'excuse';

export interface PresenceItemDto {
  id?: string;
  catechumene_id: string;
  catechumene?: Partial<CatechumeneDto>;
  statut_presence?: StatutPresence;
  est_present?: boolean;
  remarque?: string;
  motif_absence?: string;
}

export interface SeanceDto {
  id: string;
  titre: string;
  titre_lecon?: string;
  date_seance: string;
  heure_debut?: string;
  heure_fin?: string;
  duree_minutes?: number;
  description?: string;
  statut?: StatutSeance;
  annee_catechese_id?: string;
  annee_catechese?: AnneeCatecheseDto | AnneeCatechese;
  classe_id?: string;
  classe?: ClasseDto;
  animateur_id?: string;
  animateur?: AnimateurDto;
  total_presences?: number;
  total_presents?: number;
  total_absents?: number;
  presences?: PresenceItemDto[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateSeanceDto {
  annee_catechese_id: string;
  classe_id: string;
  titre: string;
  description?: string;
  date_seance: string;
  heure_debut: string;
  heure_fin: string;
  statut?: StatutSeance;
}

export interface UpdateSeanceDto {
  annee_catechese_id?: string;
  classe_id?: string;
  titre?: string;
  description?: string;
  date_seance?: string;
  heure_debut?: string;
  heure_fin?: string;
  statut?: StatutSeance;
}

export interface PresenceBatchItemDto {
  catechumene_id: string;
  statut_presence: StatutPresence;
  remarque?: string;
}

export interface RecordPresencesBatchDto {
  presences: PresenceBatchItemDto[];
}
