export interface AnneeCatechese {
  id: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  est_active: boolean;
  total_inscrits?: number;
}

export type AnneeCatecheseDto = AnneeCatechese;

export interface CreateAnneeCatecheseDto {
  libelle: string;
  date_debut: string;
  date_fin: string;
  est_active: boolean;
}

export interface UpdateAnneeCatecheseDto {
  libelle: string;
  date_debut: string;
  date_fin: string;
  est_active: boolean;
}

export interface ApiErrorResponse {
  status?: string;
  message?: string;
  errors?: Record<string, string[]>;
}
