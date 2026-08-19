import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  PreinscriptionDto,
  SubmitPreinscriptionDto,
  UpdatePreinscriptionDto,
  ValiderPreinscriptionDto,
  RejeterPreinscriptionDto,
  StatutPreinscription
} from '../models/preinscription.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.preinscriptions)) return res.data.preinscriptions;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.preinscriptions)) return res.preinscriptions;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class PreinscriptionService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/preinscriptions`;

  // Reactive state signals
  public readonly preinscriptions = signal<PreinscriptionDto[]>([]);
  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<PreinscriptionDto[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const normalized: PreinscriptionDto[] = raw.map((item: any) => ({
          id: item.id,
          code_dossier: item.code_dossier || `DOS-${item.id?.substring(0, 6)}`,
          type_demande: item.type_demande || 'premiere_inscription',
          nom: item.nom,
          prenoms: item.prenoms,
          nom_complet: item.nom_complet || `${item.nom} ${item.prenoms}`,
          sexe: item.sexe || 'M',
          date_naissance: item.date_naissance,
          lieu_naissance: item.lieu_naissance,
          adresse: item.adresse,
          telephone: item.telephone,
          photo_url: item.photo_url || item.photo_path,
          situation_matrimoniale: item.situation_matrimoniale,
          nom_pere: item.nom_pere,
          telephone_pere: item.telephone_pere,
          nom_mere: item.nom_mere,
          telephone_mere: item.telephone_mere,
          nom_tuteur: item.nom_tuteur,
          telephone_tuteur: item.telephone_tuteur,
          est_baptise: item.est_baptise ?? false,
          date_bapteme: item.date_bapteme,
          lieu_bapteme: item.lieu_bapteme,
          paroisse_bapteme: item.paroisse_bapteme,
          nom_parrain: item.nom_parrain,
          sexe_parrain: item.sexe_parrain,
          telephone_parrain: item.telephone_parrain,
          acte_naissance_url: item.acte_naissance_url,
          statut: item.statut || 'en_attente',
          notes_validation: item.notes_validation,
          campagne_id: item.campagne_id || item.campagne?.id,
          campagne: item.campagne,
          annee_catechese: item.annee_catechese,
          section_souhaite_id: item.section_souhaite_id || item.section_souhaite?.id || item.section_id,
          section_souhaite: item.section_souhaite || item.section,
          niveau_souhaite_id: item.niveau_souhaite_id || item.niveau_souhaite?.id || item.niveau_id,
          niveau_souhaite: item.niveau_souhaite || item.niveau,
          classe_affectee: item.classe_affectee || item.classe,
          frais_payes: item.frais_payes ?? false,
          created_at: item.created_at || new Date().toISOString()
        }));
        this.preinscriptions.set(normalized);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.preinscriptions());
      })
    );
  }

  public getById(id: string): Observable<PreinscriptionDto> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.preinscriptions().find(p => p.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: SubmitPreinscriptionDto, campagneObj?: any, sectionObj?: any, niveauObj?: any): Observable<PreinscriptionDto> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: PreinscriptionDto = {
          ...dto,
          id: item.id || `pre-${Date.now()}`,
          code_dossier: item.code_dossier || `DOS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          type_demande: dto.type_demande || 'premiere_inscription',
          sexe: dto.sexe || 'M',
          date_naissance: dto.date_naissance || '',
          est_baptise: dto.est_baptise ?? false,
          statut: item.statut || 'en_attente',
          campagne: campagneObj,
          section_souhaite: sectionObj,
          niveau_souhaite: niveauObj,
          created_at: item.created_at || new Date().toISOString()
        };
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Préinscription Enregistrée',
          `Le dossier ${created.code_dossier} pour ${created.nom} ${created.prenoms} a été créé.`
        );
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: PreinscriptionDto = {
          ...dto,
          id: `pre-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          code_dossier: `DOS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          type_demande: dto.type_demande || 'premiere_inscription',
          sexe: dto.sexe || 'M',
          date_naissance: dto.date_naissance || '',
          est_baptise: dto.est_baptise ?? false,
          statut: 'en_attente',
          campagne: campagneObj,
          section_souhaite: sectionObj,
          niveau_souhaite: niveauObj,
          created_at: new Date().toISOString()
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success(
          'Préinscription Enregistrée',
          `Le dossier ${newLocal.code_dossier} pour ${newLocal.nom} ${newLocal.prenoms} a été enregistré.`
        );
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdatePreinscriptionDto): Observable<PreinscriptionDto> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.preinscriptions().find(p => p.id === id);
        const updated: PreinscriptionDto = {
          ...current!,
          ...item,
          ...dto,
          id
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Dossier Mis à Jour', `Le dossier ${updated.code_dossier} a été modifié.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.preinscriptions().find(p => p.id === id);
        const updatedLocal: PreinscriptionDto = {
          ...current!,
          ...dto,
          id
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Dossier Mis à Jour', `Le dossier ${updatedLocal.code_dossier} a été modifié.`);
        return of(updatedLocal);
      })
    );
  }

  public valider(id: string, dto: ValiderPreinscriptionDto, niveauObj?: any, classeObj?: any): Observable<PreinscriptionDto> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/${id}/valider`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const current = this.preinscriptions().find(p => p.id === id);
        const nextStatut: StatutPreinscription = 'validee';
        const updated: PreinscriptionDto = {
          ...current!,
          statut: nextStatut,
          niveau_souhaite_id: dto.niveau_id,
          niveau_souhaite: niveauObj || current?.niveau_souhaite,
          frais_payes: dto.frais_payes ?? current?.frais_payes ?? true,
          notes_validation: dto.notes_validation
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success(
          'Préinscription Validée',
          `Le dossier ${updated.code_dossier} a été validé.`
        );
      }),
      catchError(() => {
        this.isLoading.set(false);
        const current = this.preinscriptions().find(p => p.id === id);
        const nextStatut: StatutPreinscription = 'validee';
        const updatedLocal: PreinscriptionDto = {
          ...current!,
          statut: nextStatut,
          niveau_souhaite_id: dto.niveau_id,
          niveau_souhaite: niveauObj || current?.niveau_souhaite,
          frais_payes: dto.frais_payes ?? current?.frais_payes ?? true,
          notes_validation: dto.notes_validation
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success(
          'Préinscription Validée',
          `Le dossier ${updatedLocal.code_dossier} a été validé.`
        );
        return of(updatedLocal);
      })
    );
  }

  public rejeter(id: string, dto: RejeterPreinscriptionDto): Observable<PreinscriptionDto> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/${id}/rejeter`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const current = this.preinscriptions().find(p => p.id === id);
        const updated: PreinscriptionDto = {
          ...current!,
          statut: 'rejetee',
          notes_validation: dto.motif
        };
        this.addOrUpdateLocal(updated);
        this.toastService.warning(
          'Préinscription Rejetée',
          `Le dossier ${updated.code_dossier} a été rejeté.`
        );
      }),
      catchError(() => {
        this.isLoading.set(false);
        const current = this.preinscriptions().find(p => p.id === id);
        const updatedLocal: PreinscriptionDto = {
          ...current!,
          statut: 'rejetee',
          notes_validation: dto.motif
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.warning(
          'Préinscription Rejetée',
          `Le dossier ${updatedLocal.code_dossier} a été rejeté.`
        );
        return of(updatedLocal);
      })
    );
  }

  public delete(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Dossier Supprimé', 'Le dossier de préinscription a été supprimé.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Dossier Supprimé', 'Le dossier de préinscription a été supprimé.');
        return of(void 0);
      })
    );
  }

  private addOrUpdateLocal(item: PreinscriptionDto): void {
    this.preinscriptions.update(list => {
      const updatedList = list.filter(p => p.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeLocal(id: string): void {
    this.preinscriptions.update(list => list.filter(p => p.id !== id));
  }
}
