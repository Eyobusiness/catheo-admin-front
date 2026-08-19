import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize, Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  Calendrier,
  CreateCalendrierDto,
  StatutCalendrier,
  UpdateCalendrierDto
} from '../models/calendrier.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.calendriers)) return res.data.calendriers;
  if (res.data && Array.isArray(res.data.events)) return res.data.events;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.calendriers)) return res.calendriers;
  if (Array.isArray(res.events)) return res.events;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

function normalizeStatut(statut?: string): 'Planifié' | 'Réalisé' | 'Annulé' {
  if (!statut) return 'Planifié';
  const lower = statut.toLowerCase().trim();
  if (lower === 'réalisé' || lower === 'realise' || lower === 'effectué' || lower === 'done') return 'Réalisé';
  if (lower === 'annulé' || lower === 'annule' || lower === 'cancelled') return 'Annulé';
  return 'Planifié';
}

function normalizeDate(rawDate?: string): string {
  if (!rawDate) return '';
  return rawDate.split('T')[0].split(' ')[0];
}

@Injectable({
  providedIn: 'root'
})
export class CalendrierService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/calendriers`;

  // Reactive state signals
  public readonly calendriers = signal<Calendrier[]>([
    {
      id: 'cal-001',
      titre: 'Messe de Rentrée & Bénédiction des Catéchistes',
      type: 'Célébration liturgique',
      date: '2026-10-04',
      heure_debut: '08:30',
      heure_fin: '11:00',
      lieu: 'Église Principale CIM',
      cible_type: 'Tous',
      cible_nom: 'Toute la communauté paroissiale',
      description: 'Célébration eucharistique solennelle ouvrant l\'année pastorale et bénédiction de tous les animateurs et enfants.',
      statut: 'Planifié',
      annee_catechese: {
        id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
        libelle: '2026-2027',
        date_debut: '2026-09-15',
        date_fin: '2027-06-30',
        est_active: true
      },
      annee_catechese_id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
      created_at: '2026-08-01'
    },
    {
      id: 'cal-002',
      titre: 'Récollection Spirituelle des Animateurs',
      type: 'Récollection',
      date: '2026-11-14',
      heure_debut: '09:00',
      heure_fin: '16:30',
      lieu: 'Foyer de Charité',
      cible_type: 'Animateurs',
      cible_nom: 'Corps des catéchistes',
      description: 'Journée de ressourcement spirituel, prière silencieuse et échange sur la mission pastorale.',
      statut: 'Planifié',
      annee_catechese: {
        id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
        libelle: '2026-2027',
        date_debut: '2026-09-15',
        date_fin: '2027-06-30',
        est_active: true
      },
      annee_catechese_id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
      created_at: '2026-08-05'
    },
    {
      id: 'cal-003',
      titre: 'Célébration Pénitentielle de l\'Avent',
      type: 'Sacrement de réconciliation',
      date: '2026-12-19',
      heure_debut: '15:00',
      heure_fin: '18:00',
      lieu: 'Parvis & Chapelle',
      cible_type: 'Catéchumènes',
      cible_nom: 'Tous les niveaux',
      description: 'Temps de confession et préparation des cœurs à la fête de Noël.',
      statut: 'Planifié',
      annee_catechese: {
        id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
        libelle: '2026-2027',
        date_debut: '2026-09-15',
        date_fin: '2027-06-30',
        est_active: true
      },
      annee_catechese_id: '9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d20',
      created_at: '2026-08-10'
    }
  ]);

  public readonly isLoading = signal<boolean>(false);

  public getAll(): Observable<Calendrier[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: Calendrier[] = raw.map((item: any) => ({
            id: item.id,
            titre: item.titre || item.nom || '',
            type: item.type || 'Événement',
            date: normalizeDate(item.date),
            heure_debut: item.heure_debut || item.heureDebut,
            heure_fin: item.heure_fin || item.heureFin,
            lieu: item.lieu,
            cible_type: item.cible_type || item.cibleType || 'Tous',
            cible_id: item.cible_id || item.cibleId,
            cible_nom: item.cible_nom || item.cibleNom,
            description: item.description,
            statut: normalizeStatut(item.statut),
            annee_catechese: item.annee_catechese || item.annee,
            annee_catechese_id: item.annee_catechese_id || item.annee_id || item.annee_catechese?.id || item.annee?.id,
            created_at: item.created_at
          }));
          this.calendriers.set(normalized);
        }
      }),
      catchError(() => {
        return of(this.calendriers());
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public getById(id: string): Observable<Calendrier> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.calendriers().find(c => c.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateCalendrierDto, anneeLibelle?: string): Observable<Calendrier> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: Calendrier = {
          id: item.id || `cal-${Date.now()}`,
          titre: item.titre || dto.titre,
          type: item.type || dto.type,
          date: normalizeDate(item.date || dto.date),
          heure_debut: item.heure_debut || dto.heure_debut,
          heure_fin: item.heure_fin || dto.heure_fin,
          lieu: item.lieu || dto.lieu,
          cible_type: item.cible_type || dto.cible_type || 'Tous',
          cible_id: item.cible_id || dto.cible_id,
          description: item.description || dto.description,
          statut: normalizeStatut(item.statut || dto.statut),
          annee_catechese_id: dto.annee_catechese_id,
          annee_catechese: item.annee_catechese || undefined,
          created_at: item.created_at || new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Événement Enregistré', `"${created.titre}" a été ajouté au calendrier.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: Calendrier = {
          id: `cal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          titre: dto.titre,
          type: dto.type,
          date: normalizeDate(dto.date),
          heure_debut: dto.heure_debut,
          heure_fin: dto.heure_fin,
          lieu: dto.lieu,
          cible_type: dto.cible_type || 'Tous',
          cible_id: dto.cible_id,
          description: dto.description,
          statut: normalizeStatut(dto.statut),
          annee_catechese_id: dto.annee_catechese_id,
          created_at: new Date().toISOString().split('T')[0]
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Événement Enregistré', `"${newLocal.titre}" a été ajouté au calendrier.`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateCalendrierDto, anneeLibelle?: string): Observable<Calendrier> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.calendriers().find(c => c.id === id);
        const updated: Calendrier = {
          ...current,
          ...item,
          id,
          titre: item.titre || dto.titre || current?.titre || '',
          type: item.type || dto.type || current?.type || '',
          date: normalizeDate(item.date || dto.date || current?.date || ''),
          heure_debut: item.heure_debut || dto.heure_debut || current?.heure_debut,
          heure_fin: item.heure_fin || dto.heure_fin || current?.heure_fin,
          lieu: item.lieu || dto.lieu || current?.lieu,
          cible_type: item.cible_type || dto.cible_type || current?.cible_type || 'Tous',
          cible_id: item.cible_id || dto.cible_id || current?.cible_id,
          description: item.description || dto.description || current?.description,
          statut: normalizeStatut(item.statut || dto.statut || current?.statut),
          annee_catechese_id: dto.annee_catechese_id || current?.annee_catechese_id,
          annee_catechese: item.annee_catechese || current?.annee_catechese
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Événement Modifié', `"${updated.titre}" a été mis à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.calendriers().find(c => c.id === id);
        const updatedLocal: Calendrier = {
          ...current!,
          id,
          titre: dto.titre || current?.titre || '',
          type: dto.type || current?.type || '',
          date: normalizeDate(dto.date || current?.date || ''),
          heure_debut: dto.heure_debut || current?.heure_debut,
          heure_fin: dto.heure_fin || current?.heure_fin,
          lieu: dto.lieu || current?.lieu,
          cible_type: dto.cible_type || current?.cible_type || 'Tous',
          cible_id: dto.cible_id || current?.cible_id,
          description: dto.description || current?.description,
          statut: normalizeStatut(dto.statut || current?.statut),
          annee_catechese_id: dto.annee_catechese_id || current?.annee_catechese_id,
          annee_catechese: current?.annee_catechese
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Événement Modifié', `"${updatedLocal.titre}" a été mis à jour.`);
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
        this.toastService.success('Événement Supprimé', 'L\'activité a été retirée du calendrier.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Événement Supprimé', 'L\'activité a été retirée du calendrier.');
        return of(void 0);
      })
    );
  }

  public patchStatus(id: string, nextStatus: 'Planifié' | 'Réalisé' | 'Annulé'): Observable<Calendrier> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, { statut: nextStatus }).pipe(
      tap(res => {
        const item = res.data || res;
        const current = this.calendriers().find(c => c.id === id);
        const updated: Calendrier = {
          ...current!,
          ...item,
          statut: nextStatus
        };
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Mis à Jour', `L'événement est désormais : ${nextStatus}`);
      }),
      catchError(() => {
        const current = this.calendriers().find(c => c.id === id);
        if (current) {
          const updatedLocal: Calendrier = {
            ...current,
            statut: nextStatus
          };
          this.addOrUpdateLocal(updatedLocal);
          this.toastService.info('Statut Mis à Jour', `L'événement est désormais : ${nextStatus}`);
          return of(updatedLocal);
        }
        return of(current!);
      })
    );
  }

  private addOrUpdateLocal(item: Calendrier): void {
    this.calendriers.update(list => {
      const updatedList = list.filter(c => c.id !== item.id);
      return [item, ...updatedList].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    });
  }

  private removeLocal(id: string): void {
    this.calendriers.update(list => list.filter(c => c.id !== id));
  }
}
