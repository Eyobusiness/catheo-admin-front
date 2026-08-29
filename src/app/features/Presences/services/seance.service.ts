import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import {
  SeanceDto,
  CreateSeanceDto,
  UpdateSeanceDto,
  RecordPresencesBatchDto,
  StatutSeance,
  StatutPresence
} from '../models/seance.model';
import { ClasseDto } from '../../Organisations/Classe/models/classe.model';
import { AnneeCatecheseDto } from '../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../environments/environment';

function extractArrayData(res: unknown): Record<string, unknown>[] {
  const response = res as Record<string, any> | null | undefined;
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response['data'])) return response['data'];
  if (response['data'] && Array.isArray(response['data']['data'])) return response['data']['data'];
  if (response['data'] && Array.isArray(response['data']['seances'])) return response['data']['seances'];
  if (response['data'] && Array.isArray(response['data']['items'])) return response['data']['items'];
  if (Array.isArray(response['seances'])) return response['seances'];
  if (Array.isArray(response['items'])) return response['items'];
  return [];
}

function extractItemData<T>(res: unknown): T {
  const response = res as Record<string, any> | null | undefined;
  if (!response) return {} as T;
  if (response['data']?.['seance']) return response['data']['seance'] as T;
  if (response['data']) return response['data'] as T;
  return response as T;
}

type SeanceNormalizationContext = {
  fallback?: Partial<CreateSeanceDto | UpdateSeanceDto | SeanceDto>;
  classe?: ClasseDto;
  annee?: AnneeCatecheseDto;
  current?: SeanceDto | null;
};

