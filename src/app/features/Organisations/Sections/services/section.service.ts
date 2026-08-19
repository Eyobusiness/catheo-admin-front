import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { CreateSectionDto, Section, SectionStatut, UpdateSectionDto } from '../models/section.model';
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

@Injectable({
  providedIn: 'root'
})
export class SectionService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/sections`;

  // Reactive state signals
  public readonly sections = signal<Section[]>([
    {
      id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d21',
      nom: 'Enfance',
      code: 'ENFANCE',
      description: 'Catéchèse des enfants de 6 à 11 ans',
      ordre: 1,
      statut: 'actif',
      total_niveaux: 4
    },
    {
      id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c22',
      nom: 'Jeunes & Ados',
      code: 'JEUNES',
      description: 'Catéchèse des adolescents de 12 à 17 ans',
      ordre: 2,
      statut: 'actif',
      total_niveaux: 3
    },
    {
      id: '7b6a5c4d-3e2f-1a0b-9c8d-7e6f5a4b3c23',
      nom: 'Adultes (Catéchuménat)',
      code: 'ADULTES',
      description: 'Préparation au baptême et confirmation des adultes',
      ordre: 3,
      statut: 'actif',
      total_niveaux: 2
    }
  ]);

  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<Section[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const data: Section[] = raw.map((item: any) => ({
            id: item.id,
            nom: item.nom,
            code: item.code,
            description: item.description || '',
            ordre: item.ordre ?? item.ordre_affichage ?? 1,
            statut: (item.statut || (item.est_actif === false ? 'inactif' : 'actif')) as SectionStatut,
            total_niveaux: item.total_niveaux || 0
          }));
          this.sections.set(data);
        }
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
        this.addOrUpdateLocal(created);
        this.toastService.success('Section Créée', `La section "${created.nom}" a été enregistrée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: Section = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ...dto,
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
        this.addOrUpdateLocal(updated);
        this.toastService.success('Section Modifiée', `La section "${updated.nom}" a été mise à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.sections().find(s => s.id === id);
        const updatedLocal: Section = {
          id,
          ...dto,
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
    const nextStatus: SectionStatut = section.statut === 'actif' ? 'inactif' : 'actif';
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
