export type ConfigurationTab = 'paroisse' | 'responsables' | 'apparence';

// --- Paroisse Configuration ---
export interface ParoisseConfiguration {
  id: string;
  nom: string;
  code_paroisse: string;
  diocese?: string;
  doyenne?: string;
  ville?: string;
  commune?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  adresse?: string;
  logo_url?: string;
  cure_nom?: string;
  coordination_nom?: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  created_at?: string;
  updated_at?: string;
}

export interface UpdateParoisseConfigurationDto {
  nom?: string;
  diocese?: string;
  doyenne?: string;
  ville?: string;
  commune?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  adresse?: string;
  cure_nom?: string;
  coordination_nom?: string;
}

// --- Apparence Configuration ---
export type PoliceCaracteres = 'Inter' | 'Roboto' | 'Outfit' | 'Poppins' | 'Nunito' | 'DM Sans';

export interface ApparenceConfiguration {
  id: string;
  couleur_principale: string; // Ex: "#4F46E5"
  couleur_secondaire: string; // Ex: "#D97706"
  police_caracteres: PoliceCaracteres;
  logo_url?: string;
  entete_document?: string;
  pied_page_document?: string;
  updated_at?: string;
}

export interface UpdateApparenceConfigurationDto {
  couleur_principale?: string;
  couleur_secondaire?: string;
  police_caracteres?: PoliceCaracteres;
  logo_url?: string;
  entete_document?: string;
  pied_page_document?: string;
}

// --- Responsables Paroisse ---
export interface ResponsableParoisse {
  id: string;
  nom_prenoms: string;
  titre_fonction: string; // Ex: "Curé", "Vicaire", "Coordinateur Catéchèse", "Secrétaire"
  telephone?: string;
  statut: 'actif' | 'inactif';
  created_at?: string;
}

export interface CreateResponsableParoisseDto {
  nom_prenoms: string;
  titre_fonction: string;
  telephone?: string;
  statut?: 'actif' | 'inactif';
}

export interface UpdateResponsableParoisseDto extends Partial<CreateResponsableParoisseDto> {}

