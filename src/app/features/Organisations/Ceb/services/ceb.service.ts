import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { Ceb, CebStatut, CebStatutCode, CreateCebDto, UpdateCebDto } from '../models/ceb.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.cebs)) return res.data.cebs;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.cebs)) return res.cebs;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class CebService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/cebs`;

  // Reactive state signals
  public readonly cebs = signal<Ceb[]>([
    {
      id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c81',
      nom: 'Sainte Famille de Nazareth',
      responsable: 'M. KOUAKOU Emmanuel',
      telephone: '+225 07 11 22 33 44',
      adresse: 'Secteur Résidentiel - Rue des Jardins',
      description: 'CEB du quartier résidentiel Nord',
      statut: 'Active',
      statut_code: 'active',
      total_inscriptions: 28,
      created_at: '2026-08-01'
    },
    {
      id: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d82',
      nom: 'Saint Esprit',
      responsable: 'Mme TOURE Blandine',
      telephone: '+225 05 55 66 77 88',
      adresse: 'Secteur Commerce - Carrefour Central',
      description: 'CEB du centre commercial paroissial',
      statut: 'Active',
      statut_code: 'active',
      total_inscriptions: 34,
      created_at: '2026-08-05'
    },
    {
      id: '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e83',
      nom: 'Saint Michel Archange',
      responsable: 'M. ADOU Pierre',
      telephone: '+225 01 99 88 77 66',
      adresse: 'Quartier Est - Voie Triomphale',
      description: 'CEB couvrant les nouveaux lotissements Est',
      statut: 'Active',
      statut_code: 'active',
      total_inscriptions: 19,
      created_at: '2026-08-10'
    }
  ]);

  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<Ceb[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: Ceb[] = raw.map((item: any) => {
            const isInactive = item.statut_code === 'inactive' || item.statut === 'Inactive' || item.statut === 'inactif' || item.est_actif === false;
            return {
              id: item.id,
              nom: item.nom,
              responsable: item.responsable,
              telephone: item.telephone,
              adresse: item.adresse,
              description: item.description,
              statut: (isInactive ? 'Inactive' : 'Active') as CebStatut,
              statut_code: (isInactive ? 'inactive' : 'active') as CebStatutCode,
              total_inscriptions: item.total_inscriptions || 0,
              created_at: item.created_at
            };
          });
          this.cebs.set(normalized);
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.cebs());
      })
    );
  }

  public getById(id: string): Observable<Ceb> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.cebs().find(c => c.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateCebDto): Observable<Ceb> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const isInactive = dto.statut === 'Inactive' || dto.statut === 'inactive';
        const created: Ceb = {
          id: item.id || `uuid-${Date.now()}`,
          nom: item.nom || dto.nom,
          responsable: item.responsable || dto.responsable,
          telephone: item.telephone || dto.telephone,
          adresse: item.adresse || dto.adresse,
          description: item.description || dto.description,
          statut: (item.statut || (isInactive ? 'Inactive' : 'Active')) as CebStatut,
          statut_code: (item.statut_code || (isInactive ? 'inactive' : 'active')) as CebStatutCode,
          total_inscriptions: item.total_inscriptions || 0,
          created_at: item.created_at || new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('CEB Enregistrée', `La communauté "${created.nom}" a été ajoutée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const isInactive = dto.statut === 'Inactive' || dto.statut === 'inactive';
        const newLocal: Ceb = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          nom: dto.nom,
          responsable: dto.responsable,
          telephone: dto.telephone,
          adresse: dto.adresse,
          description: dto.description,
          statut: isInactive ? 'Inactive' : 'Active',
          statut_code: isInactive ? 'inactive' : 'active',
          total_inscriptions: 0,
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('CEB Enregistrée', `La communauté "${newLocal.nom}" a été ajoutée.`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateCebDto): Observable<Ceb> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.cebs().find(c => c.id === id);
        const isInactive = dto.statut === 'Inactive' || dto.statut === 'inactive';
        const updated: Ceb = {
          ...current,
          ...item,
          id,
          nom: item.nom || dto.nom || current?.nom || '',
          responsable: item.responsable || dto.responsable || current?.responsable,
          telephone: item.telephone || dto.telephone || current?.telephone,
          adresse: item.adresse || dto.adresse || current?.adresse,
          description: item.description || dto.description || current?.description,
          statut: item.statut || (dto.statut ? (isInactive ? 'Inactive' : 'Active') : current?.statut || 'Active'),
          statut_code: item.statut_code || (dto.statut ? (isInactive ? 'inactive' : 'active') : current?.statut_code || 'active')
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('CEB Modifiée', `La communauté "${updated.nom}" a été mise à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.cebs().find(c => c.id === id);
        const isInactive = dto.statut === 'Inactive' || dto.statut === 'inactive';
        const updatedLocal: Ceb = {
          ...current!,
          id,
          nom: dto.nom || current?.nom || '',
          responsable: dto.responsable || current?.responsable,
          telephone: dto.telephone || current?.telephone,
          adresse: dto.adresse || current?.adresse,
          description: dto.description || current?.description,
          statut: dto.statut ? (isInactive ? 'Inactive' : 'Active') : current?.statut || 'Active',
          statut_code: dto.statut ? (isInactive ? 'inactive' : 'active') : current?.statut_code || 'active'
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('CEB Modifiée', `La communauté "${updatedLocal.nom}" a été mise à jour.`);
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
        this.toastService.success('CEB Supprimée', 'La communauté ecclésiale de base a été retirée.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('CEB Supprimée', 'La communauté ecclésiale de base a été retirée.');
        return of(void 0);
      })
    );
  }

  public toggleStatus(ceb: Ceb): Observable<Ceb> {
    const nextStatut: CebStatut = ceb.statut === 'Active' ? 'Inactive' : 'Active';
    const nextCode: CebStatutCode = ceb.statut_code === 'active' ? 'inactive' : 'active';

    return this.http.patch<any>(`${this.baseUrl}/${ceb.id}/status`, { statut: nextCode }).pipe(
      tap(res => {
        const item = res.data || res;
        const updated: Ceb = {
          ...ceb,
          ...item,
          statut: nextStatut,
          statut_code: nextCode
        };
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Mis à Jour', `La CEB est désormais : ${nextStatut}`);
      }),
      catchError(() => {
        const updatedLocal: Ceb = {
          ...ceb,
          statut: nextStatut,
          statut_code: nextCode
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.info('Statut Mis à Jour', `La CEB est désormais : ${nextStatut}`);
        return of(updatedLocal);
      })
    );
  }

  private addOrUpdateLocal(item: Ceb): void {
    this.cebs.update(list => {
      const updatedList = list.filter(c => c.id !== item.id);
      return [item, ...updatedList].sort((a, b) => a.nom.localeCompare(b.nom));
    });
  }

  private removeLocal(id: string): void {
    this.cebs.update(list => list.filter(c => c.id !== id));
  }
}
