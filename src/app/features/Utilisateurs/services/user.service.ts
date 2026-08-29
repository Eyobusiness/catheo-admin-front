import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { finalize, Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  CreateUserDto,
  UpdateUserDto,
  UserItem,
  UserListResponse,
  UserPaginationMeta
} from '../models/user.model';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../environments/environment';

function extractArrayData(res: any): UserItem[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.users)) return res.data.users;
  if (res.data && Array.isArray(res.data.utilisateurs)) return res.data.utilisateurs;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.users)) return res.users;
  if (Array.isArray(res.utilisateurs)) return res.utilisateurs;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  // Reactive state signals
  public readonly usersList = signal<UserItem[]>([]);
  public readonly users = this.usersList; // Alias for backward compatibility
  public readonly pagination = signal<UserPaginationMeta | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);

  constructor() {
    this.getUsers().subscribe();
  }

  /**
   * Charger la liste paginée des utilisateurs avec filtres
   * GET /api/v1/users
   */
  public getUsers(
    page: number = 1,
    perPage: number = 15,
    search?: string,
    statut?: string,
    profilId?: string
  ): Observable<UserListResponse | any> {
    this.isLoading.set(true);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search && search.trim()) params = params.set('search', search.trim());
    if (statut && statut !== 'tous') params = params.set('statut', statut);
    if (profilId && profilId !== 'tous') params = params.set('profil_id', profilId);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          const list = extractArrayData(res);
          this.usersList.set(list);
          if (res?.meta) {
            this.pagination.set(res.meta);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      }),
      catchError((error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.toastService.error(
          'Utilisateurs',
          error.error?.message || 'Impossible de charger la liste des utilisateurs.'
        );
        return of({ status: 'error', meta: null, data: [] });
      })
    );
  }

  public getAll(search?: string, statut?: string, profilId?: string): Observable<any> {
    return this.getUsers(1, 50, search, statut, profilId);
  }

  /**
   * Détails d'un utilisateur
   * GET /api/v1/users/:id
   */
  public getUserById(id: string): Observable<{ status: string; data: UserItem }> {
    return this.http.get<{ status: string; data: UserItem }>(`${this.apiUrl}/${id}`);
  }

  public getById(id: string): Observable<any> {
    return this.getUserById(id);
  }

  /**
   * Créer un nouvel utilisateur
   * POST /api/v1/users
   */
  public createUser(dto: CreateUserDto): Observable<{ status: string; message: string; data: UserItem }> {
    this.isSaving.set(true);

    return this.http.post<any>(this.apiUrl, dto).pipe(
      tap((res) => {
        this.isSaving.set(false);
        this.toastService.success('Succès', res.message || 'Utilisateur créé avec succès.');
        this.getUsers().subscribe();
      }),
      catchError((error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.toastService.error(
          'Erreur de création',
          error.error?.message || 'Impossible de créer l\'utilisateur.'
        );
        return throwError(() => error);
      })
    );
  }

  public create(dto: CreateUserDto): Observable<any> {
    return this.createUser(dto);
  }

  /**
   * Mettre à jour un utilisateur
   * PUT /api/v1/users/:id
   */
  public updateUser(id: string, dto: UpdateUserDto): Observable<{ status: string; message: string; data: UserItem }> {
    this.isSaving.set(true);

    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((res) => {
        this.isSaving.set(false);
        this.toastService.success('Succès', res.message || 'Utilisateur mis à jour avec succès.');
        this.getUsers().subscribe();
      }),
      catchError((error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.toastService.error(
          'Erreur de modification',
          error.error?.message || 'Impossible de modifier l\'utilisateur.'
        );
        return throwError(() => error);
      })
    );
  }

  public update(id: string, dto: UpdateUserDto): Observable<any> {
    return this.updateUser(id, dto);
  }

  /**
   * Basculer le statut Actif / Inactif
   * PATCH /api/v1/users/:id/status
   */
  public toggleStatus(id: string, statut?: 'actif' | 'inactif'): Observable<{ status: string; message: string; data: UserItem }> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, statut ? { statut } : {}).pipe(
      tap((res) => {
        this.toastService.success('Statut mis à jour', res.message || 'Le statut de l\'utilisateur a été modifié.');
        this.getUsers().subscribe();
      }),
      catchError((error: HttpErrorResponse) => {
        this.toastService.error(
          'Erreur',
          error.error?.message || 'Impossible de changer le statut de cet utilisateur.'
        );
        return throwError(() => error);
      })
    );
  }

  public patchStatus(id: string, statut?: any): Observable<any> {
    return this.toggleStatus(id, statut);
  }

  /**
   * Supprimer un utilisateur (Soft Delete)
   * DELETE /api/v1/users/:id
   */
  public deleteUser(id: string): Observable<{ status: string; message: string }> {
    this.isSaving.set(true);

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap((res) => {
        this.isSaving.set(false);
        this.toastService.success('Supprimé', res.message || 'Utilisateur supprimé avec succès.');
        this.getUsers().subscribe();
      }),
      catchError((error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.toastService.error(
          'Erreur de suppression',
          error.error?.message || 'Impossible de supprimer cet utilisateur.'
        );
        return throwError(() => error);
      })
    );
  }

  public delete(id: string): Observable<any> {
    return this.deleteUser(id);
  }
}
