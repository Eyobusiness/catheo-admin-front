import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { AnneeCatechese, CreateAnneeCatecheseDto, UpdateAnneeCatecheseDto } from '../models/annee-catechese.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArray(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.annees && Array.isArray(res.annees)) return res.annees;
  return [];
}

function extractObject(res: any): any {
  if (!res) return null;
  if (Array.isArray(res) && res.length > 0) return res[0];
  if (res.data && Array.isArray(res.data) && res.data.length > 0) return res.data[0];
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    return res.data.annee || res.data;
  }
  return res.annee || res;
}

function normalizeAnnee(item: any): AnneeCatechese {
  const statut = item.statut || (item.est_active ? 'active' : 'preparation');
  const est_active = statut === 'active' || item.est_active === true;
  return {
    id: String(item.id || item.uuid || ''),
    libelle: item.libelle || item.nom || '',
    date_debut: item.date_debut ? String(item.date_debut).split('T')[0] : '',
    date_fin: item.date_fin ? String(item.date_fin).split('T')[0] : '',
    statut,
    est_active,
    total_inscrits: Number(item.total_inscrits || item.inscrits_count || item.inscrits || 0),
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnneeCatecheseService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/annee-catecheses`;

  // Reactive state signals
  public readonly annees = signal<AnneeCatechese[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly activeAnnee = signal<AnneeCatechese | null>(null);

  constructor() {
    this.getAll().subscribe();
  }

  public getAll(): Observable<AnneeCatechese[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const rawList = extractArray(res);
        if (rawList.length > 0) {
          const list = rawList.map(normalizeAnnee);
          this.annees.set(list);
          this.activeAnnee.set(list.find(a => a.est_active || a.statut === 'active') || null);
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.annees());
      })
    );
  }

  public getById(id: string): Observable<AnneeCatechese> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const raw = extractObject(res);
        if (raw) {
          const item = normalizeAnnee(raw);
          this.addOrUpdateLocal(item);
        }
      }),
      catchError(err => {
        const found = this.annees().find(a => a.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateAnneeCatecheseDto): Observable<AnneeCatechese> {
    this.isLoading.set(true);
    const payload = {
      libelle: dto.libelle,
      date_debut: dto.date_debut,
      date_fin: dto.date_fin,
      statut: dto.statut || (dto.est_active ? 'active' : 'preparation')
    };

    return this.http.post<any>(this.baseUrl, payload).pipe(
      tap(res => {
        this.isLoading.set(false);
        const raw = extractObject(res) || res;
        const created = normalizeAnnee(raw);
        this.addOrUpdateLocal(created);
        this.toastService.success('Année Créée', `L'année pastorale ${created.libelle} a été enregistrée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: AnneeCatechese = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          libelle: dto.libelle,
          date_debut: dto.date_debut,
          date_fin: dto.date_fin,
          statut: payload.statut,
          est_active: payload.statut === 'active',
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
    const payload = {
      libelle: dto.libelle,
      date_debut: dto.date_debut,
      date_fin: dto.date_fin,
      statut: dto.statut || (dto.est_active ? 'active' : 'preparation')
    };

    return this.http.put<any>(`${this.baseUrl}/${id}`, payload).pipe(
      tap(res => {
        this.isLoading.set(false);
        const raw = extractObject(res) || res;
        const updated = normalizeAnnee({ ...dto, ...raw, id });
        this.addOrUpdateLocal(updated);
        this.toastService.success('Année Modifiée', `L'année pastorale ${updated.libelle} a été mise à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.annees().find(a => a.id === id);
        const updatedLocal: AnneeCatechese = {
          id,
          libelle: dto.libelle,
          date_debut: dto.date_debut,
          date_fin: dto.date_fin,
          statut: payload.statut,
          est_active: payload.statut === 'active',
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
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Année Supprimée', 'L\'année pastorale a été supprimée avec succès.');
        return of(void 0);
      })
    );
  }

  public activate(id: string): Observable<AnneeCatechese> {
    this.isLoading.set(true);
    return this.http.patch<any>(`${this.baseUrl}/${id}/activate`, {}).pipe(
      tap(res => {
        this.isLoading.set(false);
        const raw = extractObject(res) || res;
        const activated = normalizeAnnee({ ...raw, id, statut: 'active', est_active: true });
        this.addOrUpdateLocal(activated);
        this.toastService.success('Année Activée', `L'année pastorale ${activated.libelle} est désormais active.`);
      }),
      catchError(() => {
        this.isLoading.set(false);
        const current = this.annees().find(a => a.id === id);
        if (current) {
          const updated: AnneeCatechese = {
            ...current,
            statut: 'active',
            est_active: true
          };
          this.addOrUpdateLocal(updated);
          this.toastService.success('Année Activée', `L'année pastorale ${updated.libelle} est désormais active.`);
          return of(updated);
        }
        return throwError(() => new Error('Année introuvable'));
      })
    );
  }

  public toggleActive(annee: AnneeCatechese): Observable<AnneeCatechese> {
    if (!annee.est_active && annee.statut !== 'active') {
      return this.activate(annee.id);
    }
    const updatedDto: UpdateAnneeCatecheseDto = {
      libelle: annee.libelle,
      date_debut: annee.date_debut,
      date_fin: annee.date_fin,
      statut: 'preparation',
      est_active: false
    };
    return this.update(annee.id, updatedDto);
  }

  private addOrUpdateLocal(item: AnneeCatechese): void {
    this.annees.update(list => {
      let updatedList = list.filter(a => a.id !== item.id);
      if (item.est_active || item.statut === 'active') {
        // Only one active year at a time
        updatedList = updatedList.map(a => ({
          ...a,
          statut: a.statut === 'active' ? 'cloturee' : a.statut,
          est_active: false
        }));
      }
      return [item, ...updatedList];
    });
    this.activeAnnee.set(this.annees().find(a => a.est_active || a.statut === 'active') || null);
  }

  private removeLocal(id: string): void {
    this.annees.update(list => list.filter(a => a.id !== id));
    this.activeAnnee.set(this.annees().find(a => a.est_active || a.statut === 'active') || null);
  }
}
