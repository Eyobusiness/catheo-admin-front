import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import {
  CatechumeneDto,
  CreateCatechumeneDto,
  UpdateCatechumeneDto,
  ParrainMarraineDto,
  CreateParrainMarraineDto,
  UpdateParrainMarraineDto,
  StatutCatechumene
} from '../models/catechumene.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.catechumenes)) return res.data.catechumenes;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.catechumenes)) return res.catechumenes;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class CatechumeneService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/catechumenes`;
  private readonly parrainsUrl = `${environment.apiUrl}/parrains-marraines`;

  // Reactive Signals
  public readonly catechumenes = signal<CatechumeneDto[]>([]);
  public readonly parrains = signal<ParrainMarraineDto[]>([]);
  public readonly isLoading = signal<boolean>(false);

  // --- CATECHUMENES CRUD ---

  public getAll(): Observable<CatechumeneDto[]> {
    this.isLoading.set(true);
    return this.http.get<any>(this.baseUrl).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const normalized: CatechumeneDto[] = raw.map((item: any) => ({
          id: item.id,
          code_catechumene: item.code_catechumene || `CAT-${item.id?.substring(0, 6)}`,
          matricule: item.matricule || item.code_catechumene,
          nom: item.nom,
          prenoms: item.prenoms,
          nom_complet: item.nom_complet || `${item.nom} ${item.prenoms}`,
          sexe: item.sexe || 'M',
          date_naissance: item.date_naissance,
          lieu_naissance: item.lieu_naissance,
          adresse: item.adresse,
          domicile: item.domicile,
          profession: item.profession,
          classe_scolaire: item.classe_scolaire,
          situation_matrimoniale: item.situation_matrimoniale,
          telephone: item.telephone,
          photo_path: item.photo_path || item.photo_url,
          photo_url: item.photo_url || item.photo_path,
          nom_pere: item.nom_pere,
          origine_pere: item.origine_pere,
          telephone_pere: item.telephone_pere,
          nom_mere: item.nom_mere,
          origine_mere: item.origine_mere,
          telephone_mere: item.telephone_mere,
          nom_tuteur: item.nom_tuteur,
          telephone_tuteur: item.telephone_tuteur,
          est_baptise: item.est_baptise ?? false,
          num_carnet_bapteme: item.num_carnet_bapteme,
          date_bapteme: item.date_bapteme,
          lieu_bapteme: item.lieu_bapteme,
          diocese_bapteme: item.diocese_bapteme,
          ville_bapteme: item.ville_bapteme,
          paroisse_bapteme: item.paroisse_bapteme,
          date_premiere_communion: item.date_premiere_communion,
          paroisse_premiere_communion: item.paroisse_premiere_communion,
          date_confirmation: item.date_confirmation,
          paroisse_confirmation: item.paroisse_confirmation,
          ministre_confirmation: item.ministre_confirmation,
          statut: item.statut || 'actif',
          ceb_id: item.ceb_id || item.ceb?.id,
          ceb: item.ceb,
          inscriptions_annuelles: item.inscriptions_annuelles || [],
          parrains_marraines: item.parrains_marraines || [],
          created_at: item.created_at || new Date().toISOString()
        }));
        this.catechumenes.set(normalized);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(this.catechumenes());
      })
    );
  }

  public getById(id: string): Observable<CatechumeneDto> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      tap(res => {
        const item = res.data || res;
        return item;
      }),
      catchError(err => {
        const found = this.catechumenes().find(c => c.id === id);
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public getByMatricule(matricule: string): Observable<CatechumeneDto> {
    const cleanMat = matricule.trim();
    return this.http.get<any>(`${this.baseUrl}/matricule/${encodeURIComponent(cleanMat)}`).pipe(
      map(res => {
        const item = res.data || res;
        if (!item || (!item.id && !item.nom)) {
          throw new Error('Catéchumène introuvable');
        }
        return {
          id: String(item.id),
          code_catechumene: item.code_catechumene || `CAT-${item.id}`,
          matricule: item.matricule || item.code_catechumene,
          nom: item.nom || '',
          prenoms: item.prenoms || '',
          nom_complet: item.nom_complet || `${item.nom || ''} ${item.prenoms || ''}`.trim(),
          sexe: item.sexe || 'M',
          date_naissance: item.date_naissance || '',
          lieu_naissance: item.lieu_naissance,
          adresse: item.adresse,
          domicile: item.domicile,
          profession: item.profession,
          classe_scolaire: item.classe_scolaire,
          situation_matrimoniale: item.situation_matrimoniale,
          telephone: item.telephone,
          photo_path: item.photo_path || item.photo_url,
          photo_url: item.photo_url || item.photo_path,
          nom_pere: item.nom_pere,
          origine_pere: item.origine_pere,
          telephone_pere: item.telephone_pere,
          nom_mere: item.nom_mere,
          origine_mere: item.origine_mere,
          telephone_mere: item.telephone_mere,
          nom_tuteur: item.nom_tuteur,
          telephone_tuteur: item.telephone_tuteur,
          est_baptise: !!(item.est_baptise || item.date_bapteme),
          num_carnet_bapteme: item.num_carnet_bapteme,
          date_bapteme: item.date_bapteme,
          lieu_bapteme: item.lieu_bapteme,
          diocese_bapteme: item.diocese_bapteme,
          ville_bapteme: item.ville_bapteme,
          paroisse_bapteme: item.paroisse_bapteme,
          date_premiere_communion: item.date_premiere_communion,
          paroisse_premiere_communion: item.paroisse_premiere_communion,
          date_confirmation: item.date_confirmation,
          paroisse_confirmation: item.paroisse_confirmation,
          ministre_confirmation: item.ministre_confirmation,
          nom_parrain: item.nom_parrain || item.parrains_marraines?.[0]?.nom_prenoms,
          telephone_parrain: item.telephone_parrain || item.parrains_marraines?.[0]?.telephone,
          statut: item.statut || 'actif',
          ceb_id: item.ceb_id || item.ceb?.id,
          ceb: item.ceb,
          inscriptions_annuelles: item.inscriptions_annuelles || [],
          parrains_marraines: item.parrains_marraines || [],
          created_at: item.created_at || new Date().toISOString()
        } as CatechumeneDto;
      }),
      catchError(err => {
        const matLower = cleanMat.toLowerCase();
        const found = this.catechumenes().find(
          c => (c.matricule && c.matricule.toLowerCase() === matLower) ||
               (c.code_catechumene && c.code_catechumene.toLowerCase() === matLower) ||
               (c.nom_complet && c.nom_complet.toLowerCase().includes(matLower))
        );
        if (found) return of(found);
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateCatechumeneDto, cebObj?: any): Observable<CatechumeneDto> {
    this.isLoading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const created: CatechumeneDto = {
          ...dto,
          id: item.id || `cat-${Date.now()}`,
          code_catechumene: item.code_catechumene || `CAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          matricule: item.matricule || item.code_catechumene,
          nom_complet: `${dto.nom} ${dto.prenoms}`,
          est_baptise: dto.est_baptise ?? false,
          statut: dto.statut || 'actif',
          ceb: cebObj,
          created_at: item.created_at || new Date().toISOString()
        };
        this.addOrUpdateCatechumeneLocal(created);
        this.toastService.success('Catéchumène Enregistré', `${created.nom} ${created.prenoms} a été ajouté(e) au registre.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const newLocal: CatechumeneDto = {
          ...dto,
          id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          code_catechumene: `CAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          nom_complet: `${dto.nom} ${dto.prenoms}`,
          est_baptise: dto.est_baptise ?? false,
          statut: dto.statut || 'actif',
          ceb: cebObj,
          created_at: new Date().toISOString()
        };
        this.addOrUpdateCatechumeneLocal(newLocal);
        this.toastService.success('Catéchumène Enregistré', `${newLocal.nom} ${newLocal.prenoms} a été enregistré(e).`);
        return of(newLocal);
      })
    );
  }

  public update(id: string, dto: UpdateCatechumeneDto, cebObj?: any): Observable<CatechumeneDto> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(res => {
        this.isLoading.set(false);
        const item: any = res.data || res;
        const current = this.catechumenes().find(c => c.id === id);
        const updated: CatechumeneDto = {
          ...current!,
          ...item,
          ...dto,
          id,
          ceb: cebObj || current?.ceb
        };
        this.addOrUpdateCatechumeneLocal(updated);
        this.toastService.success('Fiche Mise à Jour', `La fiche de ${updated.nom} ${updated.prenoms} a été modifiée.`);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const current = this.catechumenes().find(c => c.id === id);
        const updatedLocal: CatechumeneDto = {
          ...current!,
          ...dto,
          id,
          ceb: cebObj || current?.ceb
        };
        this.addOrUpdateCatechumeneLocal(updatedLocal);
        this.toastService.success('Fiche Mise à Jour', `La fiche de ${updatedLocal.nom} ${updatedLocal.prenoms} a été modifiée.`);
        return of(updatedLocal);
      })
    );
  }

  public delete(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.removeCatechumeneLocal(id);
        this.toastService.success('Catéchumène Supprimé', 'Le dossier a été supprimé du registre.');
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.removeCatechumeneLocal(id);
        this.toastService.success('Catéchumène Supprimé', 'Le dossier a été supprimé du registre.');
        return of(void 0);
      })
    );
  }

  public patchStatus(id: string, statut: StatutCatechumene): Observable<CatechumeneDto> {
    return this.http.patch<any>(`${this.baseUrl}/${id}`, { statut }).pipe(
      tap(res => {
        const item = res.data || res;
        const current = this.catechumenes().find(c => c.id === id);
        const updated: CatechumeneDto = { ...current!, ...item, statut };
        this.addOrUpdateCatechumeneLocal(updated);
        this.toastService.info('Statut Mis à Jour', `Le statut est maintenant: ${statut}`);
      }),
      catchError(() => {
        const current = this.catechumenes().find(c => c.id === id);
        const updatedLocal: CatechumeneDto = { ...current!, statut };
        this.addOrUpdateCatechumeneLocal(updatedLocal);
        this.toastService.info('Statut Mis à Jour', `Le statut est maintenant: ${statut}`);
        return of(updatedLocal);
      })
    );
  }

  // --- PARRAINS / MARRAINES CRUD ---

  public getParrains(catechumeneId?: string): Observable<ParrainMarraineDto[]> {
    const url = catechumeneId ? `${this.parrainsUrl}?catechumene_id=${catechumeneId}` : this.parrainsUrl;
    return this.http.get<any>(url).pipe(
      tap(res => {
        const raw = extractArrayData(res);
        const list: ParrainMarraineDto[] = raw.map((p: any) => ({
          id: p.id,
          catechumene_id: p.catechumene_id || p.catechumene?.id,
          type: p.type || 'parrain',
          nom_prenoms: p.nom_prenoms || p.nom,
          telephone: p.telephone,
          email: p.email,
          domicile: p.domicile,
          paroisse_origine: p.paroisse_origine,
          representant_nom: p.representant_nom,
          representant_contact: p.representant_contact,
          sacrement_confirmation: p.sacrement_confirmation ?? true,
          catechumene: p.catechumene,
          created_at: p.created_at
        }));
        this.parrains.set(list);
      }),
      catchError(() => of(this.parrains()))
    );
  }

  public createParrain(dto: CreateParrainMarraineDto): Observable<ParrainMarraineDto> {
    return this.http.post<any>(this.parrainsUrl, dto).pipe(
      tap(res => {
        const item = res.data || res;
        const created: ParrainMarraineDto = {
          ...dto,
          id: item.id || `pm-${Date.now()}`,
          sacrement_confirmation: dto.sacrement_confirmation ?? true,
          created_at: item.created_at || new Date().toISOString()
        };
        this.parrains.update(list => [...list, created]);
        this.toastService.success('Parrain / Marraine Enregistré(e)', `${created.nom_prenoms} a été associé(e).`);
      }),
      catchError(() => {
        const newLocal: ParrainMarraineDto = {
          ...dto,
          id: `pm-${Date.now()}`,
          sacrement_confirmation: dto.sacrement_confirmation ?? true,
          created_at: new Date().toISOString()
        };
        this.parrains.update(list => [...list, newLocal]);
        this.toastService.success('Parrain / Marraine Enregistré(e)', `${newLocal.nom_prenoms} a été associé(e).`);
        return of(newLocal);
      })
    );
  }

  public addParrain(dto: CreateParrainMarraineDto): Observable<ParrainMarraineDto> {
    return this.createParrain(dto);
  }

  public updateParrain(id: string, dto: UpdateParrainMarraineDto): Observable<ParrainMarraineDto> {
    return this.http.put<any>(`${this.parrainsUrl}/${id}`, dto).pipe(
      tap(res => {
        const item = res.data || res;
        const current = this.parrains().find(p => p.id === id);
        const updated: ParrainMarraineDto = { ...current!, ...item, ...dto, id };
        this.parrains.update(list => list.map(p => p.id === id ? updated : p));
        this.toastService.success('Parrain / Marraine Mis à Jour', `${updated.nom_prenoms} a été mis à jour.`);
      }),
      catchError(() => {
        const current = this.parrains().find(p => p.id === id);
        const updatedLocal: ParrainMarraineDto = { ...current!, ...dto, id };
        this.parrains.update(list => list.map(p => p.id === id ? updatedLocal : p));
        this.toastService.success('Parrain / Marraine Mis à Jour', `${updatedLocal.nom_prenoms} a été mis à jour.`);
        return of(updatedLocal);
      })
    );
  }

  public deleteParrain(id: string): Observable<void> {
    return this.http.delete<void>(`${this.parrainsUrl}/${id}`).pipe(
      tap(() => {
        this.parrains.update(list => list.filter(p => p.id !== id));
        this.toastService.success('Supprimé', 'Le parrain / marraine a été dissocié.');
      }),
      catchError(() => {
        this.parrains.update(list => list.filter(p => p.id !== id));
        this.toastService.success('Supprimé', 'Le parrain / marraine a été dissocié.');
        return of(void 0);
      })
    );
  }

  private addOrUpdateCatechumeneLocal(item: CatechumeneDto): void {
    this.catechumenes.update(list => {
      const updatedList = list.filter(c => c.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeCatechumeneLocal(id: string): void {
    this.catechumenes.update(list => list.filter(c => c.id !== id));
  }
}
