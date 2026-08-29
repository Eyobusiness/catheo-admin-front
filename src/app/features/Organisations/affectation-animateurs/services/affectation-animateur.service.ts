import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  AffectationAnimateur,
  AffectationFilterParams,
  CreateAffectationAnimateurDto,
  UpdateAffectationAnimateurDto
} from '../models/affectation-animateur.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.affectations)) return res.data.affectations;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.affectations)) return res.affectations;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class AffectationAnimateurService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/affectations-animateurs`;

  // Reactive state signals
  public readonly affectations = signal<AffectationAnimateur[]>([]);
  public readonly isLoading = signal<boolean>(false);

  constructor() {
    this.getAll().subscribe();
  }

  public getAll(filters?: AffectationFilterParams): Observable<AffectationAnimateur[]> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (filters) {
      if (filters.annee_catechese_id) params = params.set('annee_catechese_id', filters.annee_catechese_id);
      if (filters.classe_id) params = params.set('classe_id', filters.classe_id);
      if (filters.animateur_id) params = params.set('animateur_id', filters.animateur_id);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const normalized: AffectationAnimateur[] = raw.map((item: any) => ({
          id: item.id,
          annee_catechese_id: item.annee_catechese_id || item.annee_id,
          role: item.role || 'principal',
          date_affectation: item.date_affectation || new Date().toISOString().split('T')[0],
          animateur_id: item.animateur_id || item.animateur?.id,
          classe_id: item.classe_id || item.classe?.id,
          animateur: item.animateur || {
            id: item.animateur_id || 'unknown',
            nom: 'Catéchiste',
            prenoms: '',
            sexe: 'M',
            statut: 'actif'
          },
          classe: item.classe || {
            id: item.classe_id || 'unknown',
            nom: 'Classe',
            capacite_max: 30,
            statut: 'active'
          }
        }));
        this.affectations.set(normalized);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        return of(this.affectations());
      })
    );
  }

  public getById(id: string): Observable<AffectationAnimateur> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.affectations().find(a => a.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateAffectationAnimateurDto, animateurLabel?: string, classeLabel?: string): Observable<AffectationAnimateur> {
    this.isLoading.set(true);

    const payload: any = {
      animateur_id: dto.animateur_id,
      classe_id: dto.classe_id,
      role: dto.role || 'principal'
    };
    if (dto.annee_catechese_id) {
      payload.annee_catechese_id = dto.annee_catechese_id;
    }

    return this.http.post<any>(this.baseUrl, payload).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: AffectationAnimateur = {
          id: item.id || `uuid-${Date.now()}`,
          role: item.role || dto.role || 'principal',
          date_affectation: item.date_affectation || new Date().toISOString().split('T')[0],
          animateur_id: item.animateur_id || dto.animateur_id,
          classe_id: item.classe_id || dto.classe_id,
          animateur: item.animateur || {
            id: dto.animateur_id,
            nom: animateurLabel || 'Catéchiste',
            prenoms: '',
            sexe: 'M',
            statut: 'actif'
          },
          classe: item.classe || {
            id: dto.classe_id,
            nom: classeLabel || 'Classe',
            capacite_max: 30,
            statut: 'active'
          }
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Affectation Enregistrée', 'Le catéchiste a été affecté à la classe.');
        this.getAll().subscribe();
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.message || err.error?.error || 'Impossible d\'enregistrer l\'affectation.';
        this.toastService.error('Erreur', errorMsg);
        return throwError(() => err);
      })
    );
  }

  public update(id: string, dto: UpdateAffectationAnimateurDto, animateurLabel?: string, classeLabel?: string): Observable<AffectationAnimateur> {
    this.isLoading.set(true);

    const payload: any = {};
    if (dto.animateur_id) payload.animateur_id = dto.animateur_id;
    if (dto.classe_id) payload.classe_id = dto.classe_id;
    if (dto.role) payload.role = dto.role;

    return this.http.put<any>(`${this.baseUrl}/${id}`, payload).pipe(
      catchError((putErr: HttpErrorResponse) => {
        if (putErr.status === 405 || putErr.status === 404) {
          return this.http.patch<any>(`${this.baseUrl}/${id}`, payload);
        }
        return throwError(() => putErr);
      }),
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.affectations().find(a => a.id === id);
        const updated: AffectationAnimateur = {
          ...current,
          ...item,
          id,
          role: item.role || dto.role || current?.role || 'principal',
          animateur_id: item.animateur_id || dto.animateur_id || current?.animateur_id,
          classe_id: item.classe_id || dto.classe_id || current?.classe_id,
          animateur: item.animateur || (animateurLabel ? { ...current?.animateur, nom: animateurLabel } : current?.animateur),
          classe: item.classe || (classeLabel ? { ...current?.classe, nom: classeLabel } : current?.classe)
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Affectation Modifiée', 'Les détails ont été mis à jour.');
        this.getAll().subscribe();
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.message || err.error?.error || 'Impossible de modifier l\'affectation.';
        this.toastService.error('Erreur', errorMsg);
        return throwError(() => err);
      })
    );
  }

  public patch(id: string, dto: UpdateAffectationAnimateurDto): Observable<AffectationAnimateur> {
    return this.update(id, dto);
  }

  public patchRole(id: string, nextRole: string): Observable<AffectationAnimateur> {
    return this.update(id, { role: nextRole });
  }

  public delete(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Affectation Supprimée', "L'affectation a été annulée.");
        this.getAll().subscribe();
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.message || err.error?.error || 'Impossible de supprimer l\'affectation.';
        this.toastService.error('Erreur', errorMsg);
        return throwError(() => err);
      })
    );
  }

  private addOrUpdateLocal(item: AffectationAnimateur): void {
    this.affectations.update(list => {
      const updatedList = list.filter(a => a.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeLocal(id: string): void {
    this.affectations.update(list => list.filter(a => a.id !== id));
  }
}
