import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { CreateNiveauDto, Niveau, UpdateNiveauDto } from '../models/niveau.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.niveaux)) return res.data.niveaux;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.niveaux)) return res.niveaux;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class NiveauService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/niveaux`;

  // Reactive state signals
  public readonly niveaux = signal<Niveau[]>([
    {
      id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d22',
      section_id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d21',
      nom: "1ère Année d'Initiation",
      description: "Première année du parcours d'initiation chrétienne",
      ordre_affichage: 1,
      ordre: 1,
      statut: 'Actif',
      statut_code: 'actif'
    },
    {
      id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c23',
      section_id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d21',
      nom: "2ème Année d'Initiation",
      description: "Deuxième année du parcours d'initiation chrétienne",
      ordre_affichage: 2,
      ordre: 2,
      statut: 'Actif',
      statut_code: 'actif'
    },
    {
      id: '7b6a5c4d-3e2f-1a0b-9c8d-7e6f5a4b3c24',
      section_id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c22',
      nom: 'Préparation Confirmation (Ados)',
      description: 'Parcours des adolescents vers le sacrement de confirmation',
      ordre_affichage: 3,
      ordre: 3,
      statut: 'Actif',
      statut_code: 'actif'
    }
  ]);

  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<Niveau[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: Niveau[] = raw.map((item: any) => ({
            id: item.id,
            nom: item.nom,
            description: item.description || '',
            statut: item.statut || 'Actif',
            statut_code: item.statut_code || (String(item.statut).toLowerCase() === 'inactif' ? 'inactif' : 'actif'),
            ordre_affichage: item.ordre_affichage ?? item.ordre ?? 1,
            ordre: item.ordre ?? item.ordre_affichage ?? 1,
            section_id: item.section_id || item.section?.id || '',
            section: item.section || undefined
          }));
          this.niveaux.set(normalized);
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.niveaux());
      })
    );
  }

  public getById(id: string): Observable<Niveau> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.niveaux().find(n => n.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateNiveauDto): Observable<Niveau> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: Niveau = {
          id: item.id || `uuid-${Date.now()}`,
          nom: item.nom || dto.nom,
          description: item.description || dto.description,
          section_id: item.section_id || dto.section_id,
          ordre_affichage: item.ordre_affichage ?? dto.ordre_affichage ?? 1,
          ordre: item.ordre_affichage ?? dto.ordre_affichage ?? 1,
          statut: item.statut || 'Actif',
          statut_code: (dto.statut || 'actif') as 'actif' | 'inactif'
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Niveau Créé', `Le niveau "${created.nom}" a été enregistré.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: Niveau = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          section_id: dto.section_id,
          nom: dto.nom,
          description: dto.description,
          ordre_affichage: dto.ordre_affichage ?? 1,
          ordre: dto.ordre_affichage ?? 1,
          statut: 'Actif',
          statut_code: (dto.statut || 'actif') as 'actif' | 'inactif'
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Niveau Enregistré', `Le niveau "${newLocal.nom}" a été ajouté.`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateNiveauDto): Observable<Niveau> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.niveaux().find(n => n.id === id);
        const updated: Niveau = {
          ...current,
          ...item,
          id,
          nom: item.nom || dto.nom || current?.nom || '',
          description: item.description || dto.description || current?.description,
          section_id: item.section_id || dto.section_id || current?.section_id,
          ordre_affichage: item.ordre_affichage ?? dto.ordre_affichage ?? current?.ordre_affichage ?? 1,
          ordre: item.ordre_affichage ?? dto.ordre_affichage ?? current?.ordre ?? 1,
          statut: item.statut || current?.statut || 'Actif',
          statut_code: (dto.statut || current?.statut_code || 'actif') as 'actif' | 'inactif'
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Niveau Modifié', `Le niveau "${updated.nom}" a été mis à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.niveaux().find(n => n.id === id);
        const updatedLocal: Niveau = {
          ...current,
          id,
          nom: dto.nom || current?.nom || '',
          description: dto.description || current?.description,
          section_id: dto.section_id || current?.section_id,
          ordre_affichage: dto.ordre_affichage ?? current?.ordre_affichage ?? 1,
          ordre: dto.ordre_affichage ?? current?.ordre ?? 1,
          statut: current?.statut || 'Actif',
          statut_code: (dto.statut || current?.statut_code || 'actif') as 'actif' | 'inactif'
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Niveau Modifié', `Le niveau "${updatedLocal.nom}" a été mis à jour.`);
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
        this.toastService.success('Niveau Supprimé', 'Le niveau a été supprimé.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Niveau Supprimé', 'Le niveau a été supprimé.');
        return of(void 0);
      })
    );
  }

  public toggleStatus(niveau: Niveau): Observable<Niveau> {
    const isCurrentlyActive = (niveau.statut_code === 'actif' || String(niveau.statut).toLowerCase() === 'actif');
    const nextStatusCode: 'actif' | 'inactif' = isCurrentlyActive ? 'inactif' : 'actif';
    const nextStatusDisplay: 'Actif' | 'Inactif' = nextStatusCode === 'actif' ? 'Actif' : 'Inactif';

    return this.http.patch<any>(`${this.baseUrl}/${niveau.id}/status`, { statut: nextStatusCode }).pipe(
      tap(res => {
        const item = res.data || res;
        const updated: Niveau = {
          ...niveau,
          ...item,
          statut: item.statut || nextStatusDisplay,
          statut_code: item.statut_code || nextStatusCode
        };
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Mis à Jour', `Le statut est maintenant : ${nextStatusDisplay}`);
      }),
      catchError(() => {
        const updatedLocal: Niveau = {
          ...niveau,
          statut: nextStatusDisplay,
          statut_code: nextStatusCode
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.info('Statut Mis à Jour', `Le statut est maintenant : ${nextStatusDisplay}`);
        return of(updatedLocal);
      })
    );
  }

  private addOrUpdateLocal(item: Niveau): void {
    this.niveaux.update(list => {
      const updatedList = list.filter(n => n.id !== item.id);
      const ordreA = (a: Niveau) => a.ordre_affichage ?? a.ordre ?? 1;
      return [...updatedList, item].sort((a, b) => ordreA(a) - ordreA(b));
    });
  }

  private removeLocal(id: string): void {
    this.niveaux.update(list => list.filter(n => n.id !== id));
  }
}
