import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import {
  PreinscriptionDto,
  SubmitPreinscriptionDto,
  UpdatePreinscriptionDto,
  ValiderPreinscriptionDto,
  RejeterPreinscriptionDto,
  StatutPreinscription,
  TypeDemandePreinscription
} from '../models/preinscription.model';
import { CampagnePreinscriptionDto } from '../../campagnes/models/campagne.model';
import { Section } from '../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../Organisations/Niveaux/models/niveau.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: unknown): Record<string, unknown>[] {
  const response = res as Record<string, any> | null | undefined;

  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response['data'])) return response['data'];
  if (response['data'] && Array.isArray(response['data']['data'])) return response['data']['data'];
  if (response['data'] && Array.isArray(response['data']['preinscriptions'])) return response['data']['preinscriptions'];
  if (response['data'] && Array.isArray(response['data']['items'])) return response['data']['items'];
  if (Array.isArray(response['preinscriptions'])) return response['preinscriptions'];
  if (Array.isArray(response['items'])) return response['items'];
  return [];
}

function extractItemData<T>(res: unknown): T {
  const response = res as Record<string, any> | null | undefined;

  if (!response) {
    return {} as T;
  }

  if (response['data']?.['preinscription']) {
    return response['data']['preinscription'] as T;
  }

  if (response['data']) {
    return response['data'] as T;
  }

  return response as T;
}

type PreinscriptionNormalizationContext = {
  fallback?: Partial<SubmitPreinscriptionDto | UpdatePreinscriptionDto | PreinscriptionDto>;
  campagne?: CampagnePreinscriptionDto;
  section?: Section;
  niveau?: NiveauDto;
  classe?: ClasseDto;
  current?: PreinscriptionDto | null;
};

