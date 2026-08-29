// =====================================================================
// SECTION — MODULE IMPRESSIONS OFFICIELLES (/api/v1/impressions/*)
// Modèles et DTOs synchronisés avec le Backend
// =====================================================================

export interface ImpressionEnteteDto {
  nom_paroisse: string;
  nom?: string;
  diocese: string;
  doyenne?: string;
  ville?: string;
  commune?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  cure_nom?: string;
  logo_url?: string;
  logo_paroisse_url?: string;
  logo_catechese_url?: string;
  annee_pastorale?: string;
}

export type SacramentType = 'bapteme' | 'communion' | 'confirmation';

export interface ImpressionFilterDto {
  annee_catechese_id?: string;
  annee_pastorale?: string;
  section_id?: string;
  section?: string;
  niveau_id?: string;
  niveau?: string;
  classe_id?: string;
  classe?: string;
  catechumene_id?: string;
  sacrament?: 'bapteme' | 'communion' | 'confirmation' | string;
  orientation?: 'portrait' | 'landscape';
}

// --------------------------------------------------
// 1. FICHE DE NOTES (/api/v1/impressions/fiche-notes)
// --------------------------------------------------
export interface EvaluationNoteColumnDto {
  id: string;
  titre: string;
  type: string;
  note_maximale?: number;
  coefficient?: number;
}

export interface FicheNotesStudentDto {
  id: string;
  matricule: string;
  code_catechumene?: string;
  nom_complet: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  evaluations: Record<string, number | null>;
  moyenne?: number | null;
  rang?: number | string | null;
  observation?: string;
}

export interface FicheNotesResponseDto {
  entete: ImpressionEnteteDto;
  classe_nom: string;
  niveau_nom: string;
  section_nom: string;
  annee_libelle: string;
  evaluations_colonnes: EvaluationNoteColumnDto[];
  catechumenes: FicheNotesStudentDto[];
  statistiques?: {
    total: number;
    garcons: number;
    filles: number;
    moyenne_generale?: number;
  };
}

// --------------------------------------------------
// 2. LISTE / FICHE DE PRÉSENCE (/api/v1/impressions/liste-presence & /fiche-presences)
// --------------------------------------------------
export interface SeanceDateColDto {
  id: string;
  date: string;
  numero: number;
  label?: string; // ex: "04/10"
}

export interface ListePresenceStudentDto {
  id: string;
  matricule: string;
  nom_complet: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  telephone?: string;
  presences: Record<string, 'P' | 'A' | 'E' | 'J' | null>; // P: présent, A: absent, E: excusé
  total_presents?: number;
  total_absents?: number;
  taux_presence?: number;
}

export interface ListePresenceResponseDto {
  entete: ImpressionEnteteDto;
  classe_nom: string;
  niveau_nom: string;
  section_nom: string;
  annee_libelle: string;
  jour_rencontre?: string;
  horaire?: string;
  animateurs?: string[];
  seances_dates: SeanceDateColDto[];
  catechumenes: ListePresenceStudentDto[];
  statistiques?: {
    total: number;
    garcons: number;
    filles: number;
    taux_global?: number;
  };
}

// --------------------------------------------------
// 3. REGISTRE CATECHUMENES (/api/v1/impressions/liste-catechumenes)
// --------------------------------------------------
export interface RegistreCatechumeneItemDto {
  id: string;
  matricule: string;
  nom_complet: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  lieu_naissance?: string;
  telephone?: string;
  domicile?: string;
  nom_pere?: string;
  telephone_pere?: string;
  nom_mere?: string;
  telephone_mere?: string;
  nom_tuteur?: string;
  telephone_tuteur?: string;
  ceb_nom?: string;
  est_baptise: boolean;
  num_carnet_bapteme?: string;
  frais_payes: boolean;
  statut_inscription?: string;
}

export interface ListeCatechumenesResponseDto {
  entete: ImpressionEnteteDto;
  classe_nom: string;
  niveau_nom: string;
  section_nom: string;
  annee_libelle: string;
  catechumenes: RegistreCatechumeneItemDto[];
  statistiques: {
    total: number;
    garcons: number;
    filles: number;
    baptises: number;
    non_baptises: number;
    frais_a_jour: number;
    frais_en_retard: number;
  };
}

// --------------------------------------------------
// 4. SUIVI SACRAMENTAL (/api/v1/impressions/suivi-sacramental)
// --------------------------------------------------
export interface SuiviSacramentalStudentDto {
  id: string;
  matricule: string;
  nom_complet: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  lieu_naissance?: string;
  parrain_marraine_nom?: string;
  parrain_marraine_contact?: string;
  dossier_complet: boolean;
  extrait_naissance_fourni: boolean;
  certificat_bapteme_fourni?: boolean;
  casuel_paye: boolean;
  retraite_effectuee: boolean;
  statut_admissibilite: 'admis' | 'en_attente' | 'refuse' | string;
  observation?: string;
}

