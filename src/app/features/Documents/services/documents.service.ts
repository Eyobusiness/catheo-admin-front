import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import {
  ModeleDocumentDto,
  CreateModeleDocumentDto,
  UpdateModeleDocumentDto,
  DocumentGenereDto,
  GenererDocumentDto,
  GenererDocumentsMasseDto,
  ModeleDocumentVariableDto,
  VARIABLES_SYSTEME_DEFAUT
} from '../models/document-officiel.model';
import { ConfigurationService } from '../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../core/services/annee-catechese.service';
import { CatechumeneService } from '../../Catechumenes/liste-catechumene/services/catechumene.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.modeles)) return res.data.modeles;
  if (res.data && Array.isArray(res.data.documents)) return res.data.documents;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.modeles)) return res.modeles;
  if (Array.isArray(res.documents)) return res.documents;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

function extractObjectData(res: any): any {
  if (!res) return null;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    if (res.data.modele) return res.data.modele;
    if (res.data.document) return res.data.document;
    if (res.data.item) return res.data.item;
    return res.data;
  }
  if (res.modele) return res.modele;
  if (res.document) return res.document;
  if (res.item) return res.item;
  return res;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);
  private readonly catechumeneService = inject(CatechumeneService);
  private readonly toastService = inject(ToastService);

  private readonly baseUrlModeles = `${environment.apiUrl}/modeles-documents`;
  private readonly baseUrlDocuments = `${environment.apiUrl}/documents-generes`;

  // Reactive state signals
  public readonly modeles = signal<ModeleDocumentDto[]>([]);
  public readonly documentsGeneres = signal<DocumentGenereDto[]>([]);
  public readonly variablesSysteme = signal<ModeleDocumentVariableDto[]>(VARIABLES_SYSTEME_DEFAUT);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);

  // Computeds
  public readonly modelesActifs = computed(() =>
    this.modeles().filter(m => m.statut === 'actif')
  );

  public readonly totalModeles = computed(() => this.modeles().length);
  public readonly totalGeneres = computed(() => this.documentsGeneres().length);

  // Configuration institutionnelle de la paroisse
  public readonly paroisseInfo = computed(() => {
    const config = this.configService.paroisseConfig();
    return {
      nom: config?.nom_paroisse || config?.nom || 'Paroisse Coeur Immaculé de Marie',
      diocese: config?.diocese || 'Archidiocèse d\'Abidjan',
      doyenne: config?.doyenne || 'Vicariat Épiscopal',
      adresse: config?.adresse || '01 BP 1234 Abidjan 01',
      telephone: config?.telephone || '+225 07 00 00 00',
      email: config?.email || 'contact@catheo.ci',
      cureNom: 'Le Curé de la Paroisse',
      logoUrl: config?.logo_paroisse_url || config?.logo_paroisse || config?.logo_url || ''
    };
  });

  // ==========================================
  // 1. GESTION DES MODÈLES DE DOCUMENTS
  // ==========================================

  public getModeles(filters?: { type_document?: string; statut?: string; search?: string }): Observable<ModeleDocumentDto[]> {
    this.isLoading.set(true);
    let params = new HttpParams();

    if (filters?.type_document && filters.type_document !== 'tous' && filters.type_document !== 'toutes') {
      params = params.set('type_document', filters.type_document);
    }
    if (filters?.statut && filters.statut !== 'tous') {
      params = params.set('statut', filters.statut);
    }
    if (filters?.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<any>(this.baseUrlModeles, { params }).pipe(
      map(res => {
        const raw = extractArrayData(res);
        return raw.map((item: any) => this.normalizeModele(item));
      }),
      tap(modeles => {
        this.modeles.set(modeles);
        this.isLoading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger les modèles de documents.');
        return of(this.modeles());
      })
    );
  }

  public getVariablesSysteme(): Observable<ModeleDocumentVariableDto[]> {
    return this.http.get<any>(`${this.baseUrlModeles}/variables-systeme`).pipe(
      map(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          return raw.map((v: any): ModeleDocumentVariableDto => ({
            tag: v.tag || `{{${v.cle || v.name || v.key || 'var'}}}`,
            cle: v.cle || v.name || v.key,
            description: v.description || v.label || v.cle || v.tag || '',
            label: v.label || v.description || v.cle || v.tag || '',
            categorie: v.categorie || v.category || 'Général'
          }));
        }
        return VARIABLES_SYSTEME_DEFAUT;
      }),
      tap(vars => {
        if (vars.length > 0) {
          this.variablesSysteme.set(vars);
        }
      }),
      catchError(() => of(this.variablesSysteme()))
    );
  }

  public getModeleById(id: string): Observable<ModeleDocumentDto | null> {
    const cached = this.modeles().find(m => m.id === id);
    if (cached) return of(cached);

    this.isLoading.set(true);
    return this.http.get<any>(`${this.baseUrlModeles}/${id}`).pipe(
      map(res => {
        const raw = extractObjectData(res);
        return raw ? this.normalizeModele(raw) : null;
      }),
      tap(() => this.isLoading.set(false)),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Modèle de document introuvable.');
        return of(null);
      })
    );
  }

  public createModele(dto: CreateModeleDocumentDto): Observable<ModeleDocumentDto | null> {
    this.isSaving.set(true);
    return this.http.post<any>(this.baseUrlModeles, dto).pipe(
      map(res => {
        const raw = extractObjectData(res);
        return this.normalizeModele(raw);
      }),
      tap(created => {
        this.isSaving.set(false);
        this.modeles.update(list => [created, ...list]);
        this.toastService.success('Succès', `Modèle « ${created.titre} » créé avec succès.`);
      }),
      catchError((error: HttpErrorResponse) => {
        this.isSaving.set(false);
        const msg = error.error?.message || 'Erreur lors de la création du modèle.';
        this.toastService.error('Erreur', msg);
        return of(null);
      })
    );
  }

  public updateModele(id: string, dto: UpdateModeleDocumentDto): Observable<ModeleDocumentDto | null> {
    this.isSaving.set(true);
    return this.http.put<any>(`${this.baseUrlModeles}/${id}`, dto).pipe(
      map(res => {
        const raw = extractObjectData(res);
        return this.normalizeModele(raw);
      }),
      tap(updated => {
        this.isSaving.set(false);
        this.modeles.update(list => list.map(m => m.id === id ? updated : m));
        this.toastService.success('Succès', `Modèle « ${updated.titre} » mis à jour.`);
      }),
      catchError((error: HttpErrorResponse) => {
        this.isSaving.set(false);
        const msg = error.error?.message || 'Erreur lors de la modification du modèle.';
        this.toastService.error('Erreur', msg);
        return of(null);
      })
    );
  }

  public toggleStatutModele(id: string): Observable<ModeleDocumentDto | null> {
    return this.http.patch<any>(`${this.baseUrlModeles}/${id}/toggle-status`, {}).pipe(
      map(res => {
        const raw = extractObjectData(res);
        return this.normalizeModele(raw);
      }),
      tap(updated => {
        this.modeles.update(list => list.map(m => m.id === id ? updated : m));
        this.toastService.info('Information', `Modèle « ${updated.titre} » : statut mis à jour.`);
      }),
      catchError((error: HttpErrorResponse) => {
        const msg = error.error?.message || 'Impossible de modifier le statut du modèle.';
        this.toastService.error('Erreur', msg);
        return of(null);
      })
    );
  }

  public deleteModele(id: string): Observable<boolean> {
    this.isSaving.set(true);
    return this.http.delete<any>(`${this.baseUrlModeles}/${id}`).pipe(
      map(() => true),
      tap(() => {
        this.isSaving.set(false);
        this.modeles.update(list => list.filter(m => m.id !== id));
        this.toastService.success('Succès', 'Modèle de document supprimé.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isSaving.set(false);
        const msg = error.error?.message || 'Erreur lors de la suppression du modèle.';
        this.toastService.error('Erreur', msg);
        return of(false);
      })
    );
  }

  // ==========================================
  // 2. GESTION DE LA GÉNÉRATION DE DOCUMENTS
  // ==========================================

  public getDocumentsGeneres(filters?: {
    type_document?: string;
    catechumene_id?: string;
    modele_id?: string;
    annee_catechese_id?: string;
    search?: string;
    date_debut?: string;
    date_fin?: string;
  }): Observable<DocumentGenereDto[]> {
    this.isLoading.set(true);
    let params = new HttpParams();

    if (filters?.type_document && filters.type_document !== 'tous') {
      params = params.set('type_document', filters.type_document);
    }
    if (filters?.catechumene_id) {
      params = params.set('catechumene_id', filters.catechumene_id);
    }
    if (filters?.modele_id) {
      params = params.set('modele_id', filters.modele_id);
    }
    if (filters?.annee_catechese_id) {
      params = params.set('annee_catechese_id', filters.annee_catechese_id);
    }
    if (filters?.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<any>(this.baseUrlDocuments, { params }).pipe(
      map(res => {
        const raw = extractArrayData(res);
        return raw.map((item: any) => this.normalizeDocumentGenere(item));
      }),
      tap(docs => {
        this.documentsGeneres.set(docs);
        this.isLoading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger l\'historique des documents.');
        return of(this.documentsGeneres());
      })
    );
  }

  public getDocumentGenereById(id: string): Observable<DocumentGenereDto | null> {
    const cached = this.documentsGeneres().find(d => d.id === id);
    if (cached) return of(cached);

    this.isLoading.set(true);
    return this.http.get<any>(`${this.baseUrlDocuments}/${id}`).pipe(
      map(res => {
        const raw = extractObjectData(res);
        return raw ? this.normalizeDocumentGenere(raw) : null;
      }),
      tap(() => this.isLoading.set(false)),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Document généré introuvable.');
        return of(null);
      })
    );
  }

  public genererDocument(dto: GenererDocumentDto): Observable<DocumentGenereDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrlDocuments, dto).pipe(
      map(res => {
        const raw = extractObjectData(res);
        return this.normalizeDocumentGenere(raw);
      }),
      tap(doc => {
        this.isLoading.set(false);
        this.documentsGeneres.update(list => [doc, ...list]);
        this.toastService.success('Succès', `Document « ${doc.titre} » généré avec succès.`);
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Erreur lors de la génération du document.';
        this.toastService.error('Erreur', msg);
        return of(null);
      })
    );
  }

  public genererDocumentsMasse(dto: GenererDocumentsMasseDto): Observable<DocumentGenereDto[]> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrlDocuments}/masse`, dto).pipe(
      map(res => {
        const raw = extractArrayData(res);
        return raw.map((item: any) => this.normalizeDocumentGenere(item));
      }),
      tap(docs => {
        this.isLoading.set(false);
        this.documentsGeneres.update(list => [...docs, ...list]);
        this.toastService.success('Succès', `${docs.length} document(s) généré(s) en masse.`);
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Erreur lors de la génération en masse.';
        this.toastService.error('Erreur', msg);
        return of([]);
      })
    );
  }

  public deleteDocumentGenere(id: string): Observable<boolean> {
    this.isLoading.set(true);
    return this.http.delete<any>(`${this.baseUrlDocuments}/${id}`).pipe(
      map(() => true),
      tap(() => {
        this.isLoading.set(false);
        this.documentsGeneres.update(list => list.filter(d => d.id !== id));
        this.toastService.success('Succès', 'Document supprimé de l\'historique.');
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        const msg = error.error?.message || 'Erreur lors de la suppression.';
        this.toastService.error('Erreur', msg);
        return of(false);
      })
    );
  }

  // ==========================================
  // 3. FUSION ET INTERPOLATION DES BALISES
  // ==========================================

  public fusionnerContenu(template: string, catechumeneId?: string, customVars?: Record<string, string>): string {
    if (!template) return '';
    const cat = catechumeneId
      ? this.catechumeneService.catechumenes().find(c => c.id === catechumeneId)
      : this.catechumeneService.catechumenes()[0];
    const pInfo = this.paroisseInfo();
    const anneeActive = this.anneeService.activeAnnee()?.libelle || '2026-2027';

    const dateToday = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const context: Record<string, string> = {
      'nom_paroisse': pInfo.nom,
      'diocese': pInfo.diocese,
      'doyenne': pInfo.doyenne,
      'adresse_paroisse': pInfo.adresse,
      'telephone_paroisse': pInfo.telephone,
      'email_paroisse': pInfo.email,
      'cure_nom': pInfo.cureNom,

      'nom_complet': cat?.nom_complet || (cat ? `${cat.nom} ${cat.prenoms}` : 'NOM DU CATÉCHUMÈNE'),
      'nom': cat?.nom || 'NOM',
      'prenoms': cat?.prenoms || 'Prénoms',
      'matricule': cat?.matricule || cat?.code_catechumene || 'CAT-2026-000',
      'date_naissance': cat?.date_naissance || '01/01/2010',
      'lieu_naissance': cat?.lieu_naissance || 'Abidjan',
      'telephone': cat?.telephone || '',
      'nom_pere': cat?.nom_pere || '',
      'nom_mere': cat?.nom_mere || '',

      'annee_pastorale': anneeActive,
      'classe': cat?.classe_scolaire || '',
      'niveau': '',
      'section': '',

      'date_du_jour': dateToday,
      'date_generation': dateToday,
      'reference_document': `DOC-${Date.now().toString().slice(-6)}`,

      ...(customVars || {})
    };

    let result = template;
    for (const [key, val] of Object.entries(context)) {
      const reg = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(reg, val ?? '');
    }

    return result;
  }

  // ==========================================
  // NORMALISEURS DTOs
  // ==========================================

  private normalizeModele(raw: any): ModeleDocumentDto {
    return {
      id: raw.id ? String(raw.id) : `mod-${Date.now()}`,
      uuid: raw.uuid,
      titre: raw.titre || raw.nom || 'Modèle de document',
      code: raw.code,
      type_document: raw.type_document || raw.type || 'autre',
      description: raw.description,
      contenu: raw.contenu || raw.corps || raw.template || '',
      variables_disponibles: raw.variables_disponibles || [],
      en_tete_active: raw.en_tete_active ?? true,
      pied_page_active: raw.pied_page_active ?? true,
      signature_nom: raw.signature_nom || 'Le Curé de la Paroisse',
      signature_titre: raw.signature_titre || 'Le Curé',
      statut: raw.statut || (raw.actif ? 'actif' : 'inactif'),
      is_system: raw.is_system ?? false,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at
    };
  }

  private normalizeDocumentGenere(raw: any): DocumentGenereDto {
    return {
      id: raw.id ? String(raw.id) : `doc-${Date.now()}`,
      reference_document: raw.reference_document || raw.reference || `REF-${raw.id || Date.now()}`,
      titre: raw.titre || 'Document officiel',
      type_document: raw.type_document || raw.type || 'autre',
      contenu: raw.contenu || raw.contenu_genere || raw.contenu_html || '',
      modele_document_id: raw.modele_document_id || raw.modele_id || raw.modele?.id || '',
      modele_titre: raw.modele_titre || raw.modele?.titre || raw.modele?.nom,
      catechumene_id: raw.catechumene_id || raw.catechumene?.id || '',
      catechumene: raw.catechumene,
      annee_catechese_id: raw.annee_catechese_id || raw.annee_catechese?.id,
      annee_libelle: raw.annee_libelle || raw.annee_catechese?.libelle,
      variables_fusionnees: raw.variables_fusionnees || {},
      fichier_pdf_path: raw.fichier_pdf_path || raw.pdf_url || raw.fichier_path,
      fichier_pdf_url: raw.fichier_pdf_url || raw.pdf_url,
      genere_par_user_id: raw.genere_par_user_id || raw.user_id,
      genere_par_nom: raw.genere_par_nom || raw.user?.name || 'Secrétariat',
      date_generation: raw.date_generation || raw.created_at || new Date().toISOString(),
      created_at: raw.created_at,
      updated_at: raw.updated_at
    };
  }
}
