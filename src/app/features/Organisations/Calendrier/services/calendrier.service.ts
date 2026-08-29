import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
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

function mapToCalendrier(item: any): Calendrier {
  return {
    id: item.id,
    titre: item.titre || item.nom || '',
    type: item.type || 'Événement',
    date: normalizeDate(item.date),
    heure_debut: item.heure_debut || item.heureDebut,
    heure_fin: item.heure_fin || item.heureFin,
    lieu: item.lieu,
    cible_type: item.cible_type || item.cibleType || 'Tous',
    cible_id: item.cible_id || item.cibleId,
    cible_ids: Array.isArray(item.cible_ids) ? item.cible_ids : (item.cible_id ? String(item.cible_id).split(',') : undefined),
    cible_nom: item.cible_nom || item.cibleNom,
    description: item.description,
    statut: normalizeStatut(item.statut),
    annee_catechese: item.annee_catechese || item.annee,
    annee_catechese_id: item.annee_catechese_id || item.annee_id || item.annee_catechese?.id || item.annee?.id,
    created_at: item.created_at
  };
}

@Injectable({
  providedIn: 'root'
})
export class CalendrierService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/calendriers`;

  // Reactive state signals
  public readonly calendriers = signal<Calendrier[]>([]);
  public readonly isLoading = signal<boolean>(false);

  public getAll(filters?: { annee_catechese_id?: string; statut?: string; cible_type?: string; search?: string }): Observable<Calendrier[]> {
    this.isLoading.set(true);

    let params = new HttpParams();
    if (filters?.annee_catechese_id) params = params.set('annee_catechese_id', filters.annee_catechese_id);
    if (filters?.statut) params = params.set('statut', filters.statut);
    if (filters?.cible_type) params = params.set('cible_type', filters.cible_type);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const normalized: Calendrier[] = raw.map(mapToCalendrier);
        this.calendriers.set(normalized);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Erreur chargement calendrier:', err);
        const msg = err.error?.message || 'Impossible de charger les événements du calendrier.';
        this.toastService.error('Erreur Calendrier', msg);
        this.calendriers.set([]);
        return throwError(() => err);
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
        return mapToCalendrier(item);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Erreur chargement événement:', err);
        const msg = err.error?.message || 'Événement introuvable.';
        this.toastService.error('Erreur', msg);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateCalendrierDto, anneeLibelle?: string): Observable<Calendrier> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        const item: any = res.data || res;
        const created: Calendrier = mapToCalendrier(item);
        this.addOrUpdateLocal(created);
        this.toastService.success('Événement Enregistré', `"${created.titre}" a été planifié avec succès.`);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Erreur création événement:', err);
        const msg = err.error?.message || (err.error?.errors ? Object.values(err.error.errors).flat().join(', ') : 'Erreur lors de la création de l\'événement.');
        this.toastService.error('Échec de la création', msg);
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public update(id: string, dto: UpdateCalendrierDto, anneeLibelle?: string): Observable<Calendrier> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      catchError((putErr: HttpErrorResponse) => {
        // Fallback PATCH si le backend n'accepte que PATCH
        if (putErr.status === 405) {
          return this.http.patch<any>(`${this.baseUrl}/${id}`, dto);
        }
        return throwError(() => putErr);
      }),
      tap(res => {
        const item: any = res.data || res;
        const updated: Calendrier = mapToCalendrier(item);
        this.addOrUpdateLocal(updated);
        this.toastService.success('Événement Modifié', `"${updated.titre}" a été mis à jour avec succès.`);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Erreur modification événement:', err);
        const msg = err.error?.message || (err.error?.errors ? Object.values(err.error.errors).flat().join(', ') : 'Erreur lors de la modification de l\'événement.');
        this.toastService.error('Échec de la modification', msg);
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public delete(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.removeLocal(id);
        this.toastService.success('Événement Supprimé', 'L\'activité a été retirée du calendrier.');
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Erreur suppression événement:', err);
        const msg = err.error?.message || 'Erreur lors de la suppression de l\'événement.';
        this.toastService.error('Échec de suppression', msg);
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public patchStatus(id: string, nextStatus: 'Planifié' | 'Réalisé' | 'Annulé'): Observable<Calendrier> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, { statut: nextStatus }).pipe(
      catchError((patchErr: HttpErrorResponse) => {
        // Fallback standard endpoint si /status n'existe pas
        return this.http.patch<any>(`${this.baseUrl}/${id}`, { statut: nextStatus });
      }),
      tap(res => {
        const item = res.data || res;
        const updated = mapToCalendrier(item);
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Mis à Jour', `L'événement est désormais : ${nextStatus}`);
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Erreur mise à jour statut:', err);
        const msg = err.error?.message || 'Erreur lors de la mise à jour du statut.';
        this.toastService.error('Échec', msg);
        return throwError(() => err);
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

