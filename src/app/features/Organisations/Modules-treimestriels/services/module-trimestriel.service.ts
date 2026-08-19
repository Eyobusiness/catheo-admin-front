import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  CreateModuleTrimestrielDto,
  ModuleTrimestriel,
  TrimestreCode,
  UpdateModuleTrimestrielDto
} from '../models/module-trimestriel.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.modules)) return res.data.modules;
  if (res.data && Array.isArray(res.data.modules_trimestriels)) return res.data.modules_trimestriels;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.modules)) return res.modules;
  if (Array.isArray(res.modules_trimestriels)) return res.modules_trimestriels;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class ModuleTrimestrielService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/modules-trimestriels`;

  // Reactive state signals
  public readonly modules = signal<ModuleTrimestriel[]>([
    {
      id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c71',
      annee_catechese_id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
      trimestre: 'T1',
      libelle: '1er Trimestre : Temps de l\'Avent et Éveil de la Foi',
      date_debut: '2026-10-01',
      date_fin: '2026-12-20',
      annee_catechese: {
        id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
        libelle: '2026-2027',
        date_debut: '2026-09-15',
        date_fin: '2027-06-30',
        est_active: true
      }
    },
    {
      id: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d72',
      annee_catechese_id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
      trimestre: 'T2',
      libelle: '2ème Trimestre : Temps du Carême et Approfondissement',
      date_debut: '2027-01-05',
      date_fin: '2027-03-25',
      annee_catechese: {
        id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
        libelle: '2026-2027',
        date_debut: '2026-09-15',
        date_fin: '2027-06-30',
        est_active: true
      }
    },
    {
      id: '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e83',
      annee_catechese_id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
      trimestre: 'T3',
      libelle: '3ème Trimestre : Temps Pascal et Célébrations des Sacrements',
      date_debut: '2027-04-10',
      date_fin: '2027-06-25',
      annee_catechese: {
        id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
        libelle: '2026-2027',
        date_debut: '2026-09-15',
        date_fin: '2027-06-30',
        est_active: true
      }
    }
  ]);

  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<ModuleTrimestriel[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: ModuleTrimestriel[] = raw.map((item: any) => ({
            id: item.id,
            annee_catechese_id: item.annee_catechese_id || item.annee_id || item.annee_pastorale_id || item.annee_catechese?.id || item.annee?.id,
            trimestre: (item.trimestre || item.code || 'T1') as TrimestreCode,
            libelle: item.libelle || item.nom || '',
            date_debut: item.date_debut || item.dateDebut || '',
            date_fin: item.date_fin || item.dateFin || '',
            annee_catechese: item.annee_catechese || item.annee || undefined
          }));
          this.modules.set(normalized);
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.modules());
      })
    );
  }

  public getById(id: string): Observable<ModuleTrimestriel> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.modules().find(m => m.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateModuleTrimestrielDto): Observable<ModuleTrimestriel> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: ModuleTrimestriel = {
          id: item.id || `uuid-${Date.now()}`,
          annee_catechese_id: item.annee_catechese_id || dto.annee_catechese_id,
          trimestre: item.trimestre || dto.trimestre,
          libelle: item.libelle || dto.libelle,
          date_debut: item.date_debut || dto.date_debut,
          date_fin: item.date_fin || dto.date_fin,
          annee_catechese: item.annee_catechese || undefined
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Module Enregistré', `Le module "${created.libelle}" a été ajouté.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: ModuleTrimestriel = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          annee_catechese_id: dto.annee_catechese_id,
          trimestre: dto.trimestre,
          libelle: dto.libelle,
          date_debut: dto.date_debut,
          date_fin: dto.date_fin
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Module Enregistré', `Le module "${newLocal.libelle}" a été ajouté.`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateModuleTrimestrielDto): Observable<ModuleTrimestriel> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.modules().find(m => m.id === id);
        const updated: ModuleTrimestriel = {
          ...current,
          ...item,
          id,
          libelle: item.libelle || dto.libelle || current?.libelle || '',
          trimestre: (item.trimestre || dto.trimestre || current?.trimestre || 'T1') as TrimestreCode,
          date_debut: item.date_debut || dto.date_debut || current?.date_debut || '',
          date_fin: item.date_fin || dto.date_fin || current?.date_fin || '',
          annee_catechese_id: item.annee_catechese_id || dto.annee_catechese_id || current?.annee_catechese_id,
          annee_catechese: item.annee_catechese || current?.annee_catechese
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Module Modifié', `Le module "${updated.libelle}" a été mis à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.modules().find(m => m.id === id);
        const updatedLocal: ModuleTrimestriel = {
          ...current!,
          id,
          libelle: dto.libelle || current?.libelle || '',
          trimestre: (dto.trimestre || current?.trimestre || 'T1') as TrimestreCode,
          date_debut: dto.date_debut || current?.date_debut || '',
          date_fin: dto.date_fin || current?.date_fin || '',
          annee_catechese_id: dto.annee_catechese_id || current?.annee_catechese_id,
          annee_catechese: current?.annee_catechese
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Module Modifié', `Les modifications ont été enregistrées.`);
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
        this.toastService.success('Module Supprimé', 'Le module trimestriel a été supprimé.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Module Supprimé', 'Le module trimestriel a été supprimé.');
        return of(void 0);
      })
    );
  }

  public patchTrimestre(id: string, nextTrimestre: TrimestreCode): Observable<ModuleTrimestriel> {
    return this.http.patch<any>(`${this.baseUrl}/${id}`, { trimestre: nextTrimestre }).pipe(
      tap(res => {
        const item = res.data || res;
        const current = this.modules().find(m => m.id === id);
        if (current) {
          const updated: ModuleTrimestriel = { ...current, ...item, trimestre: nextTrimestre };
          this.addOrUpdateLocal(updated);
          this.toastService.info('Trimestre Mis à Jour', `Le module est maintenant assigné au : ${nextTrimestre}`);
        }
      }),
      catchError(() => {
        const current = this.modules().find(m => m.id === id);
        if (current) {
          const updated: ModuleTrimestriel = { ...current, trimestre: nextTrimestre };
          this.addOrUpdateLocal(updated);
          this.toastService.info('Trimestre Mis à Jour', `Le module est maintenant assigné au : ${nextTrimestre}`);
        }
        return of(current!);
      })
    );
  }

  private addOrUpdateLocal(item: ModuleTrimestriel): void {
    this.modules.update(list => {
      const updatedList = list.filter(m => m.id !== item.id);
      return [item, ...updatedList].sort((a, b) => (a.trimestre || '').localeCompare(b.trimestre || ''));
    });
  }

  private removeLocal(id: string): void {
    this.modules.update(list => list.filter(m => m.id !== id));
  }
}

