export type TypeSauvegarde = 'manuel' | 'automatique';
export type StatutSauvegarde = 'termine' | 'en_cours' | 'echec';

export interface SauvegardeDto {
  id: string;
  nom_fichier: string;
  date: string; // Ex: "10/08/2026"
  heure: string; // Ex: "00:46"
  taille: string; // Ex: "13.1 MB"
  taille_octets: number;
  cree_par: string; // Ex: "Abbé Ferdinand" ou "Système (Auto)"
  type: TypeSauvegarde;
  statut: StatutSauvegarde;
  created_at?: string;
}

export type Sauvegarde = SauvegardeDto;

export interface CreateSauvegardeRequest {
  nom_personnalise?: string;
  type?: TypeSauvegarde;
}
