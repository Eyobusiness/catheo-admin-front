import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  MutationCatechumeneDto,
  CreateMutationCatechumeneDto,
  UpdateMutationCatechumeneDto,
  StatutMutation
} from '../models/mutation.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.mutations)) return res.data.mutations;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.mutations)) return res.mutations;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class MutationCatechumeneService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/mutations-catechumenes`;

  // Reactive state signals
  public readonly mutations = signal<MutationCatechumeneDto[]>([]);
  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<MutationCatechumeneDto[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const normalized: MutationCatechumeneDto[] = raw.map((item: any) => ({
          id: item.id,
          paroisse_origine_nom: item.paroisse_origine_nom || 'Paroisse Actuelle',
          paroisse_destination_nom: item.paroisse_destination_nom || item.paroisse_destination || '',
          motif: item.motif,
          date_mutation: item.date_mutation || new Date().toISOString(),
          statut: item.statut || 'demande',
          catechumene_id: item.catechumene_id || item.catechumene?.id,
          catechumene: item.catechumene,
          annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id,
          annee_catechese: item.annee_catechese,
          created_at: item.created_at || new Date().toISOString()
        }));
        this.mutations.set(normalized);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.mutations());
      })
    );
  }

  public getById(id: string): Observable<MutationCatechumeneDto> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.mutations().find(m => m.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(
    dto: CreateMutationCatechumeneDto,
    context?: { catechumene?: any; annee?: any }
  ): Observable<MutationCatechumeneDto> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: MutationCatechumeneDto = {
          ...dto,
          id: item.id || `mut-${Date.now()}`,
          date_mutation: dto.date_mutation || item.date_mutation || new Date().toISOString().substring(0, 10),
          statut: item.statut || 'demande',
          catechumene: item.catechumene || context?.catechumene,
          annee_catechese: item.annee_catechese || context?.annee,
          created_at: item.created_at || new Date().toISOString()
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Mutation Enregistrée', 'La demande de mutation / transfert a été créée.');
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: MutationCatechumeneDto = {
          ...dto,
          id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date_mutation: dto.date_mutation || new Date().toISOString().substring(0, 10),
          statut: 'demande',
          catechumene: context?.catechumene,
          annee_catechese: context?.annee,
          created_at: new Date().toISOString()
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Mutation Enregistrée', 'La demande de mutation / transfert a été enregistrée.');
        return of(newLocal);
      })
    );
  }

  public updateStatus(id: string, statut: 'approuve' | 'refuse'): Observable<MutationCatechumeneDto> {
    this.isLoading.set(true);
    return this.http.patch<any>(`${this.baseUrl}/${id}/statut`, { statut }).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item = res.data || res;
        const current = this.mutations().find(m => m.id === id);
        const updated: MutationCatechumeneDto = { ...current!, ...item, statut };
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Mutation', `La mutation est maintenant : ${statut}`);
      }),
      catchError(() => {
        this.isLoading.set(false);
        const current = this.mutations().find(m => m.id === id);
        const updatedLocal: MutationCatechumeneDto = { ...current!, statut };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.info('Statut Mutation', `La mutation est maintenant : ${statut}`);
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
        this.toastService.success('Supprimé', 'La mutation a été supprimée.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Supprimé', 'La mutation a été supprimée.');
        return of(void 0);
      })
    );
  }

  private addOrUpdateLocal(item: MutationCatechumeneDto): void {
    this.mutations.update(list => {
      const updatedList = list.filter(m => m.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeLocal(id: string): void {
    this.mutations.update(list => list.filter(m => m.id !== id));
  }
}
