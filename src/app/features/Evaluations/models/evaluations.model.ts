export type EvaluationType = 'Interrogation' | 'Devoir' | 'Composition' | 'Examen' | 'Oral';
export type EvaluationPeriode = 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3' | 'Annuelle';
export type EvaluationStatus = 'Actif' | 'Inactif';
export type DecisionStatus = 'Admis' | 'Non admis' | 'Ajourné';

export interface EvaluationItem {
  id: string;
  nom: string;
  type: EvaluationType;
  periode: EvaluationPeriode;
  date: string;
  coefficient: number;
  bareme: number;
  statut: EvaluationStatus;
  anneePastorale: string;
  observation?: string;
  section?: string;
  niveau?: string;
  classe?: string;
}

export interface CatechumeneNote {
  catechumeneId: string;
  evaluationId: string;
  matricule: string;
  nomPrenoms: string;
  note: number | null;
}

export interface BilanAnnuelItem {
  catechumeneId: string;
  matricule: string;
  nomPrenoms: string;
  section: string;
  niveau: string;
  classe: string;
  anneePastorale: string;
  moyenneGenerale: number;
  presenceCoursPct: number;
  presenceMesse: string;
  presenceCEB: string;
  presenceMouvement: string;
  decision: DecisionStatus;
}

export interface RecapNoteRow {
  index: number;
  catechumeneId: string;
  nomPrenoms: string;
  genre: string;
  n1: number | null;
  n2: number | null;
  total: number | null;
  coeff: number;
  moyenne: number | null;
  rang: string;
}

export interface BulletinDetailRow {
  nom: string;
  type: string;
  coeff: number;
  bareme: number;
  note: number | null;
  noteSur20: number | null;
}
