import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import {
  CaisseMouvementDto,
  CaisseKpisDto,
  CreateMouvementCaisseDto,
  RemboursementCaisseDto,
  TypeMouvementCaisse
} from '../models/caisse.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: unknown): Record<string, unknown>[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as Record<string, unknown>[];

  const obj = res as Record<string, any>;
  if (Array.isArray(obj['data'])) return obj['data'];
  if (obj['data'] && typeof obj['data'] === 'object') {
    const d = obj['data'];
    if (Array.isArray(d['data'])) return d['data'];
    for (const key of ['mouvements', 'caisse', 'ecritures', 'operations', 'transactions', 'items', 'list', 'records']) {
      if (Array.isArray(d[key])) return d[key];
    }
  }
  for (const key of ['mouvements', 'caisse', 'ecritures', 'operations', 'transactions', 'items', 'journal', 'records']) {
    if (Array.isArray(obj[key])) return obj[key];
  }
  return [];
}

function extractItemData<T>(res: unknown): T {
  const response = res as Record<string, any> | null | undefined;
  if (!response) return {} as T;
  if (response['data']?.['mouvement']) return response['data']['mouvement'] as T;
  if (response['data']?.['ecriture']) return response['data']['ecriture'] as T;
  if (response['data']) return response['data'] as T;
  return response as T;
}

@Injectable({
  providedIn: 'root'
})
export class CaisseService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/caisse-paroissiale`;

  public readonly mouvements = signal<CaisseMouvementDto[]>([]);
  public readonly kpis = signal<CaisseKpisDto>({
    solde_en_caisse: 0,
    total_encaisse: 0,
    total_rembourse: 0,
    paiements_valides_count: 0
  });
  public readonly isLoading = signal<boolean>(false);

  public getAll(
    typeMouvement?: TypeMouvementCaisse,
    search?: string,
    dateDebut?: string,
    dateFin?: string
  ): Observable<CaisseMouvementDto[]> {
    this.isLoading.set(true);

    let params = new HttpParams();
    if (typeMouvement) params = params.set('type_mouvement', typeMouvement);
    if (search) params = params.set('search', search);
    if (dateDebut) params = params.set('date_debut', dateDebut);
    if (dateFin) params = params.set('date_fin', dateFin);

    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(res => {
        const response = res as Record<string, any> | null | undefined;
        const k = response?.['kpis'] || response?.['data']?.['kpis'] || response?.['meta']?.['kpis'];
        if (k && typeof k === 'object') {
          this.kpis.set({
            solde_en_caisse: this.parseNumber(k['solde_en_caisse']),
            total_encaisse: this.parseNumber(k['total_encaisse']),
            total_rembourse: this.parseNumber(k['total_rembourse']),
            paiements_valides_count: this.parseNumber(k['paiements_valides_count'])
          });
        }
        return extractArrayData(res).map(item => this.normalizeMouvement(item));
      }),
      tap(mouvements => {
        this.mouvements.set(mouvements);
        this.recalculateLocalKpis(mouvements);
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Chargement Impossible',
          this.buildErrorMessage(err, 'Le livre de caisse n\'a pas pu être récupéré.')
        );
        return of(this.mouvements());
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public create(dto: CreateMouvementCaisseDto): Observable<CaisseMouvementDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(this.baseUrl, dto).pipe(
      map(res => this.normalizeMouvement(extractItemData(res), dto)),
      tap(created => {
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Mouvement Enregistré',
          `L'opération de caisse « ${created.libelle} » (${created.montant.toLocaleString('fr-FR')} FCFA) a été enregistrée.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Enregistrement Impossible', 'L\'opération de caisse n\'a pas pu être créée.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public rembourser(uuid: string, dto: RemboursementCaisseDto): Observable<CaisseMouvementDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(`${this.baseUrl}/${uuid}/rembourser`, dto).pipe(
      map(res => this.normalizeMouvement(extractItemData(res))),
      tap(created => {
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Remboursement Effectué',
          `Le remboursement de ${dto.montant_rembourse ? dto.montant_rembourse.toLocaleString('fr-FR') + ' FCFA' : ''} a été inscrit au journal de caisse.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Remboursement Échoué', 'Le remboursement n\'a pas pu être validé.')
      ),
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
        this.toastService.success('Écriture Supprimée', 'L\'écriture de caisse a été supprimée.');
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Suppression Impossible',
          this.buildErrorMessage(err, 'L\'écriture de caisse n\'a pas pu être supprimée.')
        );
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private normalizeMouvement(
    rawItem: Record<string, unknown>,
    fallback: Partial<CaisseMouvementDto | CreateMouvementCaisseDto> = {}
  ): CaisseMouvementDto {
    const item = rawItem || {};
    const fb = fallback as Record<string, unknown>;

    const rawType = this.pickString(item['type_mouvement'], item['type'], item['sens'], item['flux'], fb['type_mouvement']);
    let typeMouvement: TypeMouvementCaisse = 'entree';
    if (rawType) {
      const t = rawType.toLowerCase().trim();
      if (t.includes('sort') || t.includes('depense') || t.includes('debit')) typeMouvement = 'sortie';
      else if (t.includes('rembours') || t.includes('refund')) typeMouvement = 'remboursement';
      else typeMouvement = 'entree';
    }

    const rawMontant = item['montant'] ?? item['valeur'] ?? item['credit'] ?? item['debit'] ?? fb['montant'];
    const montant = this.parseNumber(rawMontant, 0);

    const ref = this.pickString(item['reference_document'], item['reference'], item['numero_recu'], item['piece_numero'], fb['reference_document']);
    const libelle = this.pickString(item['libelle'], item['motif'], item['description'], item['titre'], fb['libelle']) || 'Mouvement de caisse';
    const categorie = this.pickString(item['categorie'], item['type_frais'], item['rubrique'], fb['categorie']) || 'Cotisation';
    const dateMvt = this.pickString(item['date_mouvement'], item['date_paiement'], item['date'], item['created_at'], fb['date_mouvement']) || new Date().toISOString().substring(0, 10);
    const soldeApres = item['solde_apres'] !== undefined ? this.parseNumber(item['solde_apres']) : undefined;
    const caissier = this.pickString(item['caissier_nom'], (item['user'] as any)?.name, item['effectue_par'], item['caissier']);

    return {
      id: this.pickString(item['id'], item['uuid'], fb['id']) || '',
      type_mouvement: typeMouvement,
      categorie,
      montant,
      reference_document: ref,
      libelle,
      date_mouvement: dateMvt,
      annee_catechese_id: this.pickString(item['annee_catechese_id'], fb['annee_catechese_id']),
      annee_catechese: (item['annee_catechese'] as any) || (fb['annee_catechese'] as any),
      solde_apres: soldeApres,
      mode_paiement: this.optionalString(item['mode_paiement']),
      caissier_nom: caissier,
      created_at: this.optionalString(item['created_at']) ?? (fb['created_at'] as string | undefined),
      updated_at: this.optionalString(item['updated_at']) ?? (fb['updated_at'] as string | undefined)
    };
  }

  private recalculateLocalKpis(list: CaisseMouvementDto[]): void {
    const totalEncaisse = list
      .filter(m => m.type_mouvement === 'entree' || m.type_mouvement === 'recette')
      .reduce((sum, m) => sum + m.montant, 0);

    const totalRembourse = list
      .filter(m => m.type_mouvement === 'sortie' || m.type_mouvement === 'depense' || m.type_mouvement === 'remboursement')
      .reduce((sum, m) => sum + m.montant, 0);

    const solde = totalEncaisse - totalRembourse;

    this.kpis.update(current => ({
      solde_en_caisse: current.solde_en_caisse || solde,
      total_encaisse: current.total_encaisse || totalEncaisse,
      total_rembourse: current.total_rembourse || totalRembourse,
      paiements_valides_count: current.paiements_valides_count || list.filter(m => m.type_mouvement === 'entree').length
    }));
  }

  private parseNumber(value: unknown, fallback: number = 0): number {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  }

  private pickString(...values: unknown[]): string | undefined {
    for (const val of values) {
      const normalized = this.optionalString(val);
      if (normalized) return normalized;
    }
    return undefined;
  }

  private optionalString(value: unknown): string | undefined {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || undefined;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return undefined;
  }

  private handleWriteError(err: HttpErrorResponse, title: string, fallbackMessage: string): Observable<never> {
    this.toastService.error(title, this.buildErrorMessage(err, fallbackMessage));
    return throwError(() => err);
  }

  private buildErrorMessage(err: HttpErrorResponse, fallbackMessage: string): string {
    if (err.error?.errors && typeof err.error.errors === 'object') {
      const errorList = Object.entries(err.error.errors)
        .map(([field, msgs]) => {
          const detail = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
          return `${field}: ${detail}`;
        })
        .join(' | ');
      if (errorList.trim()) return errorList;
    }

    const apiMessage = err.error?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }
    return fallbackMessage;
  }

  private addOrUpdateLocal(item: CaisseMouvementDto): void {
    this.mouvements.update(list => {
      const updatedList = list.filter(m => m.id !== item.id);
      return [item, ...updatedList];
    });
    this.recalculateLocalKpis(this.mouvements());
  }

  private removeLocal(id: string): void {
    this.mouvements.update(list => list.filter(m => m.id !== id));
    this.recalculateLocalKpis(this.mouvements());
  }
}
