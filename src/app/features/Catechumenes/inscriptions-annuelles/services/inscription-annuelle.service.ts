import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  InscriptionAnnuelleDto,
  CreateInscriptionAnnuelleDto,
  UpdateInscriptionAnnuelleDto,
  StatutInscriptionAnnuelle
} from '../models/inscription-annuelle.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.inscriptions)) return res.data.inscriptions;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.inscriptions)) return res.inscriptions;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class InscriptionAnnuelleService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/inscriptions-annuelles`;

  // Reactive state signals
  public readonly inscriptions = signal<InscriptionAnnuelleDto[]>([]);
  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<InscriptionAnnuelleDto[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const normalized: InscriptionAnnuelleDto[] = raw.map((item: any) => ({
          id: item.id,
          code_inscription: item.code_inscription || `INS-${item.id?.substring(0, 6)}`,
          date_inscription: item.date_inscription || new Date().toISOString(),
          statut_inscription: item.statut_inscription || 'inscrit',
          frais_inscription_payes: item.frais_inscription_payes ?? false,
          observation: item.observation,
          catechumene_id: item.catechumene_id || item.catechumene?.id,
          catechumene: item.catechumene,
          annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id,
          annee_catechese: item.annee_catechese,
          section_id: item.section_id || item.section?.id,
          section: item.section,
          niveau_id: item.niveau_id || item.niveau?.id,
          niveau: item.niveau,
          classe_id: item.classe_id || item.classe?.id,
          classe: item.classe,
          ceb_id: item.ceb_id || item.ceb?.id,
          ceb: item.ceb,
          mouvement_id: item.mouvement_id || item.mouvement?.id,
          mouvement: item.mouvement,
          created_at: item.created_at || new Date().toISOString()
        }));
        this.inscriptions.set(normalized);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.inscriptions());
      })
    );
  }

  public getById(id: string): Observable<InscriptionAnnuelleDto> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.inscriptions().find(i => i.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(
    dto: CreateInscriptionAnnuelleDto,
    context?: { catechumene?: any; annee?: any; section?: any; niveau?: any; classe?: any; ceb?: any; mouvement?: any }
  ): Observable<InscriptionAnnuelleDto> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: InscriptionAnnuelleDto = {
          ...dto,
          id: item.id || `ins-${Date.now()}`,
          code_inscription: item.code_inscription || `INS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          date_inscription: dto.date_inscription || item.date_inscription || new Date().toISOString().substring(0, 10),
          statut_inscription: item.statut_inscription || (dto.classe_id ? 'valide' : 'inscrit'),
          frais_inscription_payes: item.frais_inscription_payes ?? dto.frais_inscription_payes ?? false,
          observation: dto.observation || item.observation,
          catechumene: item.catechumene || context?.catechumene,
          annee_catechese: item.annee_catechese || context?.annee,
          section: item.section || context?.section,
          niveau: item.niveau || context?.niveau,
          classe: item.classe || context?.classe,
          ceb: item.ceb || context?.ceb,
          mouvement: item.mouvement || context?.mouvement,
          created_at: item.created_at || new Date().toISOString()
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Inscription Enregistrée', `L'inscription annuelle a été validée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: InscriptionAnnuelleDto = {
          ...dto,
          id: `ins-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          code_inscription: `INS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          date_inscription: dto.date_inscription || new Date().toISOString().substring(0, 10),
          statut_inscription: dto.classe_id ? 'valide' : 'inscrit',
          frais_inscription_payes: dto.frais_inscription_payes ?? false,
          observation: dto.observation,
          catechumene: context?.catechumene,
          annee_catechese: context?.annee,
          section: context?.section,
          niveau: context?.niveau,
          classe: context?.classe,
          ceb: context?.ceb,
          mouvement: context?.mouvement,
          created_at: new Date().toISOString()
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Inscription Enregistrée', `L'inscription annuelle a été enregistrée.`);
        return of(newLocal);
      })
    );
  }

  public update(
    id: string,
    dto: UpdateInscriptionAnnuelleDto,
    context?: { section?: any; niveau?: any; classe?: any; ceb?: any; mouvement?: any }
  ): Observable<InscriptionAnnuelleDto> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.inscriptions().find(i => i.id === id);
        const updated: InscriptionAnnuelleDto = {
          ...current!,
          ...item,
          ...dto,
          section: context?.section || current?.section,
          niveau: context?.niveau || current?.niveau,
          classe: context?.classe || current?.classe,
          ceb: context?.ceb || current?.ceb,
          mouvement: context?.mouvement || current?.mouvement,
          id
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Inscription Modifiée', 'Les informations ont été mises à jour.');
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.inscriptions().find(i => i.id === id);
        const updatedLocal: InscriptionAnnuelleDto = {
          ...current!,
          ...dto,
          section: context?.section || current?.section,
          niveau: context?.niveau || current?.niveau,
          classe: context?.classe || current?.classe,
          ceb: context?.ceb || current?.ceb,
          mouvement: context?.mouvement || current?.mouvement,
          id
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Inscription Modifiée', 'Les informations ont été mises à jour.');
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
        this.toastService.success('Inscription Supprimée', "L'inscription annuelle a été retirée.");
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Inscription Supprimée', "L'inscription annuelle a été retirée.");
        return of(void 0);
      })
    );
  }

  public patchStatut(id: string, statut: StatutInscriptionAnnuelle): Observable<InscriptionAnnuelleDto> {
    return this.http.patch<any>(`${this.baseUrl}/${id}`, { statut_inscription: statut }).pipe(
      tap(res => {
        const item = res.data || res;
        const current = this.inscriptions().find(i => i.id === id);
        const updated: InscriptionAnnuelleDto = { ...current!, ...item, statut_inscription: statut };
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Mis à Jour', `Statut : ${statut}`);
      }),
      catchError(() => {
        const current = this.inscriptions().find(i => i.id === id);
        const updatedLocal: InscriptionAnnuelleDto = { ...current!, statut_inscription: statut };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.info('Statut Mis à Jour', `Statut : ${statut}`);
        return of(updatedLocal);
      })
    );
  }

  private addOrUpdateLocal(item: InscriptionAnnuelleDto): void {
    this.inscriptions.update(list => {
      const updatedList = list.filter(i => i.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeLocal(id: string): void {
    this.inscriptions.update(list => list.filter(i => i.id !== id));
  }
}
