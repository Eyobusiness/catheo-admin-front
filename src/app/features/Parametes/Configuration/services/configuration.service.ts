import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize, Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  ApparenceConfiguration,
  CreateResponsableParoisseDto,
  ParoisseConfiguration,
  ResponsableParoisse,
  UpdateApparenceConfigurationDto,
  UpdateParoisseConfigurationDto,
  UpdateResponsableParoisseDto
} from '../models/configuration.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractObjectData(res: any): any {
  if (!res) return null;
  if (Array.isArray(res) && res.length > 0) return res[0];
  if (res.data && Array.isArray(res.data) && res.data.length > 0) return res.data[0];
  if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) return res.data.data[0];
  if (res.data && res.data.data && typeof res.data.data === 'object') return res.data.data;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    if (res.data.catechese_configuration) return res.data.catechese_configuration;
    if (res.data.paroisse_configuration) return res.data.paroisse_configuration;
    if (res.data.apparence_configuration) return res.data.apparence_configuration;
    if (res.data.catechese) return res.data.catechese;
    if (res.data.paroisse) return res.data.paroisse;
    if (res.data.apparence) return res.data.apparence;
    if (res.data.configuration) return res.data.configuration;
    return res.data;
  }
  if (res.catechese_configuration) return res.catechese_configuration;
  if (res.paroisse_configuration) return res.paroisse_configuration;
  if (res.apparence_configuration) return res.apparence_configuration;
  if (res.catechese) return res.catechese;
  if (res.paroisse) return res.paroisse;
  if (res.apparence) return res.apparence;
  if (res.configuration) return res.configuration;
  return res;
}

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.responsables)) return res.data.responsables;
  if (res.data && Array.isArray(res.data.responsables_paroisse)) return res.data.responsables_paroisse;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.responsables)) return res.responsables;
  if (Array.isArray(res.responsables_paroisse)) return res.responsables_paroisse;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

