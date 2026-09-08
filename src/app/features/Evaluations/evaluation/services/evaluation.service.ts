import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import {
  EvaluationDto,
  CreateEvaluationDto,
  UpdateEvaluationDto,
  EvaluationStatus,
  EvaluationFilters,
  NotesGridResponse,
  DetailNoteItemDto,
  SaveNotesBatchDto,
  ClasseMoyennesResponse,
  CatechumeneSyntheseResponse
} from '../models/evaluation.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.evaluations)) return res.data.evaluations;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.evaluations)) return res.evaluations;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

export function normalizeEvaluation(item: any): EvaluationDto {
  if (!item) {
    return {
      id: '',
      nom: '',
      type: 'Devoir',
      periode: 'Trimestre 1',
      date: '',
      coefficient: 1,
      bareme: 20,
      statut: 'Actif'
    };
  }

  const isActif =
    item.statut === 'Actif' ||
    item.statut === 'actif' ||
    item.statut_code === 'actif' ||
    item.est_actif === true ||
    item.est_actif === 1 ||
    item.status === 'Actif' ||
    item.status === 'actif' ||
    item.statut === undefined;

  const rawDate = item.date_evaluation || item.date || (item.created_at ? item.created_at.substring(0, 10) : '');
  const dateStr = typeof rawDate === 'string' ? rawDate.substring(0, 10) : '';

  const rawPeriode = item.periode;
  const periodeLibelle = typeof rawPeriode === 'string'
    ? rawPeriode
    : (rawPeriode?.libelle || item.module_trimestriel?.libelle || 'Trimestre 1');

  const moduleTrimestriel = typeof rawPeriode === 'object' && rawPeriode !== null
    ? rawPeriode
    : (item.module_trimestriel || undefined);

  return {
    id: String(item.id || item.uuid || item.evaluation_id || ''),
    nom: item.nom || item.titre || item.libelle || 'Évaluation',
    titre: item.titre || item.nom || '',
    type: item.type || item.type_eval || 'Devoir',
    type_eval: item.type_eval || item.type || 'Devoir',
    type_eval_code: item.type_eval_code || undefined,
    periode: periodeLibelle,
    module_trimestriel_id: item.module_trimestriel_id || item.module_trimestriel?.id || (typeof rawPeriode === 'object' ? rawPeriode?.id : '') || '',
    module_trimestriel: moduleTrimestriel,
    date: dateStr,
    date_evaluation: dateStr,
    coefficient: Number(item.coefficient) || 1,
    bareme: Number(item.bareme || item.note_max) || 20,
    note_max: Number(item.note_max || item.bareme) || 20,
    statut: (isActif ? 'Actif' : 'Inactif') as EvaluationStatus,
    statut_code: isActif ? 'actif' : 'inactif',
    anneePastorale: item.anneePastorale || (item.annee_catechese ? (item.annee_catechese.libelle || `${item.annee_catechese.date_debut?.substring(0, 4)}-${item.annee_catechese.date_fin?.substring(0, 4)}`) : ''),
    annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id || '',
    annee_catechese: item.annee_catechese || undefined,
    classe_id: item.classe_id || item.classe?.id || '',
    classe: item.classe || undefined,
    section: item.section || item.session || item.classe?.niveau?.section?.nom || undefined,
    section_id: item.section_id || item.classe?.niveau?.section_id || undefined,
    niveau: item.niveau || item.classe?.niveau?.nom || undefined,
    niveau_id: item.niveau_id || item.classe?.niveau_id || undefined,
    observation: item.observation || item.description || '',
    description: item.description || item.observation || '',
    stats: item.stats || undefined,
    notes: item.notes || [],
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/evaluations`;

  public readonly evaluations = signal<EvaluationDto[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSavingNotes = signal<boolean>(false);

  /**
   * 1. GET /api/v1/evaluations
   * Récupère la liste des évaluations selon filtres
   */
  public getAll(filters?: EvaluationFilters): Observable<EvaluationDto[]> {
    this.isLoading.set(true);
    let params = new HttpParams();

    if (filters) {
      if (filters.section_id) params = params.set('section_id', filters.section_id);
      if (filters.niveau_id) params = params.set('niveau_id', filters.niveau_id);
      if (filters.classe_id) params = params.set('classe_id', filters.classe_id);
      if (filters.annee_catechese_id) params = params.set('annee_catechese_id', filters.annee_catechese_id);
      if (filters.periode && filters.periode !== 'toutes' && filters.periode !== 'tous') {
        params = params.set('periode', filters.periode);
      }
      if (filters.type && filters.type !== 'tous') params = params.set('type', filters.type);
      if (filters.statut && filters.statut !== 'tous') params = params.set('statut', filters.statut);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(res => {
        const raw = extractArrayData(res);
        return raw.map(normalizeEvaluation);
      }),
      tap(list => {
        this.evaluations.set(list);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * 2. GET /api/v1/evaluations/{uuid}
   * Détail d'une évaluation
   */
  public getById(id: string): Observable<EvaluationDto> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => normalizeEvaluation(res.data || res)),
      catchError(err => {
        this.toastService.error('Erreur', 'Impossible de charger les détails de l\'évaluation.');
        return throwError(() => err);
      })
    );
  }

  /**
   * 3. POST /api/v1/evaluations
   * Création d'une évaluation
   */
  public create(dto: CreateEvaluationDto): Observable<EvaluationDto> {
    this.isLoading.set(true);

    const payload = {
      titre: dto.titre || dto.nom || 'Évaluation',
      date_evaluation: dto.date_evaluation || dto.date || new Date().toISOString().substring(0, 10),
      coefficient: Number(dto.coefficient) || 1,
      note_max: Number(dto.note_max || dto.bareme) || 20,
      type_eval: dto.type_eval || dto.type || 'Devoir',
      classe_id: dto.classe_id,
      annee_catechese_id: dto.annee_catechese_id,
      module_trimestriel_id: dto.module_trimestriel_id || null,
      periode: dto.periode || null,
      description: dto.description || dto.observation || null,
      statut: (dto.statut || 'actif').toLowerCase()
    };

    return this.http.post<any>(this.baseUrl, payload).pipe(
      map(res => normalizeEvaluation(res.data || res)),
      tap(created => {
        this.evaluations.update(list => [created, ...list]);
        this.isLoading.set(false);
        this.toastService.success('Succès', 'Évaluation créée avec succès.');
      }),
      catchError(err => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Erreur lors de la création de l\'évaluation.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * 4. PUT /api/v1/evaluations/{uuid}
   * Mise à jour d'une évaluation
   */
  public update(id: string, dto: UpdateEvaluationDto): Observable<EvaluationDto> {
    this.isLoading.set(true);

    const payload: any = {};
    if (dto.titre || dto.nom) payload.titre = dto.titre || dto.nom;
    if (dto.date_evaluation || dto.date) payload.date_evaluation = dto.date_evaluation || dto.date;
    if (dto.coefficient !== undefined) payload.coefficient = Number(dto.coefficient);
    if (dto.note_max !== undefined || dto.bareme !== undefined) payload.note_max = Number(dto.note_max || dto.bareme);
    if (dto.type_eval || dto.type) payload.type_eval = dto.type_eval || dto.type;
    if (dto.classe_id) payload.classe_id = dto.classe_id;
    if (dto.annee_catechese_id) payload.annee_catechese_id = dto.annee_catechese_id;
    if (dto.module_trimestriel_id !== undefined) payload.module_trimestriel_id = dto.module_trimestriel_id;
    if (dto.periode !== undefined) payload.periode = dto.periode;
    if (dto.description !== undefined || dto.observation !== undefined) payload.description = dto.description || dto.observation;
    if (dto.statut) payload.statut = dto.statut.toLowerCase();

    return this.http.put<any>(`${this.baseUrl}/${id}`, payload).pipe(
      map(res => normalizeEvaluation(res.data || res)),
      tap(updated => {
        this.evaluations.update(list => list.map(item => (item.id === id ? updated : item)));
        this.isLoading.set(false);
        this.toastService.success('Succès', 'Évaluation mise à jour avec succès.');
      }),
      catchError(err => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Erreur lors de la mise à jour de l\'évaluation.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * 5. PATCH /api/v1/evaluations/{uuid}/status
   * Bascule du statut actif/inactif
   */
  public toggleEvaluationStatut(id: string, forcedStatut?: 'actif' | 'inactif'): Observable<EvaluationDto> {
    const current = this.evaluations().find(e => e.id === id);
    const nextStatut: 'actif' | 'inactif' = forcedStatut
      ? forcedStatut
      : (current?.statut_code === 'actif' || current?.statut === 'Actif' ? 'inactif' : 'actif');

    const nextLabel: EvaluationStatus = nextStatut === 'actif' ? 'Actif' : 'Inactif';

    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, { statut: nextStatut }).pipe(
      map(res => normalizeEvaluation(res.data || res || { ...current, statut: nextLabel, statut_code: nextStatut })),
      tap(updated => {
        this.evaluations.update(list => list.map(item => (item.id === id ? updated : item)));
        this.toastService.success('Statut', `Évaluation passée en statut ${nextLabel}.`);
      }),
      catchError(err => {
        const msg = err?.error?.message || 'Erreur lors de la modification du statut.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * 6. DELETE /api/v1/evaluations/{uuid}
   * Suppression de l'évaluation
   */
  public deleteEvaluation(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<any>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.evaluations.update(list => list.filter(item => item.id !== id));
        this.isLoading.set(false);
        this.toastService.success('Suppression', 'Évaluation supprimée avec succès.');
      }),
      catchError(err => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Erreur lors de la suppression de l\'évaluation.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * 7. GET /api/v1/evaluations/{uuid}/notes-grid
   * Grille de saisie des notes pour les élèves de la classe
   */
  public getNotesGrid(uuid: string, search?: string): Observable<NotesGridResponse> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<any>(`${this.baseUrl}/${uuid}/notes-grid`, { params }).pipe(
      map(res => {
        const rawList = extractArrayData(res);
        const items = rawList.map(item => ({
          catechumene_id: String(item.catechumene_id || item.id || ''),
          matricule: item.matricule || item.code_catechumene || '',
          nom: item.nom || '',
          prenoms: item.prenoms || '',
          nom_prenoms: item.nom_prenoms || `${item.nom || ''} ${item.prenoms || ''}`.trim() || 'Élève',
          note_obtenue: item.note_obtenue !== null && item.note_obtenue !== undefined ? Number(item.note_obtenue) : null,
          note: item.note !== null && item.note !== undefined ? Number(item.note) : (item.note_obtenue !== null && item.note_obtenue !== undefined ? Number(item.note_obtenue) : null),
          appreciation: item.appreciation || '',
          note_id: item.note_id || null
        }));

        return {
          status: res.status || 'success',
          evaluation: res.evaluation ? normalizeEvaluation(res.evaluation) : undefined,
          data: items
        };
      }),
      catchError(err => {
        const msg = err?.error?.message || 'Erreur lors du chargement de la grille des notes.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * 8. GET /api/v1/evaluations/{uuid}/notes
   * Liste détaillée des notes d'une évaluation
   */
  public getNotes(uuid: string): Observable<DetailNoteItemDto[]> {
    return this.http.get<any>(`${this.baseUrl}/${uuid}/notes`).pipe(
      map(res => extractArrayData(res)),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  /**
   * 9. POST /api/v1/evaluations/{uuid}/notes
   * Enregistrement en lot des notes
   */
  public saveNotes(uuid: string, payload: SaveNotesBatchDto): Observable<any> {
    this.isSavingNotes.set(true);

    const formattedPayload = {
      notes: payload.notes.map(n => ({
        catechumene_id: n.catechumene_id,
        note_obtenue: n.note_obtenue !== undefined ? n.note_obtenue : (n.note !== undefined ? n.note : null),
        appreciation: n.appreciation || null
      }))
    };

    return this.http.post<any>(`${this.baseUrl}/${uuid}/notes`, formattedPayload).pipe(
      tap(() => {
        this.isSavingNotes.set(false);
        this.toastService.success('Succès', 'Les notes ont été enregistrées avec succès.');
      }),
      catchError(err => {
        this.isSavingNotes.set(false);
        const msg = err?.error?.message || 'Erreur lors de l\'enregistrement des notes.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * 10. GET /api/v1/evaluations/classes/{classe_uuid}/moyennes
   * Synthèse et moyennes de classe calculées par Laravel
   */
  public getClassAverages(classeUuid: string, anneeCatecheseId?: string, periode?: string): Observable<ClasseMoyennesResponse> {
    let params = new HttpParams();
    if (anneeCatecheseId) params = params.set('annee_catechese_id', anneeCatecheseId);
    if (periode && periode !== 'toutes' && periode !== 'all') params = params.set('periode', periode);

    return this.http.get<any>(`${this.baseUrl}/classes/${classeUuid}/moyennes`, { params }).pipe(
      map(res => {
        const payload = res.data || res;
        return {
          classe: payload.classe || { id: classeUuid, nom: 'Classe' },
          statistiques: payload.statistiques || {
            total_evaluations: 0,
            total_eleves: 0,
            eleves_evalues: 0,
            eleves_non_evalues: 0,
            moyenne_classe: null,
            meilleure_moyenne: null,
            plus_faible_moyenne: null
          },
          evaluations: payload.evaluations || [],
          eleves: payload.eleves || []
        };
      }),
      catchError(err => {
        const msg = err?.error?.message || 'Impossible de récupérer les moyennes de la classe.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * 11. GET /api/v1/evaluations/catechumenes/{catechumene_uuid}/synthese
   * Synthèse individuelle d'un catéchumène calculée par Laravel
   */
  public getCatechumeneSynthesis(catechumeneUuid: string, anneeCatecheseId?: string): Observable<CatechumeneSyntheseResponse> {
    let params = new HttpParams();
    if (anneeCatecheseId) params = params.set('annee_catechese_id', anneeCatecheseId);

    return this.http.get<any>(`${this.baseUrl}/catechumenes/${catechumeneUuid}/synthese`, { params }).pipe(
      map(res => res.data || res),
      catchError(err => {
        const msg = err?.error?.message || 'Impossible de récupérer la synthèse de l\'élève.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }

  /**
   * 12. POST /api/v1/evaluations/{uuid}/simuler
   * Outil de simulation de notes
   */
  public simulate(uuid: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${uuid}/simuler`, {}).pipe(
      tap(() => {
        this.toastService.info('Simulation', 'Notes de test simulées par le serveur.');
      }),
      catchError(err => {
        const msg = err?.error?.message || 'Erreur lors de la simulation.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }
}
