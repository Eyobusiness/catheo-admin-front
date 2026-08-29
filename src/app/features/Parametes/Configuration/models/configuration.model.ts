export type ConfigurationTab = 'paroisse' | 'responsables' | 'apparence';

// --- Paroisse Configuration ---
export interface ParoisseConfiguration {
  id: string;
  nom: string;
  nom_paroisse?: string;
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
  logo_paroisse?: string;
  logo_paroisse_url?: string;
  logo_catechese?: string;
  logo_catechese_url?: string;
  cure_nom?: string;
  coordination_nom?: string;
  statut: 'actif' | 'inactif' | 'suspendu';
  created_at?: string;
  updated_at?: string;
}

export interface UpdateParoisseConfigurationDto {
  nom?: string;
  nom_paroisse?: string;
  diocese?: string;
  doyenne?: string;
  ville?: string;
  commune?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  adresse?: string;
  logo_url?: string;
  logo_paroisse?: string | File | null;
  logo_paroisse_url?: string | null;
  remove_logo_paroisse?: boolean;
  logo_catechese?: string | File | null;
  logo_catechese_url?: string | null;
  remove_logo_catechese?: boolean;
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
  entete_document?: string;
  pied_page_document?: string;
  updated_at?: string;
}

export interface UpdateApparenceConfigurationDto {
  id?: string;
  couleur_principale?: string;
  couleur_secondaire?: string;
  police_caracteres?: PoliceCaracteres;
  entete_document?: string;
  pied_page_document?: string;
}

// --- Responsables Catéchèse ---
export interface ResponsableCatechese {
  id: string;
  nom_prenoms: string;
  fonction: string; // Ex: "Curé de la Paroisse", "Vicaire Paroissial", "Coordinateur Catéchèse"
  titre_fonction?: string; // alias de compatibilité
  telephone?: string;
  statut: 'actif' | 'inactif';
  created_at?: string;
}

export type ResponsableParoisse = ResponsableCatechese;

export interface CreateResponsableCatecheseDto {
  nom_prenoms: string;
  fonction: string;
  titre_fonction?: string;
  telephone?: string;
  statut?: 'actif' | 'inactif';
}

export type CreateResponsableParoisseDto = CreateResponsableCatecheseDto;
export type UpdateResponsableCatecheseDto = Partial<CreateResponsableCatecheseDto>;
export type UpdateResponsableParoisseDto = UpdateResponsableCatecheseDto;