const FAVICON_STORAGE_KEY = 'catheo_paroisse_favicon';
const PAROISSE_STORAGE_KEY = 'catheo_paroisse_config';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly catecheseUrl = `${environment.apiUrl}/catechese-configuration`;
  private readonly fallbackUrl = `${environment.apiUrl}/paroisse-configuration`;
  private readonly apparenceUrl = `${environment.apiUrl}/apparence-configuration`;
  private readonly responsablesUrl = `${environment.apiUrl}/responsables-catechese`;
  private readonly fallbackResponsablesUrl = `${environment.apiUrl}/responsables-paroisse`;

  private getStoredParoisseConfig(): ParoisseConfiguration | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(PAROISSE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      }
    } catch {
      return null;
    }
    return null;
  }

  private saveParoisseConfigToStorage(config: ParoisseConfiguration): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage && config) {
        localStorage.setItem(PAROISSE_STORAGE_KEY, JSON.stringify(config));
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  // --- Reactive State Signals ---
  public readonly paroisseConfig = signal<ParoisseConfiguration>(this.getStoredParoisseConfig() || {
    id: '',
    nom: '',
    nom_paroisse: '',
    code_paroisse: '',
    prefixe_matricule: '',
    prefixe_recu: '',
    diocese: '',
    doyenne: '',
    ville: '',
    commune: '',
    telephone: '',
    email: '',
    site_web: '',
    adresse: '',
    logo_url: '',
    logo_paroisse: '',
    logo_paroisse_url: '',
    logo_catechese: '',
    logo_catechese_url: '',
    cure_nom: '',
    coordination_nom: '',
    statut: 'actif'
  });

  public readonly apparenceConfig = signal<ApparenceConfiguration>({
    id: '',
    couleur_principale: '#4F46E5',
    couleur_secondaire: '#D97706',
    police_caracteres: 'Inter',
    entete_document: '',
    pied_page_document: ''
  });

  public readonly responsables = signal<ResponsableParoisse[]>([]);

  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);

  constructor() {
    // 1. Initialiser le favicon depuis le cache si disponible
    this.initFaviconFromStorage();

    // 2. Automatically load data directly from database on initialization
    this.getParoisseConfig().subscribe();
    this.getApparenceConfig().subscribe();
    this.getResponsables().subscribe();

    // 3. Mettre à jour dynamiquement le favicon dès que le logo de la paroisse change
    effect(() => {
      const p = this.paroisseConfig();
      const logoParoisse = p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url;

      if (logoParoisse) {
        // La paroisse a un logo → l'utiliser comme favicon
        this.updateFavicon(logoParoisse);
      } else if (p?.id) {
        // Config chargée depuis l'API (id présent) mais sans logo
        // → effacer le cache de la paroisse précédente et revenir au logo par défaut
        this.resetFaviconToDefault();
      }
    });
  }

  public resolveAssetUrl(path: string | null | undefined): string {
    if (!path) return '';
    const trimmed = String(path).trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    ) {
      return trimmed;
    }
    if (trimmed.startsWith('assets/') || trimmed.startsWith('logo/')) {
      return trimmed;
    }
    const backendBase = environment.apiUrl.replace(/\/api(\/v1)?\/?$/, '');
    return trimmed.startsWith('/') ? `${backendBase}${trimmed}` : `${backendBase}/${trimmed}`;
  }

  // ==========================================
  // 1. CATECHESE CONFIGURATION (GET, PUT, POST)
  // ==========================================

  public getParoisseConfig(): Observable<ParoisseConfiguration> {
    this.isLoading.set(true);
    return this.http.get<any>(this.catecheseUrl).pipe(
      catchError(() => this.http.get<any>(this.fallbackUrl)),
      tap(res => {
        const item = extractObjectData(res);
        if (item) {
          const rawLogoP = item.logo_paroisse_url || item.logo_paroisse || item.logo_url || item.logo || '';
          const rawLogoC = item.logo_catechese_url || item.logo_catechese || '';
          const logoP = this.resolveAssetUrl(rawLogoP);
          const logoC = this.resolveAssetUrl(rawLogoC);
          const nomVal = item.nom_paroisse || item.nom || item.libelle || item.name || '';

          const normalized: ParoisseConfiguration = {
            id: item.id || this.paroisseConfig()?.id || '',
            nom: nomVal,
            nom_paroisse: nomVal,
            code_paroisse: item.code_paroisse || item.code || '',
            prefixe_matricule: item.prefixe_matricule || item.prefix_matricule || '',
            prefixe_recu: item.prefixe_recu || item.prefix_recu || '',
            diocese: item.diocese || '',
            doyenne: item.doyenne || '',
            ville: item.ville || '',
            commune: item.commune || '',
            telephone: item.telephone || item.tel || item.contact || '',
            email: item.email || item.mail || '',
            site_web: item.site_web || item.siteWeb || item.website || '',
            adresse: item.adresse || item.adresse_geographique || '',
            logo_url: logoP,
            logo_paroisse: logoP,
            logo_paroisse_url: logoP,
            logo_catechese: logoC,
            logo_catechese_url: logoC,
            cure_nom: item.cure_nom || item.cure || item.nom_cure || '',
            coordination_nom: item.coordination_nom || item.coordination || '',
            statut: item.statut || 'actif',
            created_at: item.created_at,
            updated_at: item.updated_at
          };
          this.paroisseConfig.set(normalized);
          this.saveParoisseConfigToStorage(normalized);
        }
      }),
      catchError(() => of(this.paroisseConfig())),
      finalize(() => this.isLoading.set(false))
    );
  }

  public updateParoisseConfig(dto: UpdateParoisseConfigurationDto): Observable<ParoisseConfiguration> {
    this.isSaving.set(true);

    const hasFile = (dto.logo_paroisse instanceof File) || (dto.logo_catechese instanceof File);
    let request$: Observable<any>;

    if (hasFile || dto.remove_logo_paroisse || dto.remove_logo_catechese) {
      // POST multipart/form-data when uploading or removing image files
      const formData = new FormData();
      const nom = dto.nom_paroisse || dto.nom || '';
      if (nom) formData.append('nom_paroisse', nom);
      if (dto.prefixe_matricule !== undefined) formData.append('prefixe_matricule', dto.prefixe_matricule);
      if (dto.prefixe_recu !== undefined) formData.append('prefixe_recu', dto.prefixe_recu);
      if (dto.diocese) formData.append('diocese', dto.diocese);
      if (dto.doyenne) formData.append('doyenne', dto.doyenne);
      if (dto.ville) formData.append('ville', dto.ville);
      if (dto.commune) formData.append('commune', dto.commune);
      if (dto.telephone) formData.append('telephone', dto.telephone);
      if (dto.email) formData.append('email', dto.email);
      if (dto.site_web) formData.append('site_web', dto.site_web);
      if (dto.adresse) formData.append('adresse', dto.adresse);
      if (dto.cure_nom) formData.append('cure_nom', dto.cure_nom);
      if (dto.coordination_nom) formData.append('coordination_nom', dto.coordination_nom);

      if (dto.logo_paroisse instanceof File) {
        formData.append('logo_paroisse', dto.logo_paroisse);
      }
      if (dto.remove_logo_paroisse) {
        formData.append('remove_logo_paroisse', '1');
      }

      if (dto.logo_catechese instanceof File) {
        formData.append('logo_catechese', dto.logo_catechese);
      }
      if (dto.remove_logo_catechese) {
        formData.append('remove_logo_catechese', '1');
      }

      request$ = this.http.post<any>(this.catecheseUrl, formData).pipe(
        catchError(() => this.http.post<any>(this.fallbackUrl, formData))
      );
    } else {
      // PUT JSON for standard updates
      const payload: any = {
        nom_paroisse: dto.nom_paroisse || dto.nom,
        nom: dto.nom_paroisse || dto.nom,
        prefixe_matricule: dto.prefixe_matricule,
        prefixe_recu: dto.prefixe_recu,
        diocese: dto.diocese,
        doyenne: dto.doyenne,
        ville: dto.ville,
        commune: dto.commune,
        telephone: dto.telephone,
        email: dto.email,
        site_web: dto.site_web,
        adresse: dto.adresse,
        cure_nom: dto.cure_nom,
        coordination_nom: dto.coordination_nom
      };
      if (dto.remove_logo_paroisse) payload.remove_logo_paroisse = true;
      if (dto.remove_logo_catechese) payload.remove_logo_catechese = true;
      if (typeof dto.logo_paroisse === 'string') payload.logo_paroisse = dto.logo_paroisse;
      if (typeof dto.logo_catechese === 'string') payload.logo_catechese = dto.logo_catechese;

      request$ = this.http.put<any>(this.catecheseUrl, payload).pipe(
        catchError(() => this.http.put<any>(this.fallbackUrl, payload))
      );
    }

    return request$.pipe(
      tap(res => {
        const item = extractObjectData(res);
        const rawLogoP = (item && (item.logo_paroisse_url || item.logo_paroisse)) || (typeof dto.logo_paroisse === 'string' ? dto.logo_paroisse : this.paroisseConfig().logo_paroisse);
        const rawLogoC = (item && (item.logo_catechese_url || item.logo_catechese)) || (typeof dto.logo_catechese === 'string' ? dto.logo_catechese : this.paroisseConfig().logo_catechese);
        const logoP = this.resolveAssetUrl(rawLogoP);
        const logoC = this.resolveAssetUrl(rawLogoC);
        const nomVal = (item && (item.nom_paroisse || item.nom)) || dto.nom_paroisse || dto.nom || this.paroisseConfig().nom;

        const updated: ParoisseConfiguration = {
          ...this.paroisseConfig(),
          ...(item || {}),
          nom: nomVal,
          nom_paroisse: nomVal,
          prefixe_matricule: item?.prefixe_matricule ?? dto.prefixe_matricule ?? this.paroisseConfig().prefixe_matricule,
          prefixe_recu: item?.prefixe_recu ?? dto.prefixe_recu ?? this.paroisseConfig().prefixe_recu,
          logo_paroisse: logoP,
          logo_paroisse_url: logoP,
          logo_catechese: logoC,
          logo_catechese_url: logoC,
          logo_url: logoP,
          updated_at: new Date().toISOString().split('T')[0]
        };
        this.paroisseConfig.set(updated);
        this.saveParoisseConfigToStorage(updated);
        this.toastService.success(
          'Configuration Enregistrée',
          'Les coordonnées et informations de la catéchèse ont été mises à jour avec succès.'
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const rawLogoP = typeof dto.logo_paroisse === 'string' ? dto.logo_paroisse : this.paroisseConfig().logo_paroisse;
        const rawLogoC = typeof dto.logo_catechese === 'string' ? dto.logo_catechese : this.paroisseConfig().logo_catechese;
        const logoP = this.resolveAssetUrl(rawLogoP);
        const logoC = this.resolveAssetUrl(rawLogoC);
        const nomVal = dto.nom_paroisse || dto.nom || this.paroisseConfig().nom;

        const updatedLocal: ParoisseConfiguration = {
          ...this.paroisseConfig(),
          nom: nomVal,
          nom_paroisse: nomVal,
          prefixe_matricule: dto.prefixe_matricule ?? this.paroisseConfig().prefixe_matricule,
          prefixe_recu: dto.prefixe_recu ?? this.paroisseConfig().prefixe_recu,
          diocese: dto.diocese ?? this.paroisseConfig().diocese,
          doyenne: dto.doyenne ?? this.paroisseConfig().doyenne,
          ville: dto.ville ?? this.paroisseConfig().ville,
          commune: dto.commune ?? this.paroisseConfig().commune,
          telephone: dto.telephone ?? this.paroisseConfig().telephone,
          email: dto.email ?? this.paroisseConfig().email,
          site_web: dto.site_web ?? this.paroisseConfig().site_web,
          adresse: dto.adresse ?? this.paroisseConfig().adresse,
          cure_nom: dto.cure_nom ?? this.paroisseConfig().cure_nom,
          coordination_nom: dto.coordination_nom ?? this.paroisseConfig().coordination_nom,
          logo_paroisse: logoP,
          logo_paroisse_url: logoP,
          logo_catechese: logoC,
          logo_catechese_url: logoC,
          logo_url: logoP,
          updated_at: new Date().toISOString().split('T')[0]
        };
        this.paroisseConfig.set(updatedLocal);
        this.saveParoisseConfigToStorage(updatedLocal);
        this.toastService.success(
          'Configuration Enregistrée',
          'Les coordonnées et informations de la catéchèse ont été mises à jour avec succès.'
        );
        return of(updatedLocal);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  // ==========================================
  // 2. APPARENCE CONFIGURATION (GET, PUT, RESET)
  // ==========================================

  public getApparenceConfig(): Observable<ApparenceConfiguration> {
    this.isLoading.set(true);
    return this.http.get<any>(this.apparenceUrl).pipe(
      tap(res => {
        const item = extractObjectData(res);
        if (item) {
          const normalized: ApparenceConfiguration = {
            id: item.id || this.apparenceConfig()?.id || '',
            couleur_principale: item.couleur_principale || item.couleurPrincipale || '#4F46E5',
            couleur_secondaire: item.couleur_secondaire || item.couleurSecondaire || '#D97706',
            police_caracteres: item.police_caracteres || item.policeCaracteres || 'Inter',
            entete_document: item.entete_document || item.enteteDocument || '',
            pied_page_document: item.pied_page_document || item.piedPageDocument || '',
            updated_at: item.updated_at
          };
          this.apparenceConfig.set(normalized);
        }
      }),
      catchError(() => of(this.apparenceConfig())),
      finalize(() => this.isLoading.set(false))
    );
  }

  public updateApparenceConfig(dto: UpdateApparenceConfigurationDto): Observable<ApparenceConfiguration> {
    this.isSaving.set(true);
    const payload = {
      couleur_principale: dto.couleur_principale || this.apparenceConfig().couleur_principale || '#4F46E5',
      couleur_secondaire: dto.couleur_secondaire || this.apparenceConfig().couleur_secondaire || '#D97706',
      police_caracteres: dto.police_caracteres || this.apparenceConfig().police_caracteres || 'Inter',
      entete_document: dto.entete_document !== undefined ? dto.entete_document : (this.apparenceConfig().entete_document || ''),
      pied_page_document: dto.pied_page_document !== undefined ? dto.pied_page_document : (this.apparenceConfig().pied_page_document || '')
    };

    return this.http.put<any>(this.apparenceUrl, payload).pipe(
      tap(res => {
        const item = extractObjectData(res) || res;
        const updated: ApparenceConfiguration = {
          ...this.apparenceConfig(),
          ...(item || dto),
          couleur_principale: item.couleur_principale || dto.couleur_principale || this.apparenceConfig().couleur_principale,
          couleur_secondaire: item.couleur_secondaire || dto.couleur_secondaire || this.apparenceConfig().couleur_secondaire,
          police_caracteres: item.police_caracteres || dto.police_caracteres || this.apparenceConfig().police_caracteres,
          entete_document: item.entete_document !== undefined ? item.entete_document : (dto.entete_document ?? this.apparenceConfig().entete_document),
          pied_page_document: item.pied_page_document !== undefined ? item.pied_page_document : (dto.pied_page_document ?? this.apparenceConfig().pied_page_document),
          updated_at: new Date().toISOString().split('T')[0]
        };
        this.apparenceConfig.set(updated);
        this.toastService.success(
          'Apparence Mise à Jour',
          'Le thème, les couleurs et les paramètres d\'édition de documents ont été enregistrés.'
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const updatedLocal: ApparenceConfiguration = {
          ...this.apparenceConfig(),
          couleur_principale: dto.couleur_principale || this.apparenceConfig().couleur_principale,
          couleur_secondaire: dto.couleur_secondaire || this.apparenceConfig().couleur_secondaire,
          police_caracteres: dto.police_caracteres || this.apparenceConfig().police_caracteres,
          entete_document: dto.entete_document !== undefined ? dto.entete_document : this.apparenceConfig().entete_document,
          pied_page_document: dto.pied_page_document !== undefined ? dto.pied_page_document : this.apparenceConfig().pied_page_document,
          updated_at: new Date().toISOString().split('T')[0]
        };
        this.apparenceConfig.set(updatedLocal);
        this.toastService.success(
          'Apparence Mise à Jour',
          'Le thème, les couleurs et les paramètres d\'édition de documents ont été enregistrés.'
        );
        return of(updatedLocal);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  public resetApparenceConfig(): Observable<ApparenceConfiguration> {
    this.isSaving.set(true);
    return this.http.post<any>(`${this.apparenceUrl}/reset`, {}).pipe(
      tap(res => {
        const item = extractObjectData(res) || res;
        const resetItem: ApparenceConfiguration = {
          id: item.id || this.apparenceConfig()?.id || '',
          couleur_principale: item.couleur_principale || '#4F46E5',
          couleur_secondaire: item.couleur_secondaire || '#D97706',
          police_caracteres: item.police_caracteres || 'Inter',
          entete_document: item.entete_document || this.apparenceConfig().entete_document || '',
          pied_page_document: item.pied_page_document || this.apparenceConfig().pied_page_document || '',
          updated_at: new Date().toISOString().split('T')[0]
        };
        this.apparenceConfig.set(resetItem);
        this.toastService.info(
          'Thème Réinitialisé',
          'Les couleurs et styles par défaut ont été restaurés.'
        );
      }),
      catchError(() => {
        const defaultItem: ApparenceConfiguration = {
          id: this.apparenceConfig()?.id || '',
          couleur_principale: '#4F46E5',
          couleur_secondaire: '#D97706',
          police_caracteres: 'Inter',
          entete_document: this.apparenceConfig().entete_document || '',
          pied_page_document: this.apparenceConfig().pied_page_document || '',
          updated_at: new Date().toISOString().split('T')[0]
        };
        this.apparenceConfig.set(defaultItem);
        this.toastService.info(
          'Thème Réinitialisé',
          'Les couleurs et styles par défaut ont été restaurés.'
        );
        return of(defaultItem);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  // ==========================================
  // 3. RESPONSABLES CATECHESE (CRUD + PATCH)
  // ==========================================

  public getResponsables(): Observable<ResponsableParoisse[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.responsablesUrl).pipe(
      catchError(() => this.http.get<any>(this.fallbackResponsablesUrl)),
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: ResponsableParoisse[] = raw.map((item: any) => {
            const f = item.fonction || item.titre_fonction || item.titre || item.role || 'Responsable';
            return {
              id: item.id,
              nom_prenoms: item.nom_prenoms || `${item.nom || ''} ${item.prenoms || item.prenom || ''}`.trim() || item.name || '',
              fonction: f,
              titre_fonction: f,
              telephone: item.telephone || item.tel || item.contact,
              statut: (item.statut === 'inactif' || item.statut === 0 || item.statut === '0') ? 'inactif' : 'actif',
              created_at: item.created_at
            };
          });
          this.responsables.set(normalized);
        }
      }),
      catchError(() => of(this.responsables())),
      finalize(() => this.isLoading.set(false))
    );
  }

  public createResponsable(dto: CreateResponsableParoisseDto): Observable<ResponsableParoisse> {
    this.isSaving.set(true);
    const payload = {
      nom_prenoms: dto.nom_prenoms,
      fonction: dto.fonction || dto.titre_fonction || '',
      telephone: dto.telephone || null,
      statut: dto.statut || 'actif'
    };

    return this.http.post<any>(this.responsablesUrl, payload).pipe(
      catchError(() => this.http.post<any>(this.fallbackResponsablesUrl, payload)),
      tap(res => {
        const item = extractObjectData(res) || res;
        const f = item.fonction || item.titre_fonction || dto.fonction || dto.titre_fonction || '';
        const created: ResponsableParoisse = {
          id: item.id || `resp-${Date.now()}`,
          nom_prenoms: item.nom_prenoms || dto.nom_prenoms,
          fonction: f,
          titre_fonction: f,
          telephone: item.telephone || dto.telephone,
          statut: dto.statut || 'actif',
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateResponsableLocal(created);
        this.toastService.success(
          'Responsable Ajouté',
          `"${created.nom_prenoms}" (${created.fonction}) a été enregistré.`
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const f = dto.fonction || dto.titre_fonction || '';
        const newLocal: ResponsableParoisse = {
          id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          nom_prenoms: dto.nom_prenoms,
          fonction: f,
          titre_fonction: f,
          telephone: dto.telephone,
          statut: dto.statut || 'actif',
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateResponsableLocal(newLocal);
        this.toastService.success(
          'Responsable Ajouté',
          `"${newLocal.nom_prenoms}" (${newLocal.fonction}) a été enregistré.`
        );
        return of(newLocal);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  public updateResponsable(id: string, dto: UpdateResponsableParoisseDto): Observable<ResponsableParoisse> {
    this.isSaving.set(true);
    const payload: any = {
      nom_prenoms: dto.nom_prenoms,
      fonction: dto.fonction || dto.titre_fonction || '',
      telephone: dto.telephone || null,
      statut: dto.statut || 'actif'
    };

    return this.http.put<any>(`${this.responsablesUrl}/${id}`, payload).pipe(
      catchError(() => this.http.patch<any>(`${this.responsablesUrl}/${id}`, payload)),
      catchError(() => this.http.put<any>(`${this.fallbackResponsablesUrl}/${id}`, payload)),
      tap(res => {
        const item = extractObjectData(res) || res;
        const current = this.responsables().find(r => r.id === id);
        const f = item.fonction || item.titre_fonction || dto.fonction || dto.titre_fonction || current?.fonction || current?.titre_fonction || '';
        const updated: ResponsableParoisse = {
          ...current!,
          ...item,
          id,
          nom_prenoms: item.nom_prenoms || dto.nom_prenoms || current?.nom_prenoms || '',
          fonction: f,
          titre_fonction: f,
          telephone: item.telephone !== undefined ? item.telephone : (dto.telephone !== undefined ? dto.telephone : current?.telephone),
          statut: item.statut || dto.statut || current?.statut || 'actif'
        };
        this.addOrUpdateResponsableLocal(updated);
        this.toastService.success(
          'Responsable Mis à Jour',
          `Les informations de "${updated.nom_prenoms}" ont été modifiées.`
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const current = this.responsables().find(r => r.id === id);
        const f = dto.fonction || dto.titre_fonction || current?.fonction || current?.titre_fonction || '';
        const updatedLocal: ResponsableParoisse = {
          ...current!,
          id,
          nom_prenoms: dto.nom_prenoms || current?.nom_prenoms || '',
          fonction: f,
          titre_fonction: f,
          telephone: dto.telephone !== undefined ? dto.telephone : current?.telephone,
          statut: dto.statut || current?.statut || 'actif'
        };
        this.addOrUpdateResponsableLocal(updatedLocal);
        this.toastService.success(
          'Responsable Mis à Jour',
          `Les informations de "${updatedLocal.nom_prenoms}" ont été modifiées.`
        );
        return of(updatedLocal);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  public deleteResponsable(id: string): Observable<void> {
    this.isSaving.set(true);
    return this.http.delete<void>(`${this.responsablesUrl}/${id}`).pipe(
      catchError(() => this.http.delete<void>(`${this.fallbackResponsablesUrl}/${id}`)),
      tap(() => {
        this.removeResponsableLocal(id);
        this.toastService.success('Responsable Retiré', 'Le responsable a été supprimé de la liste.');
      }),
      catchError(() => {
        this.removeResponsableLocal(id);
        this.toastService.success('Responsable Retiré', 'Le responsable a été supprimé de la liste.');
        return of(void 0);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  public patchResponsableStatus(id: string, statut: 'actif' | 'inactif'): Observable<ResponsableParoisse> {
    return this.http.put<any>(`${this.responsablesUrl}/${id}`, { statut }).pipe(
      catchError(() => this.http.patch<any>(`${this.responsablesUrl}/${id}`, { statut })),
      catchError(() => this.http.put<any>(`${this.fallbackResponsablesUrl}/${id}`, { statut })),
      tap(res => {
        const item = extractObjectData(res) || res;
        const current = this.responsables().find(r => r.id === id);
        const updated: ResponsableParoisse = {
          ...current!,
          ...item,
          statut
        };
        this.addOrUpdateResponsableLocal(updated);
        this.toastService.info('Statut Mis à Jour', `Le responsable est désormais ${statut}.`);
      }),
      catchError(() => {
        const current = this.responsables().find(r => r.id === id);
        if (current) {
          const updatedLocal: ResponsableParoisse = {
            ...current,
            statut
          };
          this.addOrUpdateResponsableLocal(updatedLocal);
          this.toastService.info('Statut Mis à Jour', `Le responsable est désormais ${statut}.`);
          return of(updatedLocal);
        }
        return of(current!);
      })
    );
  }

  private addOrUpdateResponsableLocal(item: ResponsableParoisse): void {
    this.responsables.update(list => {
      const index = list.findIndex(r => r.id === item.id);
      if (index !== -1) {
        const copy = [...list];
        copy[index] = item;
        return copy;
      }
      return [item, ...list];
    });
  }

  private removeResponsableLocal(id: string): void {
    this.responsables.update(list => list.filter(r => r.id !== id));
  }

  /**
   * Initialise le favicon depuis le stockage local (cache) pour un affichage immédiat
   */
  private initFaviconFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage && !this.isPublicBrandRoute()) {
        const cached = localStorage.getItem(FAVICON_STORAGE_KEY);
        if (cached) {
          this.setFaviconInDom(cached);
        }
      }
    } catch {
      // Ignore les erreurs d'accès à localStorage
    }
  }

  /**
   * Met à jour le favicon du navigateur selon le logo de la paroisse
   */
  public updateFavicon(iconUrl: string): void {
    if (!iconUrl || typeof document === 'undefined') return;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(FAVICON_STORAGE_KEY, iconUrl);
      }
    } catch {
      // Ignore les erreurs d'accès à localStorage
    }

    if (this.isPublicBrandRoute()) {
      return;
    }

    this.setFaviconInDom(iconUrl);
  }

  /**
   * Réinitialise le favicon au logo Cathéo CIM par défaut
   * (utilisé quand la paroisse connectée n'a pas de logo)
   */
  public resetFaviconToDefault(): void {
    this.clearFaviconCache();
    if (!this.isPublicBrandRoute()) {
      this.setFaviconInDom('logo/catheo.png');
    }
  }

  /**
   * Efface le favicon de la paroisse précédente du cache localStorage
   */
  public clearFaviconCache(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(FAVICON_STORAGE_KEY);
      }
    } catch {
      // Ignore les erreurs d'accès à localStorage
    }
  }

  private isPublicBrandRoute(): boolean {
    if (typeof window === 'undefined' || !window.location) {
      return false;
    }

    const path = window.location.pathname || '';
    return (
      path.startsWith('/auth') ||
      path.startsWith('/login') ||
      path.startsWith('/preinscription-publique') ||
      path.startsWith('/preinscriptions/campagne')
    );
  }

  private setFaviconInDom(iconUrl: string): void {
    if (typeof document === 'undefined') return;

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (iconUrl.endsWith('.svg') || iconUrl.startsWith('data:image/svg')) {
      link.type = 'image/svg+xml';
    } else if (iconUrl.endsWith('.png') || iconUrl.startsWith('data:image/png')) {
      link.type = 'image/png';
    } else if (iconUrl.endsWith('.jpg') || iconUrl.endsWith('.jpeg') || iconUrl.startsWith('data:image/jpeg')) {
      link.type = 'image/jpeg';
    } else if (iconUrl.endsWith('.webp') || iconUrl.startsWith('data:image/webp')) {
      link.type = 'image/webp';
    }

    link.href = iconUrl;
  }
}
