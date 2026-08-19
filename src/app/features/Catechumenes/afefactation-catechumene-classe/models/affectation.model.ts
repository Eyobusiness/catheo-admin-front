import { InscriptionAnnuelleDto } from '../../inscriptions-annuelles/models/inscription-annuelle.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';
import { NiveauDto } from '../../../Organisations/Niveaux/models/niveau.model';

export interface AffectationItemDto {
  inscription_id: string;
  classe_id: string;
}

export interface BulkAffectationDto {
  classe_id: string;
  inscription_ids: string[];
}

export interface AffectationStats {
  totalInscrits: number;
  totalAffectes: number;
  totalNonAffectes: number;
}
