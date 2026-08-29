export interface CatechumeneNote {
  catechumeneId: string;
  catechumene_id?: string;
  evaluationId: string;
  evaluation_id?: string;
  matricule: string;
  nomPrenoms: string;
  genre?: string;
  note: number | null;
  note_obtenue?: number | null;
  appreciation?: string;
}

export type CatechumeneNoteDto = CatechumeneNote;

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
  appreciation?: string;
}
