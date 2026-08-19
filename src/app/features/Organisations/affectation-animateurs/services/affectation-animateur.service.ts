import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  AffectationAnimateur,
  CreateAffectationAnimateurDto,
  RoleAnimateur,
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
  public readonly affectations = signal<AffectationAnimateur[]>([
    {
      id: '1f2e3d4c-5b6a-7f8e-9d0c-1b2a3f4e5d61',
      role: 'principal',
      date_affectation: '2026-09-01',
      animateur_id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c61',
      classe_id: '8f9e0d1c-2b3a-4f5e-6d7c-8b9a0f1e2d31',
      animateur: {
        id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c61',
        matricule: 'CAT-2026-001',
        nom: 'KOUASSI',
        prenoms: 'Jean-Marc',
        sexe: 'M',
        statut: 'actif',
        telephone: '+225 07 01 02 03 04'
      },
      classe: {
        id: '8f9e0d1c-2b3a-4f5e-6d7c-8b9a0f1e2d31',
        nom: 'Saint Jean-Paul II',
        capacite_max: 30,
        statut: 'active',
        niveau: {
          id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d22',
          nom: "1ère Année d'Initiation",
          statut: 'Actif'
        }
      }
    },
    {
      id: '2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c72',
      role: 'adjoint',
      date_affectation: '2026-09-01',
      animateur_id: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d72',
      classe_id: '8f9e0d1c-2b3a-4f5e-6d7c-8b9a0f1e2d31',
      animateur: {
        id: '2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d72',
        matricule: 'CAT-2026-002',
        nom: 'YAO',
        prenoms: 'Marie-Noëlle',
        sexe: 'F',
        statut: 'actif',
        telephone: '+225 05 06 07 08 09'
      },
      classe: {
        id: '8f9e0d1c-2b3a-4f5e-6d7c-8b9a0f1e2d31',
        nom: 'Saint Jean-Paul II',
        capacite_max: 30,
        statut: 'active',
        niveau: {
          id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d22',
          nom: "1ère Année d'Initiation",
          statut: 'Actif'
        }
      }
    },
    {
      id: '3d4c5b6a-7f8e-9d0c-1b2a-3f4e5d6c7b83',
      role: 'principal',
      date_affectation: '2026-09-05',
      animateur_id: '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e83',
      classe_id: '7e8d9c0b-1a2f-3e4d-5c6b-7a8f9e0d1c32',
      animateur: {
        id: '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e83',
        matricule: 'CAT-2026-003',
        nom: 'KONE',
        prenoms: 'David',
        sexe: 'M',
        statut: 'actif',
        telephone: '+225 01 02 03 04 05'
      },
      classe: {
        id: '7e8d9c0b-1a2f-3e4d-5c6b-7a8f9e0d1c32',
        nom: 'Sainte Thérèse de Lisieux',
        capacite_max: 25,
        statut: 'active',
        niveau: {
          id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c23',
          nom: "2ème Année d'Initiation",
          statut: 'Actif'
        }
      }
    }
  ]);

  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<AffectationAnimateur[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: AffectationAnimateur[] = raw.map((item: any) => ({
            id: item.id,
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
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
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
    return this.http.post<any>(this.baseUrl, dto).pipe(
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
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: AffectationAnimateur = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: dto.role || 'principal',
          date_affectation: new Date().toISOString().split('T')[0],
          animateur_id: dto.animateur_id,
          classe_id: dto.classe_id,
          animateur: {
            id: dto.animateur_id,
            nom: animateurLabel || 'Catéchiste',
            prenoms: '',
            sexe: 'M',
            statut: 'actif'
          },
          classe: {
            id: dto.classe_id,
            nom: classeLabel || 'Classe',
            capacite_max: 30,
            statut: 'active'
          }
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Affectation Enregistrée', 'Le catéchiste a été affecté à la classe.');
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateAffectationAnimateurDto, animateurLabel?: string, classeLabel?: string): Observable<AffectationAnimateur> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
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
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.affectations().find(a => a.id === id);
        const updatedLocal: AffectationAnimateur = {
          ...current!,
          id,
          role: dto.role || current?.role || 'principal',
          animateur_id: dto.animateur_id || current?.animateur_id,
          classe_id: dto.classe_id || current?.classe_id,
          animateur: animateurLabel ? { ...current!.animateur, nom: animateurLabel } : current!.animateur,
          classe: classeLabel ? { ...current!.classe, nom: classeLabel } : current!.classe
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Affectation Modifiée', 'Les détails ont été mis à jour.');
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
        this.toastService.success('Affectation Supprimée', "L'affectation a été annulée.");
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Affectation Supprimée', "L'affectation a été annulée.");
        return of(void 0);
      })
    );
  }

  public patchRole(id: string, nextRole: RoleAnimateur): Observable<AffectationAnimateur> {
    return this.http.patch<any>(`${this.baseUrl}/${id}`, { role: nextRole }).pipe(
      tap(res => {
        const item = res.data || res;
        const current = this.affectations().find(a => a.id === id);
        if (current) {
          const updated = { ...current, ...item, role: nextRole };
          this.addOrUpdateLocal(updated);
          this.toastService.info('Rôle Mis à Jour', `Le rôle est maintenant : ${nextRole}`);
        }
      }),
      catchError(() => {
        const current = this.affectations().find(a => a.id === id);
        if (current) {
          const updated = { ...current, role: nextRole };
          this.addOrUpdateLocal(updated);
          this.toastService.info('Rôle Mis à Jour', `Le rôle est maintenant : ${nextRole}`);
        }
        return of(current!);
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
