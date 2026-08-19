import { CatechumeneDto } from '../../liste-catechumene/models/catechumene.model';
import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { Section } from '../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../Organisations/Niveaux/models/niveau.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';
import { Ceb } from '../../../Organisations/Ceb/models/ceb.model';
import { Mouvement } from '../../../Organisations/Mouvements/models/mouvement.model';

export type StatutInscriptionAnnuelle = 'inscrit' | 'valide' | 'en_attente' | 'abandon';

export interface InscriptionAnnuelleDto {
  id: string;
  code_inscription?: string;
  date_inscription: string;
  statut_inscription: StatutInscriptionAnnuelle;
  frais_inscription_payes: boolean;
  observation?: string;
  catechumene_id?: string;
  catechumene?: CatechumeneDto;
  annee_catechese_id?: string;
  annee_catechese?: AnneeCatecheseDto;
  section_id?: string;
  section?: Section;
  niveau_id?: string;
  niveau?: NiveauDto;
  classe_id?: string;
  classe?: ClasseDto;
  ceb_id?: string;
  ceb?: Ceb;
  mouvement_id?: string;
  mouvement?: Mouvement;
  created_at?: string;
}

export interface CreateInscriptionAnnuelleDto {
  catechumene_id: string;
  annee_catechese_id: string;
  section_id?: string;
  niveau_id: string;
  classe_id?: string;
  ceb_id?: string;
  mouvement_id?: string;
  date_inscription?: string;
  statut_inscription?: StatutInscriptionAnnuelle;
  frais_inscription_payes?: boolean;
  observation?: string;
}

export interface UpdateInscriptionAnnuelleDto {
  section_id?: string;
  niveau_id?: string;
  classe_id?: string;
  ceb_id?: string;
  mouvement_id?: string;
  statut_inscription?: StatutInscriptionAnnuelle;
  frais_inscription_payes?: boolean;
  observation?: string;
}