export interface SuiviSacramentalResponseDto {
  entete: ImpressionEnteteDto;
  sacrement: 'bapteme' | 'communion' | 'confirmation' | string;
  classe_nom?: string;
  niveau_nom?: string;
  section_nom?: string;
  annee_libelle: string;
  candidats: SuiviSacramentalStudentDto[];
  statistiques: {
    total_candidats: number;
    dossiers_complets: number;
    dossiers_incomplets: number;
    casuels_regles: number;
    retraites_validees: number;
  };
}

// --------------------------------------------------
// 5. BILAN ANNUEL (/api/v1/impressions/fiche-bilan-annuel)
// --------------------------------------------------
export interface BilanAnnuelStudentDto {
  id: string;
  matricule: string;
  nom_complet: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  note_cours?: number | null;
  note_messe?: number | null;
  moyenne_annuelle?: number | null;
  rang?: number | string | null;
  decision_finale: 'admis' | 'ajourne' | 'redoublant' | 'admis_avec_reserve' | string;
  observation?: string;
}

export interface FicheBilanAnnuelResponseDto {
  entete: ImpressionEnteteDto;
  classe_nom: string;
  niveau_nom: string;
  section_nom: string;
  annee_libelle: string;
  deliberations: BilanAnnuelStudentDto[];
  statistiques: {
    effectif_total: number;
    admis: number;
    ajournes: number;
    taux_reussite?: number;
  };
}

// --------------------------------------------------
// 6. FICHES DE RENSEIGNEMENT INDIVIDUELLES/GROUPÉES
// --------------------------------------------------
export interface FicheRenseignementBaptemeDto {
  id: string;
  matricule: string;
  nom_complet: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  lieu_naissance?: string;
  domicile?: string;
  profession?: string;
  nom_pere?: string;
  origine_pere?: string;
  telephone_pere?: string;
  nom_mere?: string;
  origine_mere?: string;
  telephone_mere?: string;
  nom_tuteur?: string;
  telephone_tuteur?: string;
  classe_nom?: string;
  niveau_nom?: string;
  section_nom?: string;
  annee_libelle?: string;
  parrain?: {
    nom: string;
    domicile?: string;
    telephone?: string;
    paroisse_bapteme?: string;
    representant_par?: string;
    representant_contact?: string;
  };
  marraine?: {
    nom: string;
    domicile?: string;
    telephone?: string;
    paroisse_bapteme?: string;
    representant_par?: string;
    representant_contact?: string;
  };
  pieces_jointes?: {
    extrait_naissance: boolean;
    photo_identite: boolean;
    casuel: boolean;
  };
}

export interface FicheRenseignementPremiereCommunionDto {
  id: string;
  matricule: string;
  nom_complet: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  lieu_naissance?: string;
  domicile?: string;
  classe_nom?: string;
  niveau_nom?: string;
  section_nom?: string;
  annee_libelle?: string;
  parent?: {
    nom: string;
    telephone: string;
  };
  bapteme: {
    date?: string;
    lieu?: string;
    paroisse?: string;
    num_carnet?: string;
    diocese?: string;
  };
}

export interface FicheRenseignementConfirmationDto {
  id: string;
  matricule: string;
  nom_complet: string;
  nom: string;
  prenoms: string;
  sexe: 'M' | 'F';
  date_naissance?: string;
  lieu_naissance?: string;
  domicile?: string;
  classe_nom?: string;
  niveau_nom?: string;
  section_nom?: string;
  annee_libelle?: string;
  parent?: {
    nom: string;
    telephone: string;
  };
  bapteme: {
    date?: string;
    lieu?: string;
    paroisse?: string;
    num_carnet?: string;
  };
  premiere_communion?: {
    date?: string;
    paroisse?: string;
  };
  parrain_confirmation?: {
    nom: string;
    telephone?: string;
    paroisse?: string;
  };
}

// Compatibilité legacy
export interface ParrainMarraineDetail {
  nom?: string;
  domicile?: string;
  telephone?: string;
  representantPar?: string;
  representantContact?: string;
}

export interface PrintStudent {
  id: string;
  num: string;
  matricule: string;
  nomPrenoms: string;
  nom?: string;
  prenoms?: string;
  telephone: string;
  classeScolaire?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  profession?: string;
  domicile?: string;
  nomPere?: string;
  originePere?: string;
  nomMere?: string;
  origineMere?: string;
  classe?: string;
  section?: string;
  niveau?: string;
  parentTuteur?: {
    nom?: string;
    telephone?: string;
  };
  parrainDetail?: ParrainMarraineDetail;
  marraineDetail?: ParrainMarraineDetail;
  parrainMarraine?: {
    nom?: string;
    telephone?: string;
    sexe?: 'M' | 'F';
  };
}
