import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { Classe, ClasseStatut, CreateClasseDto, UpdateClasseDto } from '../models/classe.model';
import { ToastService } from '../../../../core/services/toast.service';
import { AnneeCatecheseService } from '../../AnneesPastorales/services/annee-catechese.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.classes)) return res.data.classes;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.classes)) return res.classes;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class ClasseService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly anneeService = inject(AnneeCatecheseService);

  private readonly baseUrl = `${environment.apiUrl}/classes`;

  // Reactive state signals
  public readonly classes = signal<Classe[]>([]);

  public readonly isLoading = signal<boolean>(false);

  constructor() {
    this.getAll().subscribe();
  }

  public getAll(params?: { annee_catechese_id?: string; all?: boolean; search?: string; per_page?: number }): Observable<Classe[]> {
    this.isLoading.set(true);

    let queryParams: Record<string, string> = {
      all: 'true',
      per_page: '500'
    };

    if (params) {
      if (params.annee_catechese_id) queryParams['annee_catechese_id'] = params.annee_catechese_id;
      if (params.all !== undefined) queryParams['all'] = String(params.all);
      if (params.search) queryParams['search'] = params.search;
      if (params.per_page) queryParams['per_page'] = String(params.per_page);
    }

    return this.http.get<any>(this.baseUrl, { params: queryParams }).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const normalized: Classe[] = raw.map((item: any) => ({
          id: item.id,
          nom: item.nom,
          capacite_max: Number(item.capacite_max) || 30,
          statut: (item.statut || (item.est_actif === false ? 'inactive' : 'active')) as ClasseStatut,
          niveau_id: item.niveau_id || item.niveau?.id || '',
          niveau: item.niveau || undefined,
          niveau_nom: item.niveau?.nom || '',
          annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id || '',
          annee_catechese: item.annee_catechese || undefined,
          effectif_actuel: item.effectif_actuel ?? item.total_inscrits ?? 0
        }));
        this.classes.set(normalized);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.classes());
      })
    );
  }

  public getById(id: string): Observable<Classe> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.classes().find(c => c.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateClasseDto): Observable<Classe> {
    this.isLoading.set(true);

    const activeAnneeId = dto.annee_catechese_id 
      || this.anneeService.activeAnnee()?.id 
      || (typeof window !== 'undefined' ? localStorage.getItem('catheo_working_annee_id') : undefined);

    const payload: CreateClasseDto = {
      ...dto,
      ...(activeAnneeId ? { annee_catechese_id: activeAnneeId } : {})
    };

    return this.http.post<any>(this.baseUrl, payload).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: Classe = {
          id: item.id || `uuid-${Date.now()}`,
          nom: item.nom || dto.nom,
          capacite_max: Number(item.capacite_max) || Number(dto.capacite_max) || 30,
          statut: item.statut || dto.statut || 'active',
          niveau_id: item.niveau_id || item.niveau?.id || dto.niveau_id,
          niveau: item.niveau,
          niveau_nom: item.niveau?.nom || '',
          annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id || payload.annee_catechese_id,
          annee_catechese: item.annee_catechese,
          effectif_actuel: item.effectif_actuel || 0
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Classe Créée', `La classe "${created.nom}" a été enregistrée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const serverRaw = (
          err.error?.message ||
          err.error?.error ||
          (err.error?.errors ? Object.values(err.error.errors).flat().join(' ') : '') ||
          ''
        ).toLowerCase();

        const isDuplicate =
          serverRaw.includes('existe déjà') ||
          serverRaw.includes('already exists') ||
          serverRaw.includes('classes_paroisse_annee_niveau_nom_unique') ||
          serverRaw.includes('duplicate entry') ||
          serverRaw.includes('1062 duplicate') ||
          err.status === 409;

        if (isDuplicate) {
          this.toastService.warning('Attention', 'Cette classe existe déjà.');
        } else {
          const errorMsg =
            err.error?.message ||
            err.error?.error ||
            (err.error?.errors ? Object.values(err.error.errors).flat().join(' ') : null) ||
            'Impossible d\'enregistrer la classe.';
          this.toastService.error('Erreur', errorMsg);
        }
        return throwError(() => err);
      })
    );
  }

  public update(id: string, dto: UpdateClasseDto): Observable<Classe> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.classes().find(c => c.id === id);
        const updated: Classe = {
          ...current,
          ...item,
          id,
          nom: item.nom || dto.nom || current?.nom || '',
          capacite_max: Number(item.capacite_max) || Number(dto.capacite_max) || current?.capacite_max || 30,
          statut: item.statut || dto.statut || current?.statut || 'active',
          niveau_id: item.niveau_id || item.niveau?.id || dto.niveau_id || current?.niveau_id,
          niveau: item.niveau || current?.niveau,
          niveau_nom: item.niveau?.nom || current?.niveau_nom || '',
          annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id || dto.annee_catechese_id || current?.annee_catechese_id,
          annee_catechese: item.annee_catechese || current?.annee_catechese
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Classe Modifiée', `La classe "${updated.nom}" a été mise à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const serverRaw = (
          err.error?.message ||
          err.error?.error ||
          (err.error?.errors ? Object.values(err.error.errors).flat().join(' ') : '') ||
          ''
        ).toLowerCase();

        const isDuplicate =
          serverRaw.includes('existe déjà') ||
          serverRaw.includes('already exists') ||
          serverRaw.includes('classes_paroisse_annee_niveau_nom_unique') ||
          serverRaw.includes('duplicate entry') ||
          serverRaw.includes('1062 duplicate') ||
          err.status === 409;

        if (isDuplicate) {
          this.toastService.warning('Attention', 'Cette classe existe déjà.');
        } else {
          const errorMsg =
            err.error?.message ||
            err.error?.error ||
            (err.error?.errors ? Object.values(err.error.errors).flat().join(' ') : null) ||
            'Impossible de modifier la classe.';
          this.toastService.error('Erreur', errorMsg);
        }
        return throwError(() => err);
      })
    );
  }

  public delete(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Classe Supprimée', 'La classe a été supprimée.');
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const errorMsg =
          err.error?.message ||
          err.error?.error ||
          'Impossible de supprimer la classe.';
        this.toastService.error('Erreur', errorMsg);
        return throwError(() => err);
      })
    );
  }

  public toggleStatus(classe: Classe): Observable<Classe> {
    const nextStatus: ClasseStatut = classe.statut === 'active' ? 'inactive' : 'active';
    return this.http.patch<any>(`${this.baseUrl}/${classe.id}/status`, { statut: nextStatus }).pipe(
      tap(res => {
        const item = res.data || res;
        const updated: Classe = {
          ...classe,
          ...item,
          statut: nextStatus
        };
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Mis à Jour', `La classe est maintenant : ${nextStatus}`);
      }),
      catchError((err: HttpErrorResponse) => {
        const errorMsg =
          err.error?.message ||
          err.error?.error ||
          'Impossible de modifier le statut de la classe.';
        this.toastService.error('Erreur', errorMsg);
        return throwError(() => err);
      })
    );
  }

  private addOrUpdateLocal(item: Classe): void {
    this.classes.update(list => {
      const updatedList = list.filter(c => c.id !== item.id);
      return [...updatedList, item].sort((a, b) => a.nom.localeCompare(b.nom));
    });
  }

  private removeLocal(id: string): void {
    this.classes.update(list => list.filter(c => c.id !== id));
  }
}
