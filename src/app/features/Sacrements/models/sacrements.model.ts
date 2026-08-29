export type SectionCatechese = string;
export type TypeSacrement = 'Baptême' | 'Première Communion' | 'Confirmation';
export type MotifException =
  | 'Décision du Curé'
  | 'Préparation au mariage'
  | 'Cas pastoral'
  | 'Rattrapage'
  | 'Autre';

export interface SacrementRecord {
  id: string;
  type: TypeSacrement;
  date: string; // YYYY-MM-DD
  lieu: string;
  celebrant: string; // Prêtre ou Évêque
  parrain?: string;
  marraine?: string;
  numRegistre?: string;
  observations?: string;
  dateEnregistrement: string;
}

export interface ExceptionSacrement {
  id: string;
  catechumeneId: string;
  catechumeneNomComplet?: string;
  section?: string;
  section_id?: string;
  classe?: string;
  classe_id?: string;
  niveau?: string;
  niveau_id?: string;
  sacrementType: TypeSacrement;
  motif: MotifException;
  autorisePar: string;
  observation?: string;
  dateAjout: string;
}

export interface CatechumeneSacrement {
  id: string;
  avatar?: string;
  matricule: string;
  nom: string;
  prenoms: string;
  section: string;
  section_id?: string;
  classe: string;
  classe_id?: string;
  niveau: string;
  niveau_id?: string;
  telephone: string;
  statut?: string;

  // État des sacrements
  isBaptise: boolean;
  isPremiereCommunion: boolean;
  isConfirme: boolean;

  // Historique des sacrements reçus
  baptemeRecord?: SacrementRecord;
  premiereCommunionRecord?: SacrementRecord;
  confirmationRecord?: SacrementRecord;

  // Exceptions
  exceptions?: ExceptionSacrement[];
}