@Injectable({
  providedIn: 'root'
})
export class SeanceService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/seances`;

  public readonly seances = signal<SeanceDto[]>([]);
  public readonly isLoading = signal<boolean>(false);

  public getAll(classeId?: string): Observable<SeanceDto[]> {
    this.isLoading.set(true);

    let params = new HttpParams();
    if (classeId) {
      params = params.set('classe_id', classeId);
    }

    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(res => extractArrayData(res).map(item => this.normalizeSeance(item))),
      tap(seances => {
        this.seances.set(seances);
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Chargement Impossible',
          this.buildErrorMessage(err, 'Les séances de catéchèse n\'ont pas pu être chargées.')
        );
        return of(this.seances());
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public getById(id: string): Observable<SeanceDto> {
    return this.http.get<unknown>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.normalizeSeance(extractItemData(res))),
      tap(item => {
        this.addOrUpdateLocal(item);
      }),
      catchError((err: HttpErrorResponse) => {
        const found = this.seances().find(s => s.id === id);
        if (found) {
          return of(found);
        }
        this.toastService.error(
          'Séance Introuvable',
          this.buildErrorMessage(err, 'La séance de catéchèse demandée est introuvable.')
        );
        return throwError(() => err);
      })
    );
  }

  public create(
    dto: CreateSeanceDto,
    classe?: ClasseDto,
    annee?: AnneeCatecheseDto
  ): Observable<SeanceDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(this.baseUrl, dto).pipe(
      map(res =>
        this.normalizeSeance(extractItemData(res), {
          fallback: dto,
          classe,
          annee
        })
      ),
      tap(created => {
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Séance Créée',
          `La séance "${created.titre}" a été planifiée avec succès.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Création Impossible', 'La séance n\'a pas pu être créée.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public update(
    id: string,
    dto: UpdateSeanceDto,
    classe?: ClasseDto,
    annee?: AnneeCatecheseDto
  ): Observable<SeanceDto> {
    this.isLoading.set(true);

    return this.http.put<unknown>(`${this.baseUrl}/${id}`, dto).pipe(
      map(res =>
        this.normalizeSeance(extractItemData(res), {
          fallback: { ...dto, id } as Partial<SeanceDto>,
          classe,
          annee,
          current: this.seances().find(s => s.id === id) || null
        })
      ),
      tap(updated => {
        this.addOrUpdateLocal(updated);
        this.toastService.success('Séance Modifiée', `La séance "${updated.titre}" a été mise à jour.`);
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Modification Impossible', 'La séance n\'a pas pu être modifiée.')
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
        this.toastService.success('Séance Supprimée', 'La séance a été supprimée avec succès.');
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Suppression Impossible',
          this.buildErrorMessage(err, 'La séance n\'a pas pu être supprimée.')
        );
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public recordPresences(id: string, dto: RecordPresencesBatchDto): Observable<SeanceDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(`${this.baseUrl}/${id}/presences`, dto).pipe(
      map(res =>
        this.normalizeSeance(extractItemData(res), {
          current: this.seances().find(s => s.id === id) || null
        })
      ),
      tap(updated => {
        const total = dto.presences.length;
        const presents = dto.presences.filter(p => p.statut_presence === 'present').length;
        const absents = total - presents;

        const normalizedWithCounts: SeanceDto = {
          ...updated,
          statut: 'effectuee',
          total_presences: total,
          total_presents: presents,
          total_absents: absents,
          presences: dto.presences.map(p => ({
            catechumene_id: p.catechumene_id,
            statut_presence: p.statut_presence,
            est_present: p.statut_presence === 'present',
            remarque: p.remarque,
            motif_absence: p.remarque
          }))
        };

        this.addOrUpdateLocal(normalizedWithCounts);
        this.toastService.success(
          'Appel Enregistré',
          `Présences enregistrées : ${presents} présent(s), ${absents} absent(s) sur ${total} élèves.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Enregistrement Échoué', 'L\'appel des présences n\'a pas pu être enregistré.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private normalizeSeance(
    rawItem: Record<string, unknown>,
    context: SeanceNormalizationContext = {}
  ): SeanceDto {
    const item = rawItem || {};
    const fallback = (context.fallback || {}) as Record<string, unknown>;
    const current = context.current || null;

    const anneeId = this.pickString(
      item['annee_catechese_id'],
      fallback['annee_catechese_id'],
      item['annee_catechese'] && (item['annee_catechese'] as Record<string, unknown>)['id'],
      context.annee?.id,
      current?.annee_catechese_id
    );

    const classeId = this.pickString(
      item['classe_id'],
      fallback['classe_id'],
      item['classe'] && (item['classe'] as Record<string, unknown>)['id'],
      context.classe?.id,
      current?.classe_id
    );

    const titre = this.pickString(
      item['titre'],
      item['titre_lecon'],
      fallback['titre'],
      fallback['titre_lecon'],
      current?.titre,
      current?.titre_lecon
    ) || 'Séance de catéchèse';

    const heureDebut = this.pickString(item['heure_debut'], fallback['heure_debut'], current?.heure_debut) || '08:30';
    const heureFin = this.pickString(item['heure_fin'], fallback['heure_fin'], current?.heure_fin) || '10:00';

    const totalPresences = typeof item['total_presences'] === 'number'
      ? item['total_presences']
      : current?.total_presences ?? (Array.isArray(item['presences']) ? (item['presences'] as unknown[]).length : 0);

    const presences = Array.isArray(item['presences'])
      ? (item['presences'] as Record<string, unknown>[]).map(p => {
          const statutPresence = (p['statut_presence'] as StatutPresence) || (p['est_present'] === false ? 'absent' : 'present');
          return {
            id: this.optionalString(p['id']),
            catechumene_id: this.pickString(p['catechumene_id'], p['catechumene'] && (p['catechumene'] as Record<string, unknown>)['id']) || '',
            catechumene: (p['catechumene'] as any) || undefined,
            statut_presence: statutPresence,
            est_present: statutPresence === 'present',
            remarque: this.optionalString(p['remarque']) ?? this.optionalString(p['motif_absence']),
            motif_absence: this.optionalString(p['remarque']) ?? this.optionalString(p['motif_absence'])
          };
        })
      : current?.presences;

    const presentsCount = presences ? presences.filter(p => p.est_present).length : current?.total_presents;
    const absentsCount = presences ? presences.length - presentsCount! : current?.total_absents;

    return {
      id: this.pickString(item['id'], fallback['id'], current?.id) || '',
      titre,
      titre_lecon: titre,
      date_seance: this.pickString(item['date_seance'], item['date'], fallback['date_seance'], current?.date_seance) || new Date().toISOString().substring(0, 10),
      heure_debut: heureDebut,
      heure_fin: heureFin,
      duree_minutes: typeof item['duree_minutes'] === 'number' ? item['duree_minutes'] : current?.duree_minutes ?? 90,
      description: this.optionalString(item['description']) ?? (fallback['description'] as string | undefined) ?? current?.description,
      statut: (this.pickString(item['statut'], fallback['statut'], current?.statut) as StatutSeance) || 'planifiee',
      annee_catechese_id: anneeId || '',
      annee_catechese: (item['annee_catechese'] as any) || context.annee || current?.annee_catechese,
      classe_id: classeId || '',
      classe: (item['classe'] as ClasseDto | undefined) || context.classe || current?.classe,
      animateur_id: this.optionalString(item['animateur_id']) || current?.animateur_id,
      animateur: (item['animateur'] as SeanceDto['animateur']) || current?.animateur,
      total_presences: totalPresences,
      total_presents: typeof item['total_presents'] === 'number' ? item['total_presents'] : presentsCount,
      total_absents: typeof item['total_absents'] === 'number' ? item['total_absents'] : absentsCount,
      presences,
      created_at: this.optionalString(item['created_at']) ?? current?.created_at,
      updated_at: this.optionalString(item['updated_at']) ?? current?.updated_at
    };
  }

  private pickString(...values: unknown[]): string | undefined {
    for (const value of values) {
      const normalized = this.optionalString(value);
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

  private handleWriteError(
    err: HttpErrorResponse,
    title: string,
    fallbackMessage: string
  ): Observable<never> {
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

      if (errorList.trim()) {
        return errorList;
      }
    }

    const apiMessage = err.error?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
    return fallbackMessage;
  }

  private addOrUpdateLocal(item: SeanceDto): void {
    this.seances.update(list => {
      const updatedList = list.filter(s => s.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeLocal(id: string): void {
    this.seances.update(list => list.filter(s => s.id !== id));
  }
}
