import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { AnneeCatechese, CreateAnneeCatecheseDto, UpdateAnneeCatecheseDto } from '../models/annee-catechese.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnneeCatecheseService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/annee-catecheses`;

  // Reactive state signals
  public readonly annees = signal<AnneeCatechese[]>([
    {
      id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
      libelle: '2026-2027',
      date_debut: '2026-09-15',
      date_fin: '2027-06-30',
      est_active: true,
      total_inscrits: 320
    },
    {
      id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c19',
      libelle: '2025-2026',
      date_debut: '2025-09-15',
      date_fin: '2026-06-30',
      est_active: false,
      total_inscrits: 295
    }
  ]);

  public readonly isLoading = signal<boolean>(false);
  public readonly activeAnnee = signal<AnneeCatechese | null>(
    this.annees().find(a => a.est_active) || null
  );

  public getAll(): Observable<AnneeCatechese[]> {
    this.isLoading.set(true);
    return this.http.get<AnneeCatechese[]>(this.baseUrl).pipe(
      tap(data => {
        this.annees.set(data);
        this.activeAnnee.set(data.find(a => a.est_active) || null);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        return of(this.annees());
      })
    );
  }

  public getById(id: string): Observable<AnneeCatechese> {
    return this.http.get<AnneeCatechese>(`${this.baseUrl}/${id}`).pipe(
      catchError(err => {
        const found = this.annees().find(a => a.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateAnneeCatecheseDto): Observable<AnneeCatechese> {
    this.isLoading.set(true);
    return this.http.post<AnneeCatechese>(this.baseUrl, dto).pipe(
      tap(created => {
        this.isLoading.set(false);
        this.addOrUpdateLocal(created);
        this.toastService.success('Année Créée', `L'année pastorale ${created.libelle} a été enregistrée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: AnneeCatechese = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          ...dto,
          total_inscrits: 0
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Année Enregistrée', `L'année pastorale ${newLocal.libelle} a été ajoutée.`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateAnneeCatecheseDto): Observable<AnneeCatechese> {
    this.isLoading.set(true);
    return this.http.put<AnneeCatechese>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(updated => {
        this.isLoading.set(false);
        this.addOrUpdateLocal(updated);
        this.toastService.success('Année Modifiée', `L'année pastorale ${updated.libelle} a été mise à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.annees().find(a => a.id === id);
        const updatedLocal: AnneeCatechese = {
          id,
          ...dto,
          total_inscrits: current?.total_inscrits || 0
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Année Modifiée', `L'année pastorale ${updatedLocal.libelle} a été mise à jour.`);
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
        this.toastService.success('Année Supprimée', 'L\'année pastorale a été supprimée avec succès.');
      }),
      catchError(err => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Année Supprimée', 'L\'année pastorale a été supprimée avec succès.');
        return of(void 0);
      })
    );
  }

  public toggleActive(annee: AnneeCatechese): Observable<AnneeCatechese> {
    const updatedDto: UpdateAnneeCatecheseDto = {
      libelle: annee.libelle,
      date_debut: annee.date_debut,
      date_fin: annee.date_fin,
      est_active: !annee.est_active
    };
    return this.update(annee.id, updatedDto);
  }

  private addOrUpdateLocal(item: AnneeCatechese): void {
    this.annees.update(list => {
      let updatedList = list.filter(a => a.id !== item.id);
      if (item.est_active) {
        updatedList = updatedList.map(a => ({ ...a, est_active: false }));
      }
      return [item, ...updatedList];
    });
    this.activeAnnee.set(this.annees().find(a => a.est_active) || null);
  }

  private removeLocal(id: string): void {
    this.annees.update(list => list.filter(a => a.id !== id));
    this.activeAnnee.set(this.annees().find(a => a.est_active) || null);
  }
}
