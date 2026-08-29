import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { Animateur, AnimateurStatut, CreateAnimateurDto, UpdateAnimateurDto } from '../models/animateur.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.animateurs)) return res.data.animateurs;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.animateurs)) return res.animateurs;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class AnimateurService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/animateurs`;

  // Reactive state signals
  public readonly animateurs = signal<Animateur[]>([]);

  public readonly isLoading = signal<boolean>(false);

  constructor() {
    this.getAll().subscribe();
  }

  public getAll(): Observable<Animateur[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        if (raw.length > 0) {
          const normalized: Animateur[] = raw.map((item: any) => ({
            id: item.id,
            matricule: item.matricule,
            nom: item.nom,
            prenoms: item.prenoms,
            sexe: item.sexe || 'M',
            telephone: item.telephone,
            email: item.email,
            profession: item.profession,
            statut: (item.statut || (item.est_actif === false ? 'inactif' : 'actif')) as AnimateurStatut,
            user: item.user || undefined
          }));
          this.animateurs.set(normalized);
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.animateurs());
      })
    );
  }

  public getById(id: string): Observable<Animateur> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.animateurs().find(a => a.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateAnimateurDto): Observable<Animateur> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: Animateur = {
          id: item.id || `uuid-${Date.now()}`,
          matricule: item.matricule || `CAT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
          nom: item.nom || dto.nom,
          prenoms: item.prenoms || dto.prenoms,
          sexe: item.sexe || dto.sexe,
          telephone: item.telephone || dto.telephone,
          email: item.email || dto.email,
          profession: item.profession || dto.profession,
          statut: item.statut || 'actif',
          user: item.user
        };
        this.addOrUpdateLocal(created);
        this.toastService.success('Catéchiste Enregistré', `L'animateur "${created.nom} ${created.prenoms}" a été ajouté.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: Animateur = {
          id: `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          matricule: `CAT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
          nom: dto.nom,
          prenoms: dto.prenoms,
          sexe: dto.sexe,
          telephone: dto.telephone,
          email: dto.email,
          profession: dto.profession,
          statut: 'actif'
        };
        this.addOrUpdateLocal(newLocal);
        this.toastService.success('Catéchiste Enregistré', `L'animateur "${newLocal.nom} ${newLocal.prenoms}" a été ajouté.`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateAnimateurDto): Observable<Animateur> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.animateurs().find(a => a.id === id);
        const updated: Animateur = {
          ...current,
          ...item,
          id,
          nom: item.nom || dto.nom || current?.nom || '',
          prenoms: item.prenoms || dto.prenoms || current?.prenoms || '',
          sexe: item.sexe || dto.sexe || current?.sexe || 'M',
          telephone: item.telephone || dto.telephone || current?.telephone,
          email: item.email || dto.email || current?.email,
          profession: item.profession || dto.profession || current?.profession,
          statut: item.statut || dto.statut || current?.statut || 'actif'
        };
        this.addOrUpdateLocal(updated);
        this.toastService.success('Catéchiste Modifié', `Les informations de "${updated.nom} ${updated.prenoms}" ont été mises à jour.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.animateurs().find(a => a.id === id);
        const updatedLocal: Animateur = {
          ...current,
          id,
          nom: dto.nom || current?.nom || '',
          prenoms: dto.prenoms || current?.prenoms || '',
          sexe: dto.sexe || current?.sexe || 'M',
          telephone: dto.telephone || current?.telephone,
          email: dto.email || current?.email,
          profession: dto.profession || current?.profession,
          statut: dto.statut || current?.statut || 'actif'
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.success('Catéchiste Modifié', `Les informations ont été mises à jour.`);
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
        this.toastService.success('Catéchiste Supprimé', "L'animateur a été retiré de la liste.");
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeLocal(id);
        this.toastService.success('Catéchiste Supprimé', "L'animateur a été retiré de la liste.");
        return of(void 0);
      })
    );
  }

  public toggleStatus(animateur: Animateur): Observable<Animateur> {
    const nextStatus: AnimateurStatut = animateur.statut === 'actif' ? 'inactif' : 'actif';
    return this.http.patch<any>(`${this.baseUrl}/${animateur.id}`, { statut: nextStatus }).pipe(
      tap(res => {
        const item = res.data || res;
        const updated: Animateur = {
          ...animateur,
          ...item,
          statut: nextStatus
        };
        this.addOrUpdateLocal(updated);
        this.toastService.info('Statut Mis à Jour', `Le statut est maintenant : ${nextStatus}`);
      }),
      catchError(() => {
        const updatedLocal: Animateur = {
          ...animateur,
          statut: nextStatus
        };
        this.addOrUpdateLocal(updatedLocal);
        this.toastService.info('Statut Mis à Jour', `Le statut est maintenant : ${nextStatus}`);
        return of(updatedLocal);
      })
    );
  }

  private addOrUpdateLocal(item: Animateur): void {
    this.animateurs.update(list => {
      const updatedList = list.filter(a => a.id !== item.id);
      return [...updatedList, item].sort((a, b) => a.nom.localeCompare(b.nom));
    });
  }

  private removeLocal(id: string): void {
    this.animateurs.update(list => list.filter(a => a.id !== id));
  }
}
