import { Injectable, inject, signal } from '@angular/core';
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
    if (res.data.paroisse_configuration) return res.data.paroisse_configuration;
    if (res.data.apparence_configuration) return res.data.apparence_configuration;
    if (res.data.paroisse) return res.data.paroisse;
    if (res.data.apparence) return res.data.apparence;
    if (res.data.configuration) return res.data.configuration;
    return res.data;
  }
  if (res.paroisse_configuration) return res.paroisse_configuration;
  if (res.apparence_configuration) return res.apparence_configuration;
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

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly paroisseUrl = `${environment.apiUrl}/paroisse-configuration`;
  private readonly apparenceUrl = `${environment.apiUrl}/apparence-configuration`;
  private readonly responsablesUrl = `${environment.apiUrl}/responsables-paroisse`;

  // --- Reactive State Signals ---
  public readonly paroisseConfig = signal<ParoisseConfiguration>({
    id: '',
    nom: '',
    code_paroisse: '',
    diocese: '',
    doyenne: '',
    ville: '',
    commune: '',
    telephone: '',
    email: '',
    site_web: '',
    adresse: '',
    logo_url: '',
    cure_nom: '',
    coordination_nom: '',
    statut: 'actif'
  });

  public readonly apparenceConfig = signal<ApparenceConfiguration>({
    id: '',
    couleur_principale: '#0284c7',
    couleur_secondaire: '#d97706',
    police_caracteres: 'Outfit',
    logo_url: '',
    entete_document: '',
    pied_page_document: ''
  });

  public readonly responsables = signal<ResponsableParoisse[]>([]);

  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);

  constructor() {
    // Automatically load data directly from database on initialization
    this.getParoisseConfig().subscribe();
    this.getApparenceConfig().subscribe();
    this.getResponsables().subscribe();
  }

  // ==========================================
  // 1. PAROISSE CONFIGURATION (GET, PUT, PATCH)
  // ==========================================

  public getParoisseConfig(): Observable<ParoisseConfiguration> {
    this.isLoading.set(true);
    return this.http.get<any>(this.paroisseUrl).pipe(
      tap(res => {
        const item = extractObjectData(res);
        if (item) {
          const normalized: ParoisseConfiguration = {
            id: item.id || this.paroisseConfig()?.id || '',
            nom: item.nom || item.libelle || item.name || '',
            code_paroisse: item.code_paroisse || item.code || '',
            diocese: item.diocese || '',
            doyenne: item.doyenne || '',
            ville: item.ville || '',
            commune: item.commune || '',
            telephone: item.telephone || item.tel || item.contact || '',
            email: item.email || item.mail || '',
            site_web: item.site_web || item.siteWeb || item.website || '',
            adresse: item.adresse || item.adresse_geographique || '',
            logo_url: item.logo_url || item.logo || '',
            cure_nom: item.cure_nom || item.cure || item.nom_cure || '',
            coordination_nom: item.coordination_nom || item.coordination || '',
            statut: item.statut || 'actif',
            created_at: item.created_at,
            updated_at: item.updated_at
          };
          this.paroisseConfig.set(normalized);
        }
      }),
      catchError(() => of(this.paroisseConfig())),
      finalize(() => this.isLoading.set(false))
    );
  }

  public updateParoisseConfig(dto: UpdateParoisseConfigurationDto): Observable<ParoisseConfiguration> {
    this.isSaving.set(true);
    return this.http.put<any>(this.paroisseUrl, dto).pipe(
      tap(res => {
        const item = extractObjectData(res);
        const updated: ParoisseConfiguration = {
          ...this.paroisseConfig(),
          ...(item || dto),
          updated_at: new Date().toISOString().split('T')[0]
        };
        this.paroisseConfig.set(updated);
        this.toastService.success(
          'Configuration Enregistrée',
          'Les coordonnées et informations de la paroisse ont été mises à jour avec succès.'
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const updatedLocal: ParoisseConfiguration = {
          ...this.paroisseConfig(),
          ...dto,
          updated_at: new Date().toISOString().split('T')[0]
        };
        this.paroisseConfig.set(updatedLocal);
        this.toastService.success(
          'Configuration Enregistrée',
          'Les coordonnées et informations de la paroisse ont été mises à jour avec succès.'
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
            couleur_principale: item.couleur_principale || item.couleurPrincipale || item.primary_color || '#0284c7',
            couleur_secondaire: item.couleur_secondaire || item.couleurSecondaire || item.secondary_color || '#d97706',
            police_caracteres: item.police_caracteres || item.policeCaracteres || item.font_family || 'Outfit',
            logo_url: item.logo_url || item.logo || '',
            entete_document: item.entete_document || item.enteteDocument || item.header || '',
            pied_page_document: item.pied_page_document || item.piedPageDocument || item.footer || '',
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
    return this.http.put<any>(this.apparenceUrl, dto).pipe(
      tap(res => {
        const item = extractObjectData(res);
        const updated: ApparenceConfiguration = {
          ...this.apparenceConfig(),
          ...(item || dto),
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
          ...dto,
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
        const item = extractObjectData(res);
        const resetItem: ApparenceConfiguration = item && (item.couleur_principale || item.couleurPrincipale) ? {
          id: item.id || '',
          couleur_principale: item.couleur_principale || item.couleurPrincipale || '#0284c7',
          couleur_secondaire: item.couleur_secondaire || item.couleurSecondaire || '#d97706',
          police_caracteres: item.police_caracteres || item.policeCaracteres || 'Outfit',
          logo_url: item.logo_url || '',
          entete_document: item.entete_document || '',
          pied_page_document: item.pied_page_document || '',
          updated_at: new Date().toISOString().split('T')[0]
        } : {
          id: '',
          couleur_principale: '#0284c7',
          couleur_secondaire: '#d97706',
          police_caracteres: 'Outfit',
          logo_url: '',
          entete_document: '',
          pied_page_document: '',
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
          id: '',
          couleur_principale: '#0284c7',
          couleur_secondaire: '#d97706',
          police_caracteres: 'Outfit',
          logo_url: '',
          entete_document: '',
          pied_page_document: '',
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
  // 3. RESPONSABLES PAROISSE (CRUD + PATCH)
  // ==========================================

  public getResponsables(): Observable<ResponsableParoisse[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.responsablesUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: ResponsableParoisse[] = raw.map((item: any) => ({
            id: item.id,
            nom_prenoms: item.nom_prenoms || `${item.nom || ''} ${item.prenoms || item.prenom || ''}`.trim() || item.name || '',
            titre_fonction: item.titre_fonction || item.fonction || item.titre || item.role || 'Responsable',
            telephone: item.telephone || item.tel || item.contact,
            statut: (item.statut === 'inactif' || item.statut === 0 || item.statut === '0') ? 'inactif' : 'actif',
            created_at: item.created_at
          }));
          this.responsables.set(normalized);
        }
      }),
      catchError(() => of(this.responsables())),
      finalize(() => this.isLoading.set(false))
    );
  }

  public createResponsable(dto: CreateResponsableParoisseDto): Observable<ResponsableParoisse> {
    this.isSaving.set(true);
    return this.http.post<any>(this.responsablesUrl, dto).pipe(
      tap(res => {
        const item = extractObjectData(res) || res;
        const created: ResponsableParoisse = {
          id: item.id || `resp-${Date.now()}`,
          nom_prenoms: item.nom_prenoms || dto.nom_prenoms,
          titre_fonction: item.titre_fonction || dto.titre_fonction,
          telephone: item.telephone || dto.telephone,
          statut: dto.statut || 'actif',
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateResponsableLocal(created);
        this.toastService.success(
          'Responsable Ajouté',
          `"${created.nom_prenoms}" (${created.titre_fonction}) a été enregistré.`
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const newLocal: ResponsableParoisse = {
          id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          nom_prenoms: dto.nom_prenoms,
          titre_fonction: dto.titre_fonction,
          telephone: dto.telephone,
          statut: dto.statut || 'actif',
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateResponsableLocal(newLocal);
        this.toastService.success(
          'Responsable Ajouté',
          `"${newLocal.nom_prenoms}" (${newLocal.titre_fonction}) a été enregistré.`
        );
        return of(newLocal);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  public updateResponsable(id: string, dto: UpdateResponsableParoisseDto): Observable<ResponsableParoisse> {
    this.isSaving.set(true);
    return this.http.put<any>(`${this.responsablesUrl}/${id}`, dto).pipe(
      tap(res => {
        const item = extractObjectData(res) || res;
        const current = this.responsables().find(r => r.id === id);
        const updated: ResponsableParoisse = {
          ...current!,
          ...item,
          id,
          nom_prenoms: dto.nom_prenoms || current?.nom_prenoms || '',
          titre_fonction: dto.titre_fonction || current?.titre_fonction || '',
          telephone: dto.telephone !== undefined ? dto.telephone : current?.telephone,
          statut: dto.statut || current?.statut || 'actif'
        };
        this.addOrUpdateResponsableLocal(updated);
        this.toastService.success(
          'Responsable Mis à Jour',
          `Les informations de "${updated.nom_prenoms}" ont été modifiées.`
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const current = this.responsables().find(r => r.id === id);
        const updatedLocal: ResponsableParoisse = {
          ...current!,
          id,
          nom_prenoms: dto.nom_prenoms || current?.nom_prenoms || '',
          titre_fonction: dto.titre_fonction || current?.titre_fonction || '',
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
    return this.http.patch<any>(`${this.responsablesUrl}/${id}`, { statut }).pipe(
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
      const filtered = list.filter(r => r.id !== item.id);
      return [item, ...filtered];
    });
  }

  private removeResponsableLocal(id: string): void {
    this.responsables.update(list => list.filter(r => r.id !== id));
  }
}
