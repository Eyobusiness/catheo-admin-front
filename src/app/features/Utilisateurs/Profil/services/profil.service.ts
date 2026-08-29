import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../../core/services/toast.service';
import {
  CreateProfilDto,
  MenuTreeItem,
  ProfilItem,
  UpdateProfilDto
} from '../models/profil.model';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.profils)) return res.data.profils;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.profils)) return res.profils;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class ProfilService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/profils`;

  // Reactive State Signals
  public readonly profilsList = signal<ProfilItem[]>([]);
  public readonly profils = this.profilsList; // Alias for backward compatibility
  public readonly permissionsTree = signal<MenuTreeItem[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);

  constructor() {
    this.getPermissionsTree().subscribe();
    this.getProfils().subscribe();
  }

  /**
   * Charger l'arbre complet des menus racines et permissions pour construire le formulaire
   * GET /api/v1/profils/permissions-tree
   */
  public getPermissionsTree(): Observable<{ status: string; data: MenuTreeItem[] }> {
    return this.http.get<any>(`${this.apiUrl}/permissions-tree`).pipe(
      tap((res) => {
        const tree = Array.isArray(res) ? res : (res?.data || []);
        this.permissionsTree.set(tree);
      }),
      catchError((error: HttpErrorResponse) => {
        return of({ status: 'error', data: [] });
      })
    );
  }

  /**
   * Charger la liste des profils avec recherche & filtre de statut
   * GET /api/v1/profils
   */
  public getProfils(search?: string, statut?: string): Observable<{ status: string; data: ProfilItem[] }> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (search && search.trim()) params = params.set('search', search.trim());
    if (statut && statut !== 'tous') params = params.set('statut', statut);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          const list = extractArrayData(res);
          this.profilsList.set(list);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error('Profils', error.error?.message || 'Impossible de charger la liste des profils.');
        return of({ status: 'error', data: [] });
      })
    );
  }

  // Alias getAll for components
  public getAll(search?: string, statut?: string): Observable<any> {
    return this.getProfils(search, statut);
  }

  /**
   * Détails d'un profil
   * GET /api/v1/profils/:id
   */
  public getProfilById(id: string): Observable<{ status: string; data: ProfilItem }> {
    return this.http.get<{ status: string; data: ProfilItem }>(`${this.apiUrl}/${id}`);
  }

  public getById(id: string): Observable<any> {
    return this.getProfilById(id);
  }

  /**
   * Créer un profil avec sa matrice de permissions
   * POST /api/v1/profils
   */
  public createProfil(dto: CreateProfilDto): Observable<{ status: string; message: string; data: ProfilItem }> {
    this.isSaving.set(true);
    return this.http.post<any>(this.apiUrl, dto).pipe(
      tap((res) => {
        this.isSaving.set(false);
        this.toastService.success('Succès', res.message || 'Profil créé avec succès.');
        this.getProfils().subscribe();
      }),
      catchError((error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.toastService.error('Erreur de création', error.error?.message || 'Impossible de créer le profil.');
        return throwError(() => error);
      })
    );
  }

  public create(dto: CreateProfilDto): Observable<any> {
    return this.createProfil(dto);
  }

  /**
   * Mettre à jour un profil existant
   * PUT /api/v1/profils/:id
   */
  public updateProfil(id: string, dto: UpdateProfilDto): Observable<{ status: string; message: string; data: ProfilItem }> {
    this.isSaving.set(true);
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((res) => {
        this.isSaving.set(false);
        this.toastService.success('Succès', res.message || 'Profil mis à jour avec succès.');
        this.getProfils().subscribe();
      }),
      catchError((error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.toastService.error('Erreur de modification', error.error?.message || 'Impossible de modifier le profil.');
        return throwError(() => error);
      })
    );
  }

  public update(id: string, dto: UpdateProfilDto): Observable<any> {
    return this.updateProfil(id, dto);
  }

  /**
   * Activer / Désactiver un profil
   * PATCH /api/v1/profils/:id/status
   */
  public toggleStatus(id: string): Observable<{ status: string; message: string; data: ProfilItem }> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, {}).pipe(
      tap((res) => {
        this.toastService.success('Statut modifié', res.message || 'Le statut du profil a été mis à jour.');
        this.getProfils().subscribe();
      }),
      catchError((error: HttpErrorResponse) => {
        this.toastService.error('Erreur', error.error?.message || 'Impossible de changer le statut.');
        return throwError(() => error);
      })
    );
  }

  /**
   * Supprimer un profil personnalisé
   * DELETE /api/v1/profils/:id
   */
  public deleteProfil(id: string): Observable<{ status: string; message: string }> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap((res) => {
        this.toastService.success('Supprimé', res.message || 'Profil supprimé avec succès.');
        this.getProfils().subscribe();
      }),
      catchError((error: HttpErrorResponse) => {
        this.toastService.error('Erreur de suppression', error.error?.message || 'Impossible de supprimer le profil.');
        return throwError(() => error);
      })
    );
  }

  public delete(id: string): Observable<any> {
    return this.deleteProfil(id);
  }
}
