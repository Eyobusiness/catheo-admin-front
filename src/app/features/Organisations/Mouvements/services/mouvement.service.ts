import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  CreateMouvementDto,
  Mouvement,
  MouvementStatut,
  MouvementStatutCode,
  UpdateMouvementDto
} from '../models/mouvement.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.mouvements)) return res.data.mouvements;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.mouvements)) return res.mouvements;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class MouvementService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/mouvements`;

  // Reactive state signals
  public readonly mouvements = signal<Mouvement[]>([]);

  public readonly isLoading = signal<boolean>(false);

  constructor() {
    this.getAll().subscribe();
  }

  public getAll(): Observable<Mouvement[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: Mouvement[] = raw.map((item: any) => {
            const isInactive =
              item.statut_code === 'inactive' ||
              item.statut === 'Inactive' ||
              item.statut === 'inactif' ||
              item.est_actif === false;
            return {
              id: item.id,
              nom: item.nom,
              responsable: item.responsable,
              telephone: item.telephone,
              description: item.description,
              statut: (isInactive ? 'Inactive' : 'Active') as MouvementStatut,
              statut_code: (isInactive ? 'inactive' : 'active') as MouvementStatutCode,
              total_inscriptions: item.total_inscriptions || 0,
              created_at: item.created_at
            };
          });
          this.mouvements.set(normalized);
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.mouvements());
      })
    );
  }

  public getById(id: string): Observable<Mouvement> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.mouvements().find(m => m.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateMouvementDto): Observable<Mouvement> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const isInactive = dto.statut === 'Inactive' || dto.statut === 'inactive';
        const created: Mouvement = {
          id: item.id || `uuid-${Date.now()}`,
          nom: item.nom || dto.nom,
          responsable: item.responsable || dto.responsable,
          telephone: item.telephone || dto.telephone,
          description: item.description || dto.description,
          statut: (item.statut || (isInactive ? 'Inactive' : 'Active')) as MouvementStatut,
          statut_code: (item.statut_code || (isInactive ? 'inactive' : 'active')) as MouvementStatutCode,
          total_inscriptions: item.total_inscriptions || 0,
          created_at: item.created_at || new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Mouvement Enregistré', `Le mouvement "${created.nom}" a été ajouté.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const isInactive = dto.statut === 'Inactive' || dto.statut === 'inactive';
        const newLocal: Mouvement = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          nom: dto.nom,
          responsable: dto.responsable,
          telephone: dto.telephone,
          description: dto.description,
          statut: isInactive ? 'Inactive' : 'Active',
          statut_code: isInactive ? 'inactive' : 'active',
          total_inscriptions: 0,
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Mouvement Enregistré', `Le mouvement "${newLocal.nom}" a été ajouté.`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateMouvementDto): Observable<Mouvement> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.mouvements().find(m => m.id === id);
        const isInactive = dto.statut === 'Inactive' || dto.statut === 'inactive';
        const updated: Mouvement = {
          ...current,
          ...item,
          id,
          nom: item.nom || dto.nom || current?.nom || '',
          responsable: item.responsable || dto.responsable || current?.responsable,
          telephone: item.telephone || dto.telephone || current?.telephone,
          description: item.description || dto.description || current?.description,
          statut: item.statut || (dto.statut ? (isInactive ? 'Inactive' : 'Active') : current?.statut || 'Active'),
          statut_code: item.statut_code || (dto.statut ? (isInactive ? 'inactive' : 'active') : current?.statut_code || 'active')
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Mouvement Modifié', `Le mouvement "${updated.nom}" a été mis à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.mouvements().find(m => m.id === id);
        const isInactive = dto.statut === 'Inactive' || dto.statut === 'inactive';
        const updatedLocal: Mouvement = {
          ...current!,
          id,
          nom: dto.nom || current?.nom || '',
          responsable: dto.responsable || current?.responsable,
          telephone: dto.telephone || current?.telephone,
          description: dto.description || current?.description,
          statut: dto.statut ? (isInactive ? 'Inactive' : 'Active') : current?.statut || 'Active',
          statut_code: dto.statut ? (isInactive ? 'inactive' : 'active') : current?.statut_code || 'active'
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Mouvement Modifié', `Le mouvement "${updatedLocal.nom}" a été mis à jour.`);
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
        this.toastService.success('Mouvement Supprimé', 'Le mouvement paroissial a été retiré.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Mouvement Supprimé', 'Le mouvement paroissial a été retiré.');
        return of(void 0);
      })
    );
  }

  public toggleStatus(mouvement: Mouvement): Observable<Mouvement> {
    const nextStatut: MouvementStatut = mouvement.statut === 'Active' ? 'Inactive' : 'Active';
    const nextCode: MouvementStatutCode = mouvement.statut_code === 'active' ? 'inactive' : 'active';

    return this.http.patch<any>(`${this.baseUrl}/${mouvement.id}/status`, { statut: nextCode }).pipe(
      tap(res => {
        const item = res.data || res;
        const updated: Mouvement = {
          ...mouvement,
          ...item,
          statut: nextStatut,
          statut_code: nextCode
        };
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Mis à Jour', `Le mouvement est désormais : ${nextStatut}`);
      }),
      catchError(() => {
        const updatedLocal: Mouvement = {
          ...mouvement,
          statut: nextStatut,
          statut_code: nextCode
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.info('Statut Mis à Jour', `Le mouvement est désormais : ${nextStatut}`);
        return of(updatedLocal);
      })
    );
  }

  private addOrUpdateLocal(item: Mouvement): void {
    this.mouvements.update(list => {
      const updatedList = list.filter(m => m.id !== item.id);
      return [item, ...updatedList].sort((a, b) => a.nom.localeCompare(b.nom));
    });
  }

  private removeLocal(id: string): void {
    this.mouvements.update(list => list.filter(m => m.id !== id));
  }
}
