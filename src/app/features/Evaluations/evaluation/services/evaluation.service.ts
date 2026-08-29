import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { EvaluationDto, CreateEvaluationDto, UpdateEvaluationDto, EvaluationStatus } from '../models/evaluation.model';
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

function normalizeEvaluation(item: any): EvaluationDto {
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

  const isActif = item.statut === 'Actif' || item.statut === 'actif' || item.statut_code === 'actif' || item.est_actif === true || item.est_actif === 1 || item.status === 'Actif' || item.status === 'actif' || item.statut === undefined;

  const periodeLibelle = typeof item.periode === 'string'
    ? item.periode
    : (item.periode?.libelle || item.module_trimestriel?.libelle || 'Trimestre 1');

  const moduleTrimestriel = typeof item.periode === 'object' && item.periode !== null
    ? item.periode
    : (item.module_trimestriel || undefined);

  return {
    id: String(item.id || item.evaluation_id || ''),
    nom: item.nom || item.titre || item.libelle || 'Évaluation',
    titre: item.titre || item.nom || '',
    type: item.type || item.type_eval || 'Devoir',
    periode: periodeLibelle,
    module_trimestriel_id: item.module_trimestriel_id || item.module_trimestriel?.id || (typeof item.periode === 'object' ? item.periode?.id : '') || '',
    module_trimestriel: moduleTrimestriel,
    date: item.date || item.date_evaluation || (item.created_at ? item.created_at.substring(0, 10) : ''),
    date_evaluation: item.date_evaluation || item.date || '',
    coefficient: Number(item.coefficient) || 1,
    bareme: Number(item.bareme || item.note_max) || 20,
    statut: (isActif ? 'Actif' : 'Inactif') as EvaluationStatus,
    anneePastorale: item.anneePastorale || (item.annee_catechese ? (item.annee_catechese.libelle || `${item.annee_catechese.date_debut?.substring(0, 4)}-${item.annee_catechese.date_fin?.substring(0, 4)}`) : ''),
    annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id || '',
    annee_catechese: item.annee_catechese || undefined,
    classe_id: item.classe_id || item.classe?.id || '',
    classe: item.classe || undefined,
    section: item.section || undefined,
    niveau: item.niveau || undefined,
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

  constructor() {
    this.getAll().subscribe();
  }

  public getAll(filters?: {
    annee_catechese_id?: string;
    classe_id?: string;
    periode?: string;
    type?: string;
    statut?: string;
    search?: string;
  }): Observable<EvaluationDto[]> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (filters) {
      if (filters.annee_catechese_id) params = params.set('annee_catechese_id', filters.annee_catechese_id);
      if (filters.classe_id) params = params.set('classe_id', filters.classe_id);
      if (filters.periode && filters.periode !== 'toutes' && filters.periode !== 'tous') params = params.set('periode', filters.periode);
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

  public getById(id: string): Observable<EvaluationDto> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(res => normalizeEvaluation(res.data || res)),
      catchError(err => {
        this.toastService.error('Erreur', 'Impossible de charger les détails de l\'évaluation.');
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateEvaluationDto): Observable<EvaluationDto> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      map(res => normalizeEvaluation(res.data || res)),
      tap(created => {
        this.evaluations.update(list => [created, ...list]);
        this.isLoading.set(false);
        this.toastService.success('Succès', 'Évaluation enregistrée avec succès.');
      }),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Erreur lors de la création de l\'évaluation.');
        return throwError(() => err);
      })
    );
  }

  public update(id: string, dto: UpdateEvaluationDto): Observable<EvaluationDto> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      map(res => normalizeEvaluation(res.data || res)),
      tap(updated => {
        this.evaluations.update(list => list.map(item => (item.id === id ? updated : item)));
        this.isLoading.set(false);
        this.toastService.success('Succès', 'Évaluation mise à jour avec succès.');
      }),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Erreur lors de la mise à jour de l\'évaluation.');
        return throwError(() => err);
      })
    );
  }

  public toggleEvaluationStatut(id: string): Observable<EvaluationDto> {
    const current = this.evaluations().find(e => e.id === id);
    const nextStatus: EvaluationStatus = current?.statut === 'Actif' ? 'Inactif' : 'Actif';

    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, { statut: nextStatus, status: nextStatus }).pipe(
      map(res => normalizeEvaluation(res.data || res || { ...current, statut: nextStatus })),
      tap(updated => {
        this.evaluations.update(list => list.map(item => (item.id === id ? { ...item, statut: nextStatus } : item)));
        this.toastService.success('Statut', `Statut basculé en ${nextStatus}.`);
      }),
      catchError(err => {
        this.evaluations.update(list => list.map(item => (item.id === id ? { ...item, statut: nextStatus } : item)));
        this.toastService.info('Statut', `Statut basculé en ${nextStatus}.`);
        return throwError(() => err);
      })
    );
  }

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
        this.toastService.error('Erreur', 'Erreur lors de la suppression de l\'évaluation.');
        return throwError(() => err);
      })
    );
  }
}
