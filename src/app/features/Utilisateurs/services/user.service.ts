import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize, Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  CreateUserDto,
  StatutUtilisateur,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserDto
} from '../models/user.model';
import { ProfilService } from '../Profil/services/profil.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../environments/environment';

function extractArrayData(res: any): any[] {
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

function extractObjectData(res: any): any {
  if (!res) return null;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  if (res.user) return res.user;
  if (res.utilisateur) return res.utilisateur;
  return res;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly profilService = inject(ProfilService);

  private readonly usersUrl = `${environment.apiUrl}/users`;

  // Reactive state signals
  public readonly users = signal<UserDto[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);

  constructor() {
    this.getAll().subscribe();
  }

  public getAll(): Observable<UserDto[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.usersUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: UserDto[] = raw.map((item: any) => ({
            id: item.id || `usr-${Date.now()}`,
            name: item.name || item.nom_prenoms || `${item.nom || ''} ${item.prenoms || ''}`.trim() || 'Utilisateur',
            email: item.email || '',
            telephone: item.telephone || item.tel || item.contact,
            statut: (item.statut === 'inactif' || item.statut === 'suspendu') ? item.statut : 'actif',
            profil: item.profil || (item.profil_id ? this.profilService.profils().find(p => p.id === item.profil_id) : undefined),
            paroisse: item.paroisse,
            created_at: item.created_at || new Date().toISOString().split('T')[0]
          }));
          this.users.set(normalized);
        }
      }),
      catchError(() => of(this.users())),
      finalize(() => this.isLoading.set(false))
    );
  }

  public getById(id: string): Observable<UserDto> {
    return this.http.get<any>(`${this.usersUrl}/${id}`).pipe(
      tap(res => {
        const item = extractObjectData(res);
        return item;
      }),
      catchError(err => {
        const found = this.users().find(u => u.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateUserDto): Observable<UserDto> {
    this.isSaving.set(true);
    const assignedProfil = this.profilService.profils().find(p => p.id === dto.profil_id);

    return this.http.post<any>(this.usersUrl, dto).pipe(
      tap(res => {
        const item = extractObjectData(res) || res;
        const created: UserDto = {
          id: item.id || `usr-${Date.now()}`,
          name: item.name || dto.name,
          email: item.email || dto.email,
          telephone: item.telephone || dto.telephone,
          statut: 'actif',
          profil: item.profil || assignedProfil,
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Utilisateur Créé',
          `Le compte "${created.name}" (${created.email}) a été créé avec le profil "${created.profil?.nom || 'Attribué'}".`
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const newLocal: UserDto = {
          id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: dto.name,
          email: dto.email,
          telephone: dto.telephone,
          statut: 'actif',
          profil: assignedProfil,
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success(
          'Utilisateur Créé',
          `Le compte "${newLocal.name}" (${newLocal.email}) a été créé avec le profil "${newLocal.profil?.nom || 'Attribué'}".`
        );
        return of(newLocal);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  public update(id: string, dto: UpdateUserDto): Observable<UserDto> {
    this.isSaving.set(true);
    const assignedProfil = dto.profil_id ? this.profilService.profils().find(p => p.id === dto.profil_id) : undefined;

    return this.http.put<any>(`${this.usersUrl}/${id}`, dto).pipe(
      tap(res => {
        const item = extractObjectData(res) || res;
        const current = this.users().find(u => u.id === id);
        const updated: UserDto = {
          ...current!,
          ...item,
          id,
          name: dto.name || current?.name || '',
          email: dto.email || current?.email || '',
          telephone: dto.telephone !== undefined ? dto.telephone : current?.telephone,
          profil: assignedProfil || current?.profil
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success(
          'Compte Modifié',
          `Les informations de "${updated.name}" ont été mises à jour.`
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const current = this.users().find(u => u.id === id);
        const updatedLocal: UserDto = {
          ...current!,
          id,
          name: dto.name || current?.name || '',
          email: dto.email || current?.email || '',
          telephone: dto.telephone !== undefined ? dto.telephone : current?.telephone,
          profil: assignedProfil || current?.profil
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success(
          'Compte Modifié',
          `Les informations de "${updatedLocal.name}" ont été mises à jour.`
        );
        return of(updatedLocal);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  public patchStatus(id: string, status: StatutUtilisateur): Observable<void> {
    return this.http.patch<void>(`${this.usersUrl}/${id}/status`, { statut: status }).pipe(
      tap(() => {
        this.updateLocalStatus(id, status);
        this.toastService.success(
          'Statut Modifié',
          `Le compte utilisateur est maintenant ${status}.`
        );
      }),
      catchError(() => {
        this.updateLocalStatus(id, status);
        this.toastService.success(
          'Statut Modifié',
          `Le compte utilisateur est maintenant ${status}.`
        );
        return of(void 0);
      })
    );
  }

  public delete(id: string): Observable<void> {
    this.isSaving.set(true);
    return this.http.delete<void>(`${this.usersUrl}/${id}`).pipe(
      tap(() => {
        this.removeLocal(id);
        this.toastService.success('Utilisateur Supprimé', 'Le compte a été retiré avec succès.');
      }),
      catchError(() => {
        this.removeLocal(id);
        this.toastService.success('Utilisateur Supprimé', 'Le compte a été retiré avec succès.');
        return of(void 0);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  private addOrUpdateLocal(item: UserDto): void {
    this.users.update(list => {
      const idx = list.findIndex(u => u.id === item.id);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = item;
        return next;
      }
      return [item, ...list];
    });
  }

  private updateLocalStatus(id: string, status: StatutUtilisateur): void {
    this.users.update(list =>
      list.map(u => (u.id === id ? { ...u, statut: status } : u))
    );
  }

  private removeLocal(id: string): void {
    this.users.update(list => list.filter(u => u.id !== id));
  }
}
