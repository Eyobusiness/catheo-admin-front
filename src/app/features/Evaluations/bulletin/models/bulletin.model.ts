export interface BulletinDetailRow {
  nom: string;
  type: string;
  coeff: number;
  bareme: number;
  note: number | null;
  noteSur20: number | null;
}

export interface BulletinEvaluationItemDto {
  titre: string;
  type: string;
  coefficient: number;
  bareme: number;
  note_obtenue: number | null;
  note_sur_20: number | null;
  total_pondere: number | null;
  appreciation?: string;
}

export interface BulletinDocData {
  catechumene_id: string;
  nom_prenoms: string;
  matricule: string;
  section: string;
  niveau: string;
  classe: string;
  animateurs?: string;
  annee_pastorale: string;
  trimestre?: string;
  periode?: string;
  rang?: string;
  total_eleves?: number;
  evaluations: BulletinEvaluationItemDto[];
  total_coefficients: number;
  total_points: number;
  moyenne_generale: number | null;
  moyenne_classe?: number | null;
  presence_cours_pct?: number;
  presence_messe?: number;
  presence_ceb?: number;
  presence_mouvement?: number;
  decision?: string;
  appreciation_generale?: string;
}

export interface BulletinBatchDocData {
  bulletins: BulletinDocData[];
}

