export type DecisionStatus = 'Admis' | 'Non admis' | 'Ajourné';

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
  presenceMesse: number;
  presenceCEB: number;
  presenceMouvement: number;
  decision: DecisionStatus;
}
