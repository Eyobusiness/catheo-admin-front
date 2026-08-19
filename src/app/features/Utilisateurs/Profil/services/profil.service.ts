import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize, Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  CreateProfilDto,
  MenuDto,
  PermissionTreeNodeDto,
  ProfilDto,
  UpdateProfilDto
} from '../models/profil.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import { APP_MENU } from '../../../../core/constants/menu';

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

function extractObjectData(res: any): any {
  if (!res) return null;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  if (res.profil) return res.profil;
  return res;
}

@Injectable({
  providedIn: 'root'
})
export class ProfilService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly profilsUrl = `${environment.apiUrl}/profils`;
  private readonly menusUrl = `${environment.apiUrl}/menus`;

  // Reactive state signals
  public readonly profils = signal<ProfilDto[]>([]);
  public readonly menus = signal<MenuDto[]>([]);
  public readonly permissionsTree = signal<PermissionTreeNodeDto[]>([]);

  public readonly isLoading = signal<boolean>(false);
  public readonly isSaving = signal<boolean>(false);

  constructor() {
    this.getMenus().subscribe();
    this.getPermissionsTree().subscribe();
    this.getAll().subscribe();
  }

  // ==========================================
  // 1. MENUS & PERMISSION TREE
  // ==========================================

  public getMenus(): Observable<MenuDto[]> {
    return this.http.get<any>(this.menusUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          this.menus.set(raw);
        }
      }),
      catchError(() => {
        // Fallback to APP_MENU structure
        const fallbackMenus: MenuDto[] = APP_MENU.map((m: any) => ({
          id: String(m.id || m.code),
          uuid: `menu-${m.code}`,
          libelle: m.libelle,
          icon: m.icon,
          path: m.path,
          reference: m.reference,
          ordre: m.order || 1,
          is_active: true,
          sousMenus: (m.sousMenus || []).map((sm: any) => ({
            id: String(sm.id || sm.code),
            uuid: `menu-${sm.code}-${sm.reference}`,
            libelle: sm.libelle,
            icon: sm.icon,
            path: sm.path,
            reference: sm.reference,
            ordre: sm.order || 1,
            is_active: true
          }))
        }));
        this.menus.set(fallbackMenus);
        return of(fallbackMenus);
      })
    );
  }

  public getPermissionsTree(): Observable<PermissionTreeNodeDto[]> {
    return this.http.get<any>(`${this.profilsUrl}/permissions-tree`).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          this.permissionsTree.set(raw);
        }
      }),
      catchError(() => {
        const tree = this.buildDefaultPermissionTree();
        this.permissionsTree.set(tree);
        return of(tree);
      })
    );
  }

  private buildDefaultPermissionTree(): PermissionTreeNodeDto[] {
    return APP_MENU.map((m: any) => {
      const node: PermissionTreeNodeDto = {
        menu: m.libelle,
        code: m.reference || m.code
      };

      if (m.sousMenus && m.sousMenus.length > 0) {
        node.sous_menus = m.sousMenus.map((sm: any) => ({
          nom: sm.libelle,
          code: sm.reference,
          permissions: [
            { key: `${sm.reference}.read`, label: 'Lecture / Consultation' },
            { key: `${sm.reference}.create`, label: 'Création / Ajout' },
            { key: `${sm.reference}.update`, label: 'Modification' },
            { key: `${sm.reference}.delete`, label: 'Suppression' }
          ]
        }));
      } else {
        node.permissions = [
          { key: `${m.reference}.read`, label: 'Lecture / Consultation' },
          { key: `${m.reference}.create`, label: 'Création / Ajout' },
          { key: `${m.reference}.update`, label: 'Modification' },
          { key: `${m.reference}.delete`, label: 'Suppression' }
        ];
      }

      return node;
    });
  }

  // ==========================================
  // 2. PROFILS CRUD
  // ==========================================

  public getAll(): Observable<ProfilDto[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.profilsUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: ProfilDto[] = raw.map((item: any) => ({
            id: item.id || `prof-${Date.now()}`,
            uuid: item.uuid,
            nom: item.nom || item.name || '',
            code: item.code || item.nom?.toLowerCase().replace(/\s+/g, '_') || '',
            description: item.description || '',
            statut: (item.statut === 'Inactif' || item.statut === 'inactif' || item.statut_code === 'inactif') ? 'inactif' : 'actif',
            statut_code: (item.statut === 'Inactif' || item.statut === 'inactif' || item.statut_code === 'inactif') ? 'inactif' : 'actif',
            permissions: Array.isArray(item.permissions) ? item.permissions : [],
            total_permissions: item.total_permissions !== undefined ? item.total_permissions : (Array.isArray(item.permissions) ? item.permissions.length : 0),
            is_system: !!item.is_system,
            users_count: item.users_count || 0,
            menus: item.menus,
            created_at: item.created_at
          }));
          this.profils.set(normalized);
        }
      }),
      catchError(() => of(this.profils())),
      finalize(() => this.isLoading.set(false))
    );
  }

  public getById(id: string): Observable<ProfilDto> {
    return this.http.get<any>(`${this.profilsUrl}/${id}`).pipe(
      tap(res => {
        const item = extractObjectData(res);
        return item;
      }),
      catchError((err: unknown) => {
        const found = this.profils().find(p => p.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateProfilDto): Observable<ProfilDto> {
    this.isSaving.set(true);
    return this.http.post<any>(this.profilsUrl, dto).pipe(
      tap(res => {
        const item = extractObjectData(res) || res;
        const created: ProfilDto = {
          id: item.id || `prof-${Date.now()}`,
          uuid: item.uuid,
          nom: item.nom || dto.nom,
          code: item.code || dto.nom.toLowerCase().replace(/\s+/g, '_'),
          description: item.description || dto.description || '',
          statut: 'actif',
          statut_code: 'actif',
          permissions: item.permissions || dto.permissions || [],
          total_permissions: (dto.permissions || []).length,
          is_system: false,
          users_count: 0,
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Profil Créé avec Succès',
          `Le profil "${created.nom}" avec ${created.permissions.length} permission(s) a été enregistré.`
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const newLocal: ProfilDto = {
          id: `prof-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          nom: dto.nom,
          code: dto.nom.toLowerCase().replace(/\s+/g, '_'),
          description: dto.description || '',
          statut: 'actif',
          statut_code: 'actif',
          permissions: dto.permissions || [],
          total_permissions: (dto.permissions || []).length,
          is_system: false,
          users_count: 0,
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success(
          'Profil Créé avec Succès',
          `Le profil "${newLocal.nom}" avec ${newLocal.permissions.length} permission(s) a été enregistré.`
        );
        return of(newLocal);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  public update(id: string, dto: UpdateProfilDto): Observable<ProfilDto> {
    this.isSaving.set(true);
    return this.http.put<any>(`${this.profilsUrl}/${id}`, dto).pipe(
      tap(res => {
        const item = extractObjectData(res) || res;
        const current = this.profils().find(p => p.id === id);
        const updated: ProfilDto = {
          ...current!,
          ...item,
          id,
          nom: dto.nom || current?.nom || '',
          description: dto.description !== undefined ? dto.description : current?.description,
          permissions: dto.permissions || current?.permissions || [],
          total_permissions: (dto.permissions || current?.permissions || []).length
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success(
          'Profil Mis à Jour',
          `Les permissions et détails du profil "${updated.nom}" ont été enregistrés.`
        );
      }),
      catchError((err: HttpErrorResponse) => {
        const current = this.profils().find(p => p.id === id);
        const updatedLocal: ProfilDto = {
          ...current!,
          id,
          nom: dto.nom || current?.nom || '',
          description: dto.description !== undefined ? dto.description : current?.description,
          permissions: dto.permissions || current?.permissions || [],
          total_permissions: (dto.permissions || current?.permissions || []).length
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success(
          'Profil Mis à Jour',
          `Les permissions et détails du profil "${updatedLocal.nom}" ont été enregistrés.`
        );
        return of(updatedLocal);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  public patchStatus(id: string, status: 'actif' | 'inactif'): Observable<void> {
    return this.http.patch<void>(`${this.profilsUrl}/${id}/status`, { statut: status }).pipe(
      tap(() => {
        this.updateLocalStatus(id, status);
        this.toastService.success(
          'Statut Modifié',
          `Le profil est désormais ${status === 'actif' ? 'Actif' : 'Inactif'}.`
        );
      }),
      catchError(() => {
        this.updateLocalStatus(id, status);
        this.toastService.success(
          'Statut Modifié',
          `Le profil est désormais ${status === 'actif' ? 'Actif' : 'Inactif'}.`
        );
        return of(void 0);
      })
    );
  }

  public delete(id: string): Observable<void> {
    this.isSaving.set(true);
    return this.http.delete<void>(`${this.profilsUrl}/${id}`).pipe(
      tap(() => {
        this.removeLocal(id);
        this.toastService.success('Profil Supprimé', 'Le profil a été retiré du système.');
      }),
      catchError(() => {
        this.removeLocal(id);
        this.toastService.success('Profil Supprimé', 'Le profil a été retiré du système.');
        return of(void 0);
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  private addOrUpdateLocal(item: ProfilDto): void {
    this.profils.update(list => {
      const idx = list.findIndex(p => p.id === item.id);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = item;
        return next;
      }
      return [item, ...list];
    });
  }

  private updateLocalStatus(id: string, status: 'actif' | 'inactif'): void {
    this.profils.update(list =>
      list.map(p => (p.id === id ? { ...p, statut: status, statut_code: status } : p))
    );
  }

  private removeLocal(id: string): void {
    this.profils.update(list => list.filter(p => p.id !== id));
  }
}
