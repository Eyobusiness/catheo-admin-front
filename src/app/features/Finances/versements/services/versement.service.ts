import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import {
  VersementCureDto,
  VersementKpisDto,
  CreateVersementDto,
  UpdateVersementDto,
  StatutVersement,
  ModeRemise
} from '../models/versement.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: unknown): Record<string, unknown>[] {
  const response = res as Record<string, any> | null | undefined;
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response['data'])) return response['data'];
  if (response['data'] && Array.isArray(response['data']['data'])) return response['data']['data'];
  if (response['data'] && Array.isArray(response['data']['versements'])) return response['data']['versements'];
  if (Array.isArray(response['versements'])) return response['versements'];
  return [];
}

function extractItemData<T>(res: unknown): T {
  const response = res as Record<string, any> | null | undefined;
  if (!response) return {} as T;
  if (response['data']?.['versement']) return response['data']['versement'] as T;
  if (response['data']) return response['data'] as T;
  return response as T;
}

@Injectable({
  providedIn: 'root'
})
export class VersementCureService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/versements`;

  public readonly versements = signal<VersementCureDto[]>([]);
  public readonly kpis = signal<VersementKpisDto>({
    total_en_caisse: 0,
    total_deja_verse: 0,
    reste_a_reverser: 0
  });
  public readonly isLoading = signal<boolean>(false);

  public getAll(statut?: StatutVersement, search?: string): Observable<VersementCureDto[]> {
    this.isLoading.set(true);

    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    if (search) params = params.set('search', search);

    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(res => {
        const response = res as Record<string, any> | null | undefined;
        if (response && response['kpis']) {
          const k = response['kpis'];
          this.kpis.set({
            total_en_caisse: typeof k['total_en_caisse'] === 'number' ? k['total_en_caisse'] : 0,
            total_deja_verse: typeof k['total_deja_verse'] === 'number' ? k['total_deja_verse'] : 0,
            reste_a_reverser: typeof k['reste_a_reverser'] === 'number' ? k['reste_a_reverser'] : 0
          });
        }
        return extractArrayData(res).map(item => this.normalizeVersement(item));
      }),
      tap(versements => {
        this.versements.set(versements);
        this.recalculateLocalKpis(versements);
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Chargement Impossible',
          this.buildErrorMessage(err, 'Les versements paroissiaux n\'ont pas pu être récupérés.')
        );
        return of(this.versements());
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public getById(id: string): Observable<VersementCureDto> {
    return this.http.get<unknown>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.normalizeVersement(extractItemData(res))),
      tap(item => {
        this.addOrUpdateLocal(item);
      }),
      catchError((err: HttpErrorResponse) => {
        const found = this.versements().find(v => v.id === id);
        if (found) return of(found);
        this.toastService.error(
          'Versement Introuvable',
          this.buildErrorMessage(err, 'Le versement demandé est introuvable.')
        );
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateVersementDto): Observable<VersementCureDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(this.baseUrl, dto).pipe(
      map(res => this.normalizeVersement(extractItemData(res), dto)),
      tap(created => {
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Versement Enregistré',
          `Le versement ${created.reference} (${created.montant_verse.toLocaleString('fr-FR')} FCFA) pour « ${created.periode_concernee} » a été enregistré.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Enregistrement Impossible', 'Le versement n\'a pas pu être enregistré.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public update(id: string, dto: UpdateVersementDto): Observable<VersementCureDto> {
    this.isLoading.set(true);

    return this.http.put<unknown>(`${this.baseUrl}/${id}`, dto).pipe(
      map(res =>
        this.normalizeVersement(extractItemData(res), {
          ...dto,
          id,
          ...this.versements().find(v => v.id === id)
        })
      ),
      tap(updated => {
        this.addOrUpdateLocal(updated);
        this.toastService.success('Versement Modifié', `Le versement ${updated.reference} a été mis à jour.`);
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Modification Impossible', 'Le versement n\'a pas pu être modifié.')
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
        this.toastService.success('Versement Supprimé', 'Le versement a été supprimé.');
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Suppression Impossible',
          this.buildErrorMessage(err, 'Le versement n\'a pas pu être supprimé.')
        );
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private normalizeVersement(
    rawItem: Record<string, unknown>,
    fallback: Partial<VersementCureDto | CreateVersementDto | UpdateVersementDto> = {}
  ): VersementCureDto {
    const item = rawItem || {};
    const fb = fallback as Record<string, unknown>;

    const modeRemise = (this.pickString(item['mode_remise'], fb['mode_remise']) as ModeRemise) || 'especes';
    const statut = (this.pickString(item['statut'], fb['statut']) as StatutVersement) || 'valide';
    const montant = typeof item['montant_verse'] === 'number' ? item['montant_verse'] : (typeof fb['montant_verse'] === 'number' ? fb['montant_verse'] : 0);

    return {
      id: this.pickString(item['id'], item['uuid'], fb['id']) || '',
      reference: this.pickString(item['reference'], fb['reference']) || 'VRS-AUTO',
      periode_concernee: this.pickString(item['periode_concernee'], fb['periode_concernee']) || 'Période en cours',
      montant_verse: montant,
      mode_remise: modeRemise,
      destinataire: this.optionalString(item['destinataire']) ?? (fb['destinataire'] as string | undefined),
      notes: this.optionalString(item['notes']) ?? (fb['notes'] as string | undefined),
      effectue_par: this.optionalString(item['effectue_par']) ?? (fb['effectue_par'] as string | undefined),
      statut,
      annee_catechese_id: this.pickString(item['annee_catechese_id'], fb['annee_catechese_id']),
      annee_libelle: this.pickString(item['annee_libelle'], fb['annee_libelle']),
      user: (item['user'] as any) || (fb['user'] as any),
      created_at: this.optionalString(item['created_at']) ?? (fb['created_at'] as string | undefined),
      updated_at: this.optionalString(item['updated_at']) ?? (fb['updated_at'] as string | undefined)
    };
  }

  private recalculateLocalKpis(list: VersementCureDto[]): void {
    const totalVerse = list
      .filter(v => v.statut === 'valide')
      .reduce((sum, v) => sum + v.montant_verse, 0);

    this.kpis.update(current => {
      const enCaisse = current.total_en_caisse;
      const reste = Math.max(0, enCaisse - totalVerse);
      return {
        total_en_caisse: enCaisse,
        total_deja_verse: current.total_deja_verse || totalVerse,
        reste_a_reverser: current.reste_a_reverser || reste
      };
    });
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

  private addOrUpdateLocal(item: VersementCureDto): void {
    this.versements.update(list => {
      const updatedList = list.filter(v => v.id !== item.id);
      return [item, ...updatedList];
    });
    this.recalculateLocalKpis(this.versements());
  }

  private removeLocal(id: string): void {
    this.versements.update(list => list.filter(v => v.id !== id));
    this.recalculateLocalKpis(this.versements());
  }
}
