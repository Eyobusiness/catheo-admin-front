import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import { TarifDto, CreateTarifDto, UpdateTarifDto, TypeTarif } from '../models/tarif.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: unknown): Record<string, unknown>[] {
  const response = res as Record<string, any> | null | undefined;
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response['data'])) return response['data'];
  if (response['data'] && Array.isArray(response['data']['data'])) return response['data']['data'];
  if (response['data'] && Array.isArray(response['data']['tarifs'])) return response['data']['tarifs'];
  if (Array.isArray(response['tarifs'])) return response['tarifs'];
  return [];
}

function extractItemData<T>(res: unknown): T {
  const response = res as Record<string, any> | null | undefined;
  if (!response) return {} as T;
  if (response['data']?.['tarif']) return response['data']['tarif'] as T;
  if (response['data']) return response['data'] as T;
  return response as T;
}

@Injectable({
  providedIn: 'root'
})
export class TarifService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/tarifs`;

  public readonly tarifs = signal<TarifDto[]>([]);
  public readonly isLoading = signal<boolean>(false);

  public getAll(typeTarif?: TypeTarif): Observable<TarifDto[]> {
    this.isLoading.set(true);

    let params = new HttpParams();
    if (typeTarif) {
      params = params.set('type_tarif', typeTarif);
    }

    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(res => extractArrayData(res).map(item => this.normalizeTarif(item))),
      tap(tarifs => {
        this.tarifs.set(tarifs);
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Chargement Impossible',
          this.buildErrorMessage(err, 'La grille tarifaire n\'a pas pu être récupérée.')
        );
        return of(this.tarifs());
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public getById(id: string): Observable<TarifDto> {
    return this.http.get<unknown>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.normalizeTarif(extractItemData(res))),
      tap(item => {
        this.addOrUpdateLocal(item);
      }),
      catchError((err: HttpErrorResponse) => {
        const found = this.tarifs().find(t => t.id === id);
        if (found) return of(found);
        this.toastService.error(
          'Tarif Introuvable',
          this.buildErrorMessage(err, 'Le tarif demandé est introuvable.')
        );
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateTarifDto): Observable<TarifDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(this.baseUrl, dto).pipe(
      map(res => this.normalizeTarif(extractItemData(res), dto)),
      tap(created => {
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Tarif Enregistré',
          `Le tarif « ${created.intitule} » (${created.montant.toLocaleString('fr-FR')} FCFA) a été ajouté.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Création Impossible', 'Le tarif n\'a pas pu être créé.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public update(id: string, dto: UpdateTarifDto): Observable<TarifDto> {
    this.isLoading.set(true);

    return this.http.put<unknown>(`${this.baseUrl}/${id}`, dto).pipe(
      map(res =>
        this.normalizeTarif(extractItemData(res), {
          ...dto,
          id,
          ...this.tarifs().find(t => t.id === id)
        })
      ),
      tap(updated => {
        this.addOrUpdateLocal(updated);
        this.toastService.success('Tarif Mis à Jour', `Le tarif « ${updated.intitule} » a été modifié.`);
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Modification Impossible', 'Le tarif n\'a pas pu être modifié.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public toggleStatus(id: string): Observable<TarifDto> {
    this.isLoading.set(true);

    return this.http.patch<unknown>(`${this.baseUrl}/${id}/toggle-status`, {}).pipe(
      map(res => this.normalizeTarif(extractItemData(res), { id })),
      tap(updated => {
        this.addOrUpdateLocal(updated);
        const statutLabel = updated.statut === 'actif' ? 'activé' : 'désactivé';
        this.toastService.success('Statut Modifié', `Le tarif « ${updated.intitule} » a été ${statutLabel}.`);
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Action Impossible', 'Le statut du tarif n\'a pas pu être modifié.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public genererOperations(id: string): Observable<{ status: string; message: string; count: number; operations?: any[] }> {
    this.isLoading.set(true);

    return this.http.post<any>(`${this.baseUrl}/${id}/generer-operations`, {}).pipe(
      tap((res: any) => {
        const count = res?.count || res?.data?.count || 0;
        const msg = res?.message || `${count} opération(s) en attente ont été générées.`;
        this.toastService.success('Génération Réussie', msg);
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Génération Échouée', 'Impossible de générer les opérations de paiement pour ce tarif.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public delete(id: string): Observable<void> {
    this.isLoading.set(true);

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.removeLocal(id);
        this.toastService.success('Tarif Supprimé', 'Le tarif a été supprimé de la grille.');
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Suppression Impossible',
          this.buildErrorMessage(err, 'Le tarif n\'a pas pu être supprimé.')
        );
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private normalizeTarif(
    rawItem: Record<string, unknown>,
    fallback: Partial<TarifDto | CreateTarifDto | UpdateTarifDto> = {}
  ): TarifDto {
    const item = rawItem || {};
    const fb = fallback as Record<string, unknown>;

    const typeTarif = (this.pickString(item['type_tarif'], fb['type_tarif']) as TypeTarif) || 'autre';
    const rawNiveaux = (item['niveaux'] as any[]) || (fb['niveaux'] as any[]) || [];
    const niveauIds = Array.isArray(rawNiveaux) ? rawNiveaux.map(n => n.id || n.uuid).filter(Boolean) : (fb['niveau_ids'] as string[]) || [];

    return {
      id: this.pickString(item['id'], item['uuid'], fb['id']) || '',
      intitule: this.pickString(item['intitule'], item['libelle'], fb['intitule']) || 'Tarif',
      montant: typeof item['montant'] === 'number' ? item['montant'] : (typeof fb['montant'] === 'number' ? fb['montant'] : 0),
      type_tarif: typeTarif,
      description: this.optionalString(item['description']) ?? (fb['description'] as string | undefined),
      est_obligatoire: this.coerceBoolean(item['est_obligatoire'] ?? item['paiement_obligatoire'], (fb['est_obligatoire'] as boolean | undefined) ?? false),
      statut: (item['statut'] as TarifDto['statut']) || (fb['statut'] as TarifDto['statut']) || 'actif',
      annee_catechese_id: this.pickString(item['annee_catechese_id'], fb['annee_catechese_id']),
      annee_catechese: (item['annee_catechese'] as any) || (fb['annee_catechese'] as any),
      niveau_id: this.pickString(item['niveau_id'], fb['niveau_id']),
      niveau: (item['niveau'] as any) || (fb['niveau'] as any),
      niveaux: rawNiveaux,
      niveau_ids: niveauIds,
      created_at: this.optionalString(item['created_at']) ?? (fb['created_at'] as string | undefined),
      updated_at: this.optionalString(item['updated_at']) ?? (fb['updated_at'] as string | undefined)
    };
  }

  private pickString(...values: unknown[]): string | undefined {
    for (const val of values) {
      const normalized = this.optionalString(val);
      if (normalized) return normalized;
    }
    return undefined;
  }

  private optionalString(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || undefined;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return undefined;
  }

  private coerceBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['1', 'true', 'oui', 'yes'].includes(normalized)) return true;
      if (['0', 'false', 'non', 'no'].includes(normalized)) return false;
    }
    return fallback;
  }

  private handleWriteError(err: HttpErrorResponse, title: string, fallbackMessage: string): Observable<never> {
    this.toastService.error(title, this.buildErrorMessage(err, fallbackMessage));
    return throwError(() => err);
  }

  private buildErrorMessage(err: HttpErrorResponse, fallbackMessage: string): string {
    if (err.error?.errors && typeof err.error.errors === 'object') {
      const errorList = Object.entries(err.error.errors)
        .map(([field, msgs]) => {
          const detail = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          return `${field}: ${detail}`;
        })
        .join(' | ');
      if (errorList.trim()) return errorList;
    }

    const apiMessage = err.error?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
    return fallbackMessage;
  }

  private addOrUpdateLocal(item: TarifDto): void {
    this.tarifs.update(list => {
      const updatedList = list.filter(t => t.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeLocal(id: string): void {
    this.tarifs.update(list => list.filter(t => t.id !== id));
  }
}
