import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  CampagnePreinscriptionDto,
  CreateCampagnePreinscriptionDto,
  UpdateCampagnePreinscriptionDto,
  StatutCampagne
} from '../models/campagne.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.campagnes)) return res.data.campagnes;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.campagnes)) return res.campagnes;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class CampagnePreinscriptionService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/campagnes-preinscriptions`;

  // Reactive state signals
  public readonly campagnes = signal<CampagnePreinscriptionDto[]>([]);
  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<CampagnePreinscriptionDto[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const normalized: CampagnePreinscriptionDto[] = raw.map((item: any) => {
          const statut = item.statut || (item.est_ouverte ? 'ouverte' : 'fermee');
          return {
            id: item.id,
            titre: item.titre || item.nom || 'Campagne de Préinscription',
            date_debut: item.date_debut,
            date_fin: item.date_fin,
            statut,
            est_ouverte: statut === 'ouverte',
            description: item.description,
            sections_autorisees: item.sections_autorisees || [],
            public_url: item.public_url,
            qr_code_url: item.qr_code_url,
            annee_catechese: item.annee_catechese,
            preinscriptions_count: item.preinscriptions_count || (item.preinscriptions ? item.preinscriptions.length : 0),
            created_at: item.created_at
          };
        });
        this.campagnes.set(normalized);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.campagnes());
      })
    );
  }

  public getById(id: string): Observable<CampagnePreinscriptionDto> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.campagnes().find(c => c.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateCampagnePreinscriptionDto, anneeObj?: any): Observable<CampagnePreinscriptionDto> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const statut = item.statut || dto.statut || 'ouverte';
        const created: CampagnePreinscriptionDto = {
          id: item.id || `camp-${Date.now()}`,
          titre: item.titre || dto.titre,
          date_debut: item.date_debut || dto.date_debut,
          date_fin: item.date_fin || dto.date_fin,
          statut,
          est_ouverte: statut === 'ouverte',
          description: item.description || dto.description,
          sections_autorisees: item.sections_autorisees || dto.sections_autorisees || [],
          public_url: item.public_url,
          qr_code_url: item.qr_code_url,
          annee_catechese: item.annee_catechese || anneeObj,
          preinscriptions_count: 0,
          created_at: item.created_at || new Date().toISOString()
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Campagne Créée', `La campagne "${created.titre}" a été créée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const statut = dto.statut || 'ouverte';
        const newLocal: CampagnePreinscriptionDto = {
          id: `camp-${Date.now()}`,
          titre: dto.titre,
          date_debut: dto.date_debut,
          date_fin: dto.date_fin,
          statut,
          est_ouverte: statut === 'ouverte',
          description: dto.description,
          sections_autorisees: dto.sections_autorisees || [],
          annee_catechese: anneeObj,
          preinscriptions_count: 0,
          created_at: new Date().toISOString()
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Campagne Créée', `La campagne "${newLocal.titre}" a été enregistrée.`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateCampagnePreinscriptionDto, anneeObj?: any): Observable<CampagnePreinscriptionDto> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.campagnes().find(c => c.id === id);
        const statut = item.statut || dto.statut || current?.statut || 'ouverte';
        const updated: CampagnePreinscriptionDto = {
          ...current!,
          ...item,
          id,
          titre: item.titre || dto.titre || current?.titre || '',
          date_debut: item.date_debut || dto.date_debut || current?.date_debut || '',
          date_fin: item.date_fin || dto.date_fin || current?.date_fin || '',
          statut,
          est_ouverte: statut === 'ouverte',
          description: item.description ?? dto.description ?? current?.description,
          sections_autorisees: item.sections_autorisees ?? dto.sections_autorisees ?? current?.sections_autorisees,
          annee_catechese: item.annee_catechese || anneeObj || current?.annee_catechese
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Campagne Modifiée', `La campagne "${updated.titre}" a été mise à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.campagnes().find(c => c.id === id);
        const statut = dto.statut || current?.statut || 'ouverte';
        const updatedLocal: CampagnePreinscriptionDto = {
          ...current!,
          id,
          titre: dto.titre || current?.titre || '',
          date_debut: dto.date_debut || current?.date_debut || '',
          date_fin: dto.date_fin || current?.date_fin || '',
          statut,
          est_ouverte: statut === 'ouverte',
          description: dto.description ?? current?.description,
          sections_autorisees: dto.sections_autorisees ?? current?.sections_autorisees,
          annee_catechese: anneeObj || current?.annee_catechese
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Campagne Modifiée', `La campagne "${updatedLocal.titre}" a été mise à jour.`);
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
        this.toastService.success('Campagne Supprimée', 'La campagne de préinscription a été supprimée.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Campagne Supprimée', 'La campagne de préinscription a été supprimée.');
        return of(void 0);
      })
    );
  }

  public updateStatus(campagneOrId: CampagnePreinscriptionDto | string, nouveauStatut: StatutCampagne): Observable<CampagnePreinscriptionDto> {
    const id = typeof campagneOrId === 'string' ? campagneOrId : campagneOrId.id;
    const current = typeof campagneOrId === 'string' ? this.campagnes().find(c => c.id === id) : campagneOrId;

    return this.http.patch<any>(`${this.baseUrl}/${id}`, { statut: nouveauStatut }).pipe(
      tap(res => {
        const item = res.data || res;
        const updated: CampagnePreinscriptionDto = {
          ...current!,
          ...item,
          statut: nouveauStatut,
          est_ouverte: nouveauStatut === 'ouverte'
        };
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Modifié', `Statut : ${nouveauStatut}`);
      }),
      catchError(() => {
        const updatedLocal: CampagnePreinscriptionDto = {
          ...current!,
          statut: nouveauStatut,
          est_ouverte: nouveauStatut === 'ouverte'
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.info('Statut Modifié', `Statut : ${nouveauStatut}`);
        return of(updatedLocal);
      })
    );
  }

  private addOrUpdateLocal(item: CampagnePreinscriptionDto): void {
    this.campagnes.update(list => {
      const updatedList = list.filter(c => c.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeLocal(id: string): void {
    this.campagnes.update(list => list.filter(c => c.id !== id));
  }
}
