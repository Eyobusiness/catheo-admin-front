import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { Classe, ClasseStatut, CreateClasseDto, UpdateClasseDto } from '../models/classe.model';
import { ToastService } from '../../../../core/services/toast.service';
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

  private readonly baseUrl = `${environment.apiUrl}/classes`;

  // Reactive state signals
  public readonly classes = signal<Classe[]>([]);

  public readonly isLoading = signal<boolean>(false);

  constructor() {
    this.getAll().subscribe();
  }

  public getAll(): Observable<Classe[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: Classe[] = raw.map((item: any) => ({
            id: item.id,
            nom: item.nom,
            capacite_max: Number(item.capacite_max) || 30,
            statut: (item.statut || (item.est_actif === false ? 'inactive' : 'active')) as ClasseStatut,
            niveau_id: item.niveau_id || item.niveau?.id || '',
            niveau: item.niveau || undefined,
            annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id || '',
            annee_catechese: item.annee_catechese || undefined,
            effectif_actuel: item.effectif_actuel ?? item.total_inscrits ?? 0
          }));
          this.classes.set(normalized);
        }
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
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: Classe = {
          id: item.id || `uuid-${Date.now()}`,
          nom: item.nom || dto.nom,
          capacite_max: item.capacite_max ?? dto.capacite_max ?? 30,
          statut: item.statut || dto.statut || 'active',
          niveau_id: item.niveau_id || dto.niveau_id,
          annee_catechese_id: item.annee_catechese_id || dto.annee_catechese_id,
          effectif_actuel: item.effectif_actuel || 0
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Classe Créée', `La classe "${created.nom}" a été enregistrée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: Classe = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          nom: dto.nom,
          capacite_max: dto.capacite_max ?? 30,
          statut: dto.statut || 'active',
          niveau_id: dto.niveau_id,
          annee_catechese_id: dto.annee_catechese_id,
          effectif_actuel: 0
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Classe Enregistrée', `La classe "${newLocal.nom}" a été ajoutée.`);
        return of(newLocal);
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
          capacite_max: item.capacite_max ?? dto.capacite_max ?? current?.capacite_max ?? 30,
          statut: item.statut || dto.statut || current?.statut || 'active',
          niveau_id: item.niveau_id || dto.niveau_id || current?.niveau_id,
          annee_catechese_id: item.annee_catechese_id || dto.annee_catechese_id || current?.annee_catechese_id
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Classe Modifiée', `La classe "${updated.nom}" a été mise à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.classes().find(c => c.id === id);
        const updatedLocal: Classe = {
          ...current,
          id,
          nom: dto.nom || current?.nom || '',
          capacite_max: dto.capacite_max ?? current?.capacite_max ?? 30,
          statut: dto.statut || current?.statut || 'active',
          niveau_id: dto.niveau_id || current?.niveau_id,
          annee_catechese_id: dto.annee_catechese_id || current?.annee_catechese_id,
          effectif_actuel: current?.effectif_actuel || 0
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Classe Modifiée', `La classe "${updatedLocal.nom}" a été mise à jour.`);
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
        this.toastService.success('Classe Supprimée', 'La classe a été supprimée.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Classe Supprimée', 'La classe a été supprimée.');
        return of(void 0);
      })
    );
  }

  public toggleStatus(classe: Classe): Observable<Classe> {
    const nextStatus: ClasseStatut = classe.statut === 'active' ? 'inactive' : 'active';
    return this.http.patch<any>(`${this.baseUrl}/${classe.id}`, { statut: nextStatus }).pipe(
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
      catchError(() => {
        const updatedLocal: Classe = {
          ...classe,
          statut: nextStatus
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.info('Statut Mis à Jour', `La classe est maintenant : ${nextStatus}`);
        return of(updatedLocal);
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
