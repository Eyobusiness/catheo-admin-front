// =====================================================================
// SECTION — DOCUMENTS OFFICIELS (MODÈLES & GÉNÉRATION)
// Synchronisé avec l'API Backend (/api/v1/modeles-documents & /api/v1/documents-generes)
// =====================================================================

export type TypeDocumentOfficiel =
  | 'certificat'
  | 'attestation'
  | 'convocation'
  | 'carte'
  | 'fiche'
  | 'autre'
  | string;

export type StatutModeleDocument = 'actif' | 'inactif';

export interface ModeleDocumentVariableDto {
  cle?: string;
  tag: string;
  description: string;
  label?: string;
  categorie?: 'Paroisse' | 'Catéchumène' | 'Sacrements' | 'Évaluation' | 'Année' | string;
}

export interface ModeleDocumentDto {
  id: string;
  uuid?: string;
  titre: string;
  code?: string;
  type_document: TypeDocumentOfficiel;
  description?: string;
  contenu: string;
  variables_disponibles?: ModeleDocumentVariableDto[];
  en_tete_active?: boolean;
  pied_page_active?: boolean;
  signature_nom?: string;
  signature_titre?: string;
  statut: StatutModeleDocument;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateModeleDocumentDto {
  titre: string;
  code?: string;
  type_document: TypeDocumentOfficiel;
  description?: string;
  contenu: string;
  variables_disponibles?: ModeleDocumentVariableDto[];
  en_tete_active?: boolean;
  pied_page_active?: boolean;
  signature_nom?: string;
  signature_titre?: string;
  statut?: StatutModeleDocument;
}

export interface UpdateModeleDocumentDto extends Partial<CreateModeleDocumentDto> {}

export interface DocumentGenereDto {
  id: string;
  uuid?: string;
  reference_document?: string;
  reference?: string;
  titre: string;
  type_document: TypeDocumentOfficiel;
  contenu: string;
  metadonnees?: Record<string, any>;
  variables_fusionnees?: Record<string, any>;
  fichier_pdf_path?: string;
  fichier_pdf_url?: string;
  genere_par_user_id?: string;
  genere_par_nom?: string;
  date_generation: string;
  statut?: 'valide' | 'annule' | string;
  modele_document_id?: string;
  modele_titre?: string;
  catechumene_id?: string;
  catechumene?: {
    id: string;
    matricule?: string;
    code_catechumene?: string;
    nom: string;
    prenom?: string;
    prenoms?: string;
    nom_complet?: string;
    telephone?: string;
    date_naissance?: string;
    lieu_naissance?: string;
    classe?: string;
    niveau?: string;
    section?: string;
  };
  annee_catechese_id?: string;
  annee_libelle?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface GenererDocumentDto {
  modele_document_id: string;
  catechumene_id: string;
  annee_catechese_id?: string;
  variables_personnalisees?: Record<string, any>;
  metadonnees?: Record<string, any>;
}

export interface GenererDocumentsMasseDto {
  modele_document_id: string;
  catechumene_ids: string[];
  annee_catechese_id?: string;
  variables_personnalisees?: Record<string, any>;
}

export const VARIABLES_SYSTEME_DEFAUT: ModeleDocumentVariableDto[] = [
  // Paroisse
  { tag: '{{nom_paroisse}}', cle: 'nom_paroisse', label: 'Nom de la paroisse', description: 'Nom officiel de la paroisse configurée', categorie: 'Paroisse' },
  { tag: '{{diocese}}', cle: 'diocese', label: 'Diocèse', description: 'Diocèse ou Archidiocèse de rattachement', categorie: 'Paroisse' },
  { tag: '{{doyenne}}', cle: 'doyenne', label: 'Doyenné', description: 'Doyenné ou vicariat épiscopal', categorie: 'Paroisse' },
  { tag: '{{adresse_paroisse}}', cle: 'adresse_paroisse', label: 'Adresse paroisse', description: 'Adresse postale et géographique de la paroisse', categorie: 'Paroisse' },
  { tag: '{{telephone_paroisse}}', cle: 'telephone_paroisse', label: 'Téléphone paroisse', description: 'Contact téléphonique officiel', categorie: 'Paroisse' },
  { tag: '{{email_paroisse}}', cle: 'email_paroisse', label: 'Email paroisse', description: 'Courriel officiel du secrétariat paroissial', categorie: 'Paroisse' },
  { tag: '{{cure_nom}}', cle: 'cure_nom', label: 'Nom du Curé', description: 'Nom du curé ou premier responsable', categorie: 'Paroisse' },

  // Catéchumène
  { tag: '{{matricule}}', cle: 'matricule', label: 'Matricule', description: 'Code matricule unique du catéchumène', categorie: 'Catéchumène' },
  { tag: '{{nom_complet}}', cle: 'nom_complet', label: 'Nom complet', description: 'Nom et prénoms complets', categorie: 'Catéchumène' },
  { tag: '{{nom}}', cle: 'nom', label: 'Nom', description: 'Nom de famille du catéchumène', categorie: 'Catéchumène' },
  { tag: '{{prenoms}}', cle: 'prenoms', label: 'Prénoms', description: 'Prénoms du catéchumène', categorie: 'Catéchumène' },
  { tag: '{{date_naissance}}', cle: 'date_naissance', label: 'Date de naissance', description: 'Date de naissance formatée', categorie: 'Catéchumène' },
  { tag: '{{lieu_naissance}}', cle: 'lieu_naissance', label: 'Lieu de naissance', description: 'Commune ou ville de naissance', categorie: 'Catéchumène' },
  { tag: '{{nom_pere}}', cle: 'nom_pere', label: 'Nom du père', description: 'Nom et prénoms du père', categorie: 'Catéchumène' },
  { tag: '{{nom_mere}}', cle: 'nom_mere', label: 'Nom de la mère', description: 'Nom et prénoms de la mère', categorie: 'Catéchumène' },
  { tag: '{{telephone}}', cle: 'telephone', label: 'Téléphone', description: 'Numéro de téléphone du catéchumène ou du parent', categorie: 'Catéchumène' },

  // Parcours & Classe
  { tag: '{{annee_pastorale}}', cle: 'annee_pastorale', label: 'Année pastorale', description: 'Année pastorale en cours (ex: 2026-2027)', categorie: 'Année' },
  { tag: '{{section}}', cle: 'section', label: 'Section', description: 'Section catéchétique (Enfants, Jeunes, Adultes)', categorie: 'Année' },
  { tag: '{{niveau}}', cle: 'niveau', label: 'Niveau', description: 'Niveau d\'enseignement (ex: 1ère Année Eucharistie)', categorie: 'Année' },
  { tag: '{{classe}}', cle: 'classe', label: 'Classe', description: 'Nom de la classe assignée', categorie: 'Année' },

  // Sacrements
  { tag: '{{date_bapteme}}', cle: 'date_bapteme', label: 'Date du baptême', description: 'Date de célébration du baptême', categorie: 'Sacrements' },
  { tag: '{{paroisse_bapteme}}', cle: 'paroisse_bapteme', label: 'Paroisse du baptême', description: 'Lieu paroissial du baptême', categorie: 'Sacrements' },
  { tag: '{{num_registre_bapteme}}', cle: 'num_registre_bapteme', label: 'N° Registre Baptême', description: 'Numéro d\'acte ou de folio de baptême', categorie: 'Sacrements' },
  { tag: '{{parrain_marraine}}', cle: 'parrain_marraine', label: 'Parrain / Marraine', description: 'Nom et prénoms du parrain ou de la marraine', categorie: 'Sacrements' },
  { tag: '{{date_premiere_communion}}', cle: 'date_premiere_communion', label: 'Date 1ère Communion', description: 'Date de la première communion eucharistique', categorie: 'Sacrements' },
  { tag: '{{date_confirmation}}', cle: 'date_confirmation', label: 'Date Confirmation', description: 'Date de célébration de la confirmation', categorie: 'Sacrements' },

  // Évaluation & Document
  { tag: '{{moyenne}}', cle: 'moyenne', label: 'Moyenne / Note', description: 'Moyenne générale ou note d\'évaluation', categorie: 'Évaluation' },
  { tag: '{{decision}}', cle: 'decision', label: 'Décision', description: 'Décision finale (Admis, Ajourné, etc.)', categorie: 'Évaluation' },
  { tag: '{{date_du_jour}}', cle: 'date_du_jour', label: 'Date du jour', description: 'Date actuelle d\'impression ou de signature', categorie: 'Évaluation' },
  { tag: '{{reference_document}}', cle: 'reference_document', label: 'Réf. Document', description: 'Numéro de référence officiel du document', categorie: 'Évaluation' }
];
