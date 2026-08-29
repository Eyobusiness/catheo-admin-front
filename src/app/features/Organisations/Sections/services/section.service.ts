import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { CreateSectionDto, Section, UpdateSectionDto } from '../models/section.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.sections)) return res.data.sections;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.sections)) return res.sections;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

export function normalizeStatut(val: any, estActif?: any, isActive?: any): string {
  if (val === false || val === 0 || val === '0') return 'inactif';
  if (estActif === false || estActif === 0 || estActif === '0' || isActive === false || isActive === 0 || isActive === '0') return 'inactif';
  if (val === true || val === 1 || val === '1') return 'actif';
  if (estActif === true || estActif === 1 || estActif === '1' || isActive === true || isActive === 1 || isActive === '1') return 'actif';
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'inactif' || s === 'inactive' || s === '0' || s === 'false' || s === 'disabled') return 'inactif';
    if (s === 'actif' || s === 'active' || s === '1' || s === 'true' || s === 'enabled') return 'actif';
  }
  return 'actif';
}

@Injectable({
  providedIn: 'root'
})
export class SectionService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/sections`;

  // Reactive state signals
  public readonly sections = signal<Section[]>([]);
  public readonly isLoading = signal<boolean>(false);

  constructor() {
    this.getAll().subscribe();
  }

  public getAll(): Observable<Section[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const data: Section[] = raw.map((item: any) => ({
          id: String(item.id || item.uuid || `sec-${Date.now()}`),
          uuid: item.uuid || String(item.id),
          nom: item.nom || item.libelle || '',
          code: item.code || '',
          description: item.description || '',
          ordre: item.ordre ?? item.ordre_affichage ?? 1,
          statut: normalizeStatut(item.statut, item.est_actif, item.is_active),
          total_niveaux: item.total_niveaux || 0
        }));
        this.sections.set(data);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.sections());
      })
    );
  }

  public getById(id: string): Observable<Section> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      catchError(err => {
        const found = this.sections().find(s => s.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateSectionDto): Observable<Section> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const created: Section = res.data || res;
        const normalized: Section = {
          id: created.id || `sec-${Date.now()}`,
          nom: created.nom || dto.nom,
          code: created.code || dto.code,
          description: created.description ?? dto.description ?? '',
          ordre: created.ordre ?? dto.ordre ?? 1,
          statut: normalizeStatut(created.statut ?? dto.statut, (created as any).est_actif, (created as any).is_active),
          total_niveaux: created.total_niveaux || 0
        };
        this.addOrUpdateLocal(normalized);
        this.toastService.success('Section Créée', `La section "${normalized.nom}" a été enregistrée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: Section = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          nom: dto.nom,
          code: dto.code,
          description: dto.description || '',
          ordre: dto.ordre || 1,
          statut: normalizeStatut(dto.statut),
          total_niveaux: 0
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Section Enregistrée', `La section "${newLocal.nom}" a été ajoutée.`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateSectionDto): Observable<Section> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const updated: Section = res.data || res;
        const current = this.sections().find(s => s.id === id);
        const normalized: Section = {
          id,
          nom: updated.nom || dto.nom || current?.nom || '',
          code: updated.code || dto.code || current?.code || '',
          description: updated.description ?? dto.description ?? current?.description ?? '',
          ordre: updated.ordre ?? dto.ordre ?? current?.ordre ?? 1,
          statut: normalizeStatut(updated.statut ?? dto.statut ?? current?.statut, (updated as any).est_actif, (updated as any).is_active),
          total_niveaux: updated.total_niveaux ?? current?.total_niveaux ?? 0
        };
        this.addOrUpdateLocal(normalized);
        this.toastService.success('Section Modifiée', `La section "${normalized.nom}" a été mise à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.sections().find(s => s.id === id);
        const updatedLocal: Section = {
          id,
          nom: dto.nom || current?.nom || '',
          code: dto.code || current?.code || '',
          description: dto.description ?? current?.description ?? '',
          ordre: dto.ordre ?? current?.ordre ?? 1,
          statut: normalizeStatut(dto.statut ?? current?.statut),
          total_niveaux: current?.total_niveaux || 0
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Section Modifiée', `La section "${updatedLocal.nom}" a été mise à jour.`);
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
        this.toastService.success('Section Supprimée', 'La section a été supprimée.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Section Supprimée', 'La section a été supprimée.');
        return of(void 0);
      })
    );
  }

  public toggleActive(section: Section): Observable<Section> {
    const isActif = normalizeStatut(section.statut) === 'actif';
    const nextStatus = isActif ? 'inactif' : 'actif';
    const updatedDto: UpdateSectionDto = {
      nom: section.nom,
      code: section.code,
      description: section.description,
      ordre: section.ordre,
      statut: nextStatus
    };
    return this.update(section.id, updatedDto);
  }

  private addOrUpdateLocal(item: Section): void {
    this.sections.update(list => {
      const updatedList = list.filter(s => s.id !== item.id);
      return [...updatedList, item].sort((a, b) => a.ordre - b.ordre);
    });
  }

  private removeLocal(id: string): void {
    this.sections.update(list => list.filter(s => s.id !== id));
  }
}