@Injectable({
  providedIn: 'root'
})
export class PreinscriptionService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/preinscriptions`;

  public readonly preinscriptions = signal<PreinscriptionDto[]>([]);
  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<PreinscriptionDto[]> {
    this.isLoading.set(true);

    return this.http.get<unknown>(this.baseUrl).pipe(
      map(res => extractArrayData(res).map(item => this.normalizePreinscription(item))),
      tap(preinscriptions => {
        this.preinscriptions.set(preinscriptions);
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Chargement Impossible',
          this.buildErrorMessage(err, "Les préinscriptions n'ont pas pu être récupérées.")
        );
        return of(this.preinscriptions());
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public getById(id: string): Observable<PreinscriptionDto> {
    return this.http.get<unknown>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.normalizePreinscription(extractItemData(res))),
      tap(item => {
        this.addOrUpdateLocal(item);
      }),
      catchError((err: HttpErrorResponse) => {
        const found = this.preinscriptions().find(preinscription => preinscription.id === id);
        if (found) {
          return of(found);
        }

        this.toastService.error(
          'Dossier Introuvable',
          this.buildErrorMessage(err, 'La fiche de préinscription demandée est introuvable.')
        );
        return throwError(() => err);
      })
    );
  }

  public create(
    dto: SubmitPreinscriptionDto,
    campagne?: CampagnePreinscriptionDto,
    section?: Section,
    niveau?: NiveauDto
  ): Observable<PreinscriptionDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(this.baseUrl, dto).pipe(
      map(res =>
        this.normalizePreinscription(extractItemData(res), {
          fallback: dto,
          campagne,
          section,
          niveau
        })
      ),
      tap(created => {
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Préinscription Enregistrée',
          `Le dossier ${created.code_dossier} pour ${created.nom} ${created.prenoms} a été créé.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Enregistrement Impossible', "La préinscription n'a pas pu être enregistrée.")
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public update(id: string, dto: UpdatePreinscriptionDto): Observable<PreinscriptionDto> {
    this.isLoading.set(true);

    return this.http.put<unknown>(`${this.baseUrl}/${id}`, dto).pipe(
      map(res =>
        this.normalizePreinscription(extractItemData(res), {
          fallback: { ...dto, id } as Partial<PreinscriptionDto>,
          current: this.preinscriptions().find(preinscription => preinscription.id === id) || null
        })
      ),
      tap(updated => {
        this.addOrUpdateLocal(updated);
        this.toastService.success('Dossier Mis à Jour', `Le dossier ${updated.code_dossier} a été modifié.`);
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Mise à Jour Impossible', 'Le dossier de préinscription n\'a pas pu être modifié.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public valider(
    id: string,
    dto: ValiderPreinscriptionDto,
    niveau?: NiveauDto,
    classe?: ClasseDto
  ): Observable<PreinscriptionDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(`${this.baseUrl}/${id}/valider`, dto).pipe(
      map(res =>
        this.normalizePreinscription(extractItemData(res), {
          current: this.preinscriptions().find(preinscription => preinscription.id === id) || null,
          niveau,
          classe
        })
      ),
      tap(updated => {
        const normalized: PreinscriptionDto = {
          ...updated,
          statut: 'validee',
          niveau_souhaite_id: updated.niveau_souhaite_id || dto.niveau_id,
          niveau_souhaite: updated.niveau_souhaite || niveau,
          classe_affectee: updated.classe_affectee || classe,
          frais_payes: updated.frais_payes ?? dto.frais_payes ?? false,
          notes_validation: updated.notes_validation ?? dto.notes_validation
        };

        this.addOrUpdateLocal(normalized);
        this.toastService.success(
          'Préinscription Validée',
          `Le dossier ${normalized.code_dossier} a été validé.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Validation Impossible', 'La validation de la préinscription a échoué.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public rejeter(id: string, dto: RejeterPreinscriptionDto): Observable<PreinscriptionDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(`${this.baseUrl}/${id}/rejeter`, dto).pipe(
      map(res =>
        this.normalizePreinscription(extractItemData(res), {
          current: this.preinscriptions().find(preinscription => preinscription.id === id) || null
        })
      ),
      tap(updated => {
        const normalized: PreinscriptionDto = {
          ...updated,
          statut: 'rejetee',
          notes_validation: updated.notes_validation ?? dto.motif
        };

        this.addOrUpdateLocal(normalized);
        this.toastService.warning(
          'Préinscription Rejetée',
          `Le dossier ${normalized.code_dossier} a été rejeté.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Rejet Impossible', 'Le rejet de la préinscription a échoué.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public submitPublic(dto: SubmitPreinscriptionDto): Observable<PreinscriptionDto> {
    this.isLoading.set(true);
    const publicUrl = `${environment.apiUrl}/public/preinscriptions`;

    return this.http.post<unknown>(publicUrl, dto).pipe(
      map(res => this.normalizePreinscription(extractItemData(res), { fallback: dto })),
      tap(created => {
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Préinscription Transmise',
          `Votre demande de préinscription a été enregistrée avec succès sous le dossier ${created.code_dossier}.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Envoi Impossible', "Votre demande de préinscription n'a pas pu être transmise.")
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public updateStatus(id: string, statut: StatutPreinscription): Observable<PreinscriptionDto> {
    this.isLoading.set(true);

    return this.http.patch<unknown>(`${this.baseUrl}/${id}/statut`, { statut }).pipe(
      map(res =>
        this.normalizePreinscription(extractItemData(res), {
          current: this.preinscriptions().find(p => p.id === id) || null
        })
      ),
      tap(updated => {
        const normalized: PreinscriptionDto = { ...updated, statut };
        this.addOrUpdateLocal(normalized);
        this.toastService.info('Statut Modifié', `Le dossier ${normalized.code_dossier} est maintenant ${statut}.`);
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Mise à Jour Impossible', 'Le changement de statut a échoué.')
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
        this.toastService.success('Dossier Supprimé', 'Le dossier de préinscription a été supprimé.');
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Suppression Impossible',
          this.buildErrorMessage(err, 'Le dossier de préinscription n\'a pas pu être supprimé.')
        );
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private normalizePreinscription(
    rawItem: Record<string, unknown>,
    context: PreinscriptionNormalizationContext = {}
  ): PreinscriptionDto {
    const item = rawItem || {};
    const fallback = (context.fallback || {}) as Record<string, unknown>;
    const current = context.current || null;

    const campagneId = this.pickString(
      item['campagne_id'],
      fallback['campagne_id'],
      item['campagne'] && (item['campagne'] as Record<string, unknown>)['id'],
      context.campagne?.id,
      current?.campagne_id
    );
    const sectionId = this.pickString(
      item['section_souhaite_id'],
      item['section_id'],
      fallback['section_souhaite_id'],
      item['section_souhaite'] && (item['section_souhaite'] as Record<string, unknown>)['id'],
      item['section'] && (item['section'] as Record<string, unknown>)['id'],
      context.section?.id,
      current?.section_souhaite_id
    );
    const niveauId = this.pickString(
      item['niveau_souhaite_id'],
      item['niveau_id'],
      fallback['niveau_souhaite_id'],
      item['niveau_souhaite'] && (item['niveau_souhaite'] as Record<string, unknown>)['id'],
      item['niveau'] && (item['niveau'] as Record<string, unknown>)['id'],
      context.niveau?.id,
      current?.niveau_souhaite_id
    );

    return {
      id: this.pickString(item['id'], fallback['id'], current?.id) || '',
      code_dossier: this.pickString(item['code_dossier'], current?.code_dossier) || '',
      nom_complet: this.optionalString(item['nom_complet']) || current?.nom_complet,
      campagne_id: campagneId || '',
      type_demande: this.normalizeTypeDemande(item['type_demande'] ?? fallback['type_demande'] ?? current?.type_demande),
      nom: this.pickString(item['nom'], fallback['nom'], current?.nom) || '',
      prenoms: this.pickString(item['prenoms'], fallback['prenoms'], current?.prenoms) || '',
      sexe: this.normalizeSexe(item['sexe'] ?? fallback['sexe'] ?? current?.sexe),
      date_naissance: this.pickString(item['date_naissance'], fallback['date_naissance'], current?.date_naissance) || '',
      lieu_naissance: this.optionalString(item['lieu_naissance']) ?? (fallback['lieu_naissance'] as string | undefined) ?? current?.lieu_naissance,
      adresse: this.optionalString(item['adresse']) ?? (fallback['adresse'] as string | undefined) ?? current?.adresse,
      domicile: this.optionalString(item['domicile']) ?? (fallback['domicile'] as string | undefined) ?? current?.domicile,
      telephone: this.optionalString(item['telephone']) ?? (fallback['telephone'] as string | undefined) ?? current?.telephone,
      profession: this.optionalString(item['profession']) ?? (fallback['profession'] as string | undefined) ?? current?.profession,
      classe_scolaire: this.optionalString(item['classe_scolaire']) ?? (fallback['classe_scolaire'] as string | undefined) ?? current?.classe_scolaire,
      photo_url: this.optionalString(item['photo_url']) ?? this.optionalString(item['photo_path']) ?? (fallback['photo_url'] as string | undefined) ?? current?.photo_url,
      situation_matrimoniale: this.optionalString(item['situation_matrimoniale']) ?? (fallback['situation_matrimoniale'] as string | undefined) ?? current?.situation_matrimoniale,
      nom_pere: this.optionalString(item['nom_pere']) ?? (fallback['nom_pere'] as string | undefined) ?? current?.nom_pere,
      origine_pere: this.optionalString(item['origine_pere']) ?? (fallback['origine_pere'] as string | undefined) ?? current?.origine_pere,
      telephone_pere: this.optionalString(item['telephone_pere']) ?? (fallback['telephone_pere'] as string | undefined) ?? current?.telephone_pere,
      nom_mere: this.optionalString(item['nom_mere']) ?? (fallback['nom_mere'] as string | undefined) ?? current?.nom_mere,
      origine_mere: this.optionalString(item['origine_mere']) ?? (fallback['origine_mere'] as string | undefined) ?? current?.origine_mere,
      telephone_mere: this.optionalString(item['telephone_mere']) ?? (fallback['telephone_mere'] as string | undefined) ?? current?.telephone_mere,
      nom_tuteur: this.optionalString(item['nom_tuteur']) ?? (fallback['nom_tuteur'] as string | undefined) ?? current?.nom_tuteur,
      telephone_tuteur: this.optionalString(item['telephone_tuteur']) ?? (fallback['telephone_tuteur'] as string | undefined) ?? current?.telephone_tuteur,
      est_baptise: this.coerceBoolean(item['est_baptise'], (fallback['est_baptise'] as boolean | undefined) ?? current?.est_baptise ?? false),
      num_carnet_bapteme: this.optionalString(item['num_carnet_bapteme']) ?? (fallback['num_carnet_bapteme'] as string | undefined) ?? current?.num_carnet_bapteme,
      date_bapteme: this.optionalString(item['date_bapteme']) ?? (fallback['date_bapteme'] as string | undefined) ?? current?.date_bapteme,
      lieu_bapteme: this.optionalString(item['lieu_bapteme']) ?? (fallback['lieu_bapteme'] as string | undefined) ?? current?.lieu_bapteme,
      paroisse_bapteme: this.optionalString(item['paroisse_bapteme']) ?? (fallback['paroisse_bapteme'] as string | undefined) ?? current?.paroisse_bapteme,
      ville_bapteme: this.optionalString(item['ville_bapteme']) ?? (fallback['ville_bapteme'] as string | undefined) ?? current?.ville_bapteme,
      diocese_bapteme: this.optionalString(item['diocese_bapteme']) ?? (fallback['diocese_bapteme'] as string | undefined) ?? current?.diocese_bapteme,
      date_premiere_communion: this.optionalString(item['date_premiere_communion']) ?? (fallback['date_premiere_communion'] as string | undefined) ?? current?.date_premiere_communion,
      paroisse_premiere_communion: this.optionalString(item['paroisse_premiere_communion']) ?? (fallback['paroisse_premiere_communion'] as string | undefined) ?? current?.paroisse_premiere_communion,
      date_confirmation: this.optionalString(item['date_confirmation']) ?? (fallback['date_confirmation'] as string | undefined) ?? current?.date_confirmation,
      paroisse_confirmation: this.optionalString(item['paroisse_confirmation']) ?? (fallback['paroisse_confirmation'] as string | undefined) ?? current?.paroisse_confirmation,
      ministre_confirmation: this.optionalString(item['ministre_confirmation']) ?? (fallback['ministre_confirmation'] as string | undefined) ?? current?.ministre_confirmation,
      nom_parrain: this.optionalString(item['nom_parrain']) ?? (fallback['nom_parrain'] as string | undefined) ?? current?.nom_parrain,
      sexe_parrain: this.normalizeOptionalSexe(item['sexe_parrain'] ?? fallback['sexe_parrain'] ?? current?.sexe_parrain),
      telephone_parrain: this.optionalString(item['telephone_parrain']) ?? (fallback['telephone_parrain'] as string | undefined) ?? current?.telephone_parrain,
      section_souhaite_id: sectionId || '',
      section_souhaite: (item['section_souhaite'] as Section | undefined) || (item['section'] as Section | undefined) || context.section || current?.section_souhaite,
      niveau_souhaite_id: niveauId || '',
      niveau_souhaite: (item['niveau_souhaite'] as NiveauDto | undefined) || (item['niveau'] as NiveauDto | undefined) || context.niveau || current?.niveau_souhaite,
      campagne: (item['campagne'] as CampagnePreinscriptionDto | undefined) || context.campagne || current?.campagne,
      annee_catechese: (item['annee_catechese'] as PreinscriptionDto['annee_catechese']) || current?.annee_catechese,
      classe_affectee: (item['classe_affectee'] as ClasseDto | undefined) || (item['classe'] as ClasseDto | undefined) || context.classe || current?.classe_affectee,
      acte_naissance_url: this.optionalString(item['acte_naissance_url']) ?? current?.acte_naissance_url,
      statut: this.normalizeStatut(item['statut'] ?? current?.statut),
      notes_validation: this.optionalString(item['notes_validation']) ?? current?.notes_validation,
      frais_payes: this.coerceBoolean(item['frais_payes'], current?.frais_payes ?? false),
      created_at: this.optionalString(item['created_at']) ?? current?.created_at,
      updated_at: this.optionalString(item['updated_at']) ?? current?.updated_at
    };
  }

  private pickString(...values: unknown[]): string | undefined {
    for (const value of values) {
      const normalized = this.optionalString(value);
      if (normalized) {
        return normalized;
      }
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
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['1', 'true', 'oui', 'yes'].includes(normalized)) {
        return true;
      }
      if (['0', 'false', 'non', 'no'].includes(normalized)) {
        return false;
      }
    }

    return fallback;
  }

  private normalizeTypeDemande(value: unknown): TypeDemandePreinscription {
    if (value === 'nouvelle_inscription' || value === 'reinscription' || value === 'premiere_inscription') {
      return value;
    }

    return 'premiere_inscription';
  }

  private normalizeStatut(value: unknown): StatutPreinscription {
    if (value === 'validee' || value === 'rejetee' || value === 'en_attente') {
      return value;
    }

    return 'en_attente';
  }

  private normalizeSexe(value: unknown): 'M' | 'F' {
    return value === 'F' ? 'F' : 'M';
  }

  private normalizeOptionalSexe(value: unknown): 'M' | 'F' | undefined {
    if (value === 'F') {
      return 'F';
    }

    if (value === 'M') {
      return 'M';
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
    const apiMessage = err.error?.message;

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }

    return fallbackMessage;
  }

  private addOrUpdateLocal(item: PreinscriptionDto): void {
    this.preinscriptions.update(list => {
      const updatedList = list.filter(preinscription => preinscription.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeLocal(id: string): void {
    this.preinscriptions.update(list => list.filter(preinscription => preinscription.id !== id));
  }
}