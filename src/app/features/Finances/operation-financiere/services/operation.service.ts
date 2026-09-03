import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import {
  OperationPaiementDto,
  CreateOperationDto,
  UpdateOperationDto,
  PayerOperationDto,
  StorePaiementDto,
  StatutOperation
} from '../models/operation.model';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

function extractArrayData(res: unknown): Record<string, unknown>[] {
  const response = res as Record<string, any> | null | undefined;
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response['data'])) return response['data'];
  if (response['data'] && typeof response['data'] === 'object') {
    const d = response['data'];
    if (Array.isArray(d['data'])) return d['data'];
    if (Array.isArray(d['operations'])) return d['operations'];
    if (Array.isArray(d['operations_paiements'])) return d['operations_paiements'];
    if (Array.isArray(d['items'])) return d['items'];
  }
  if (Array.isArray(response['operations'])) return response['operations'];
  if (Array.isArray(response['operations_paiements'])) return response['operations_paiements'];
  if (Array.isArray(response['items'])) return response['items'];
  return [];
}

function extractItemData<T>(res: unknown): T {
  const response = res as Record<string, any> | null | undefined;
  if (!response) return {} as T;
  if (response['data']?.['operation']) return response['data']['operation'] as T;
  if (response['data']) return response['data'] as T;
  return response as T;
}

@Injectable({
  providedIn: 'root'
})
export class OperationFinanciereService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/operations-paiements`;
  private readonly paiementUrl = `${environment.apiUrl}/paiements`;

  public readonly operations = signal<OperationPaiementDto[]>([]);
  public readonly isLoading = signal<boolean>(false);

  public getAll(statut?: StatutOperation, catechumeneId?: string, search?: string): Observable<OperationPaiementDto[]> {
    this.isLoading.set(true);

    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    if (catechumeneId) params = params.set('catechumene_id', catechumeneId);
    if (search) params = params.set('search', search);

    return this.http.get<unknown>(this.baseUrl, { params }).pipe(
      map(res => extractArrayData(res).map(item => this.normalizeOperation(item))),
      tap(operations => {
        this.operations.set(operations);
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Chargement Impossible',
          this.buildErrorMessage(err, 'Les opérations de paiement n\'ont pas pu être récupérées.')
        );
        return of(this.operations());
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public getById(id: string): Observable<OperationPaiementDto> {
    return this.http.get<unknown>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.normalizeOperation(extractItemData(res))),
      tap(item => {
        this.addOrUpdateLocal(item);
      }),
      catchError((err: HttpErrorResponse) => {
        const found = this.operations().find(o => o.id === id);
        if (found) return of(found);
        this.toastService.error(
          'Opération Introuvable',
          this.buildErrorMessage(err, 'L\'opération de paiement demandée est introuvable.')
        );
        return throwError(() => err);
      })
    );
  }

  public create(dto: CreateOperationDto): Observable<OperationPaiementDto> {
    this.isLoading.set(true);

    return this.http.post<unknown>(this.baseUrl, dto).pipe(
      map(res => this.normalizeOperation(extractItemData(res), dto)),
      tap(created => {
        this.addOrUpdateLocal(created);
        this.toastService.success(
          'Opération Créée',
          `L'opération ${created.reference} pour "${created.libelle}" (${(created.montant_total || 0).toLocaleString('fr-FR')} FCFA) a été enregistrée.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Création Impossible', 'L\'opération n\'a pas pu être créée.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public update(id: string, dto: UpdateOperationDto): Observable<OperationPaiementDto> {
    this.isLoading.set(true);

    return this.http.put<unknown>(`${this.baseUrl}/${id}`, dto).pipe(
      map(res =>
        this.normalizeOperation(extractItemData(res), {
          ...dto,
          id,
          ...this.operations().find(o => o.id === id)
        })
      ),
      tap(updated => {
        this.addOrUpdateLocal(updated);
        this.toastService.success(
          'Opération Modifiée',
          `L'opération ${updated.reference} a été mise à jour avec succès.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Modification Impossible', 'L\'opération n\'a pas pu être modifiée.')
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
        this.toastService.success('Opération Supprimée', 'L\'opération a été supprimée avec succès.');
      }),
      catchError((err: HttpErrorResponse) => {
        this.toastService.error(
          'Suppression Impossible',
          this.buildErrorMessage(err, 'L\'opération n\'a pas pu être supprimée.')
        );
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public payerOperation(id: string, dto: PayerOperationDto = {}): Observable<any> {
    this.isLoading.set(true);

    return this.http.post<any>(`${this.baseUrl}/${id}/payer`, dto).pipe(
      tap((res: any) => {
        const numeroRecu = res?.data?.numero_recu || res?.numero_recu || 'REC-AUTO';
        this.operations.update(list =>
          list.map(op => {
            if (op.id === id) {
              return {
                ...op,
                statut: 'paye',
                montant_paye: op.montant_total,
                montant_restant: 0
              };
            }
            return op;
          })
        );
        this.toastService.success(
          'Paiement Encaissé',
          `Le reçu n° ${numeroRecu} a été généré avec succès et enregistré en caisse.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Paiement Échoué', 'Le paiement n\'a pas pu être validé.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public genererParTarif(tarifId: string): Observable<any> {
    this.isLoading.set(true);

    return this.http.post<any>(`${this.baseUrl}/generer-par-tarif`, { tarif_id: tarifId }).pipe(
      tap((res: any) => {
        const count = res?.count || res?.data?.count || 0;
        this.toastService.success(
          'Génération Réussie',
          res?.message || `${count} opération(s) de paiement générée(s).`
        );
        // Refresh list
        this.getAll().subscribe();
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Génération Échouée', 'Impossible de générer les opérations pour ce tarif.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public genererPourInscription(inscriptionId: string): Observable<any> {
    this.isLoading.set(true);

    return this.http.post<any>(`${environment.apiUrl}/inscriptions-annuelles/${inscriptionId}/generer-operation-paiement`, {}).pipe(
      tap((res: any) => {
        this.toastService.success(
          'Opération Générée',
          res?.message || 'L\'opération de paiement a été générée pour cette inscription.'
        );
        this.getAll().subscribe();
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Génération Échouée', 'Impossible de générer l\'opération de paiement pour cette inscription.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  public encaisser(operationId: string, dto: StorePaiementDto): Observable<any> {
    this.isLoading.set(true);

    return this.http.post<unknown>(this.paiementUrl, dto).pipe(
      tap((res: any) => {
        this.operations.update(list =>
          list.map(op => {
            if (op.id === operationId) {
              return {
                ...op,
                statut: 'paye',
                montant_paye: op.montant_total,
                montant_restant: 0
              };
            }
            return op;
          })
        );
        const numeroRecu = res?.data?.numero_recu || 'Paiement';
        this.toastService.success(
          'Encaissement Réussi',
          `Le reçu ${numeroRecu} a été généré et les fonds ont été crédités en Caisse.`
        );
      }),
      catchError((err: HttpErrorResponse) =>
        this.handleWriteError(err, 'Encaissement Échoué', 'L\'encaissement n\'a pas pu être enregistré.')
      ),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private normalizeOperation(
    rawItem: Record<string, unknown>,
    fallback: Partial<OperationPaiementDto | CreateOperationDto | UpdateOperationDto> = {}
  ): OperationPaiementDto {
    const item = rawItem || {};
    const fb = fallback as Record<string, unknown>;

    const rawStatut = this.pickString(item['statut'], fb['statut']);
    const rawMontant = item['montant_total'] ?? item['montant'] ?? (item['tarif'] as any)?.['montant'] ?? fb['montant_total'] ?? fb['montant'];
    const montantTotal = this.parseNumber(rawMontant, 0);

    const rawPaye = item['montant_paye'] ?? item['paye'] ?? item['total_paye'];
    let montantPaye = this.parseNumber(rawPaye, 0);

    // If montantPaye was not set by backend, infer from statut
    if (rawPaye === undefined || rawPaye === null) {
      if (rawStatut === 'paye' || rawStatut === 'payee' || rawStatut === 'solde') {
        montantPaye = montantTotal;
      }
    }

    const rawRestant = item['montant_restant'] ?? item['reste'] ?? Math.max(0, montantTotal - montantPaye);
    const montantRestant = this.parseNumber(rawRestant, Math.max(0, montantTotal - montantPaye));

    const statut = this.normalizeStatut(rawStatut, montantPaye, montantTotal);

    // Normalize catechumene object safely
    const rawCat = (item['catechumene'] as any) || (item['inscription_annuelle'] as any)?.['catechumene'] || (fb['catechumene'] as any);
    const catechumene = rawCat ? {
      id: this.pickString(rawCat.id, rawCat.uuid) || '',
      matricule: this.pickString(rawCat.matricule, rawCat.code_catechumene, rawCat.code),
      nom: this.pickString(rawCat.nom) || '',
      prenom: this.pickString(rawCat.prenom, rawCat.prenoms) || '',
      prenoms: this.pickString(rawCat.prenoms, rawCat.prenom) || '',
      nom_complet: this.pickString(rawCat.nom_complet, `${rawCat.nom || ''} ${rawCat.prenoms || rawCat.prenom || ''}`.trim()),
      classe_nom: this.pickString(rawCat.classe_nom, rawCat.classe?.nom),
      niveau_nom: this.pickString(rawCat.niveau_nom, rawCat.niveau?.nom),
      telephone: this.pickString(rawCat.telephone, rawCat.contact)
    } : undefined;

    const rawLibelle = this.pickString(item['libelle'], fb['libelle']) || 'Frais de catéchèse';
    const libelle = this.cleanLibelle(rawLibelle, catechumene);

    return {
      id: this.pickString(item['id'], item['uuid'], fb['id']) || '',
      uuid: this.pickString(item['uuid'], item['id']),
      reference: this.pickString(item['reference'], fb['reference']) || 'OP-AUTO',
      libelle,
      type_tarif: this.pickString(item['type_tarif'], fb['type_tarif']),
      montant_total: montantTotal,
      montant: montantTotal,
      montant_paye: montantPaye,
      montant_restant: montantRestant,
      echeance: this.optionalString(item['echeance']) ?? (fb['echeance'] as string | undefined),
      statut,
      annee_catechese_id: this.pickString(
        item['annee_catechese_id'],
        item['annee_id'],
        (item['annee_catechese'] as any)?.id,
        (item['annee_catechese'] as any)?.uuid,
        (item['inscription_annuelle'] as any)?.annee_catechese_id,
        (item['inscription_annuelle'] as any)?.annee_id,
        fb['annee_catechese_id']
      ),
      annee_libelle: this.pickString(
        item['annee_libelle'],
        (item['annee_catechese'] as any)?.libelle,
        (item['annee_catechese'] as any)?.nom,
        (item['inscription_annuelle'] as any)?.annee_libelle,
        (item['inscription_annuelle'] as any)?.annee_catechese?.libelle,
        fb['annee_libelle']
      ),
      annee_catechese: (item['annee_catechese'] as any) || (fb['annee_catechese'] as any),
      catechumene_id: this.pickString(
        item['catechumene_id'],
        rawCat?.id,
        rawCat?.uuid,
        (item['inscription_annuelle'] as any)?.catechumene_id,
        (item['inscription_annuelle'] as any)?.catechumene?.id,
        fb['catechumene_id']
      ),
      catechumene,
      tarif_id: this.pickString(
        item['tarif_id'],
        (item['tarif'] as any)?.id,
        (item['tarif'] as any)?.uuid,
        (item['lignes_paiements'] as any)?.[0]?.tarif_id,
        (item['lignes'] as any)?.[0]?.tarif_id,
        fb['tarif_id']
      ),
      tarif_intitule: this.pickString(
        item['tarif_intitule'],
        (item['tarif'] as any)?.intitule,
        (item['tarif'] as any)?.libelle,
        fb['tarif_intitule']
      ),
      tarif: (item['tarif'] as any) || (fb['tarif'] as any),
      inscription_annuelle_id: this.pickString(
        item['inscription_annuelle_id'],
        (item['inscription_annuelle'] as any)?.id,
        fb['inscription_annuelle_id']
      ),
      lignes_paiements: (item['lignes_paiements'] as any) || (fb['lignes_paiements'] as any) || [],
      created_at: this.optionalString(item['created_at']) ?? (fb['created_at'] as string | undefined),
      updated_at: this.optionalString(item['updated_at']) ?? (fb['updated_at'] as string | undefined)
    };
  }

  private normalizeStatut(val: unknown, montantPaye: number, montantTotal: number): StatutOperation {
    if (typeof val === 'string') {
      const s = val.toLowerCase().trim().replace(/\s+/g, '_');
      if (s === 'paye' || s === 'payee' || s === 'paid' || s === 'solde' || s === 'valide') return 'paye';
      if (s === 'partiel' || s === 'partiellement_paye' || s === 'partielle' || s === 'partial') return 'partiellement_paye';
      if (s === 'annule' || s === 'annulee' || s === 'cancelled') return 'annule';
      if (s === 'en_attente' || s === 'non_paye' || s === 'pending' || s === 'impaye') return 'en_attente';
    }
    if (montantTotal > 0 && montantPaye >= montantTotal) return 'paye';
    if (montantPaye > 0 && montantPaye < montantTotal) return 'partiellement_paye';
    return 'en_attente';
  }

  private cleanLibelle(libelle?: string, catechumene?: { nom?: string; prenoms?: string; nom_complet?: string }): string {
    if (!libelle) return 'Frais de catéchèse';
    let cleaned = libelle;
    if (catechumene) {
      const candidates = [
        catechumene.nom_complet,
        catechumene.nom && catechumene.prenoms ? `${catechumene.nom} ${catechumene.prenoms}` : '',
        catechumene.nom && catechumene.prenoms ? `${catechumene.prenoms} ${catechumene.nom}` : '',
        catechumene.nom,
        catechumene.prenoms
      ].filter(Boolean);

      for (const name of candidates) {
        if (name && name.length >= 2) {
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\s*-\\s*${escaped}\\s*$`, 'i');
          cleaned = cleaned.replace(regex, '');
        }
      }
    }
    return cleaned.trim();
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

  private addOrUpdateLocal(item: OperationPaiementDto): void {
    this.operations.update(list => {
      const updatedList = list.filter(o => o.id !== item.id);
      return [item, ...updatedList];
    });
  }

  private removeLocal(id: string): void {
    this.operations.update(list => list.filter(o => o.id !== id));
  }
}
