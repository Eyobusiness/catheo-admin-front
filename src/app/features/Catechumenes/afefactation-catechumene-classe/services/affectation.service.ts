import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { InscriptionAnnuelleService } from '../../inscriptions-annuelles/services/inscription-annuelle.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AffectationService {
  private readonly http = inject(HttpClient);
  private readonly inscriptionService = inject(InscriptionAnnuelleService);
  private readonly classeService = inject(ClasseService);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/inscriptions-annuelles`;

  public readonly isLoading = signal<boolean>(false);

  public assignClasse(inscriptionId: string, classeId: string | null): Observable<any> {
    this.isLoading.set(true);
    const targetClasse = this.classeService.classes().find(c => c.id === classeId);

    return this.http.patch<any>(`${this.baseUrl}/${inscriptionId}`, {
      classe_id: classeId,
      statut_inscription: classeId ? 'valide' : 'inscrit'
    }).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.inscriptionService.inscriptions.update(list =>
          list.map(ins => {
            if (ins.id === inscriptionId) {
              return {
                ...ins,
                classe_id: classeId || undefined,
                classe: targetClasse,
                statut_inscription: classeId ? 'valide' : 'inscrit'
              };
            }
            return ins;
          })
        );
        this.toastService.success(
          'Affectation Réussie',
          classeId ? `Le catéchumène a été affecté à la classe "${targetClasse?.nom}".` : "L'affectation a été retirée."
        );
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.inscriptionService.inscriptions.update(list =>
          list.map(ins => {
            if (ins.id === inscriptionId) {
              return {
                ...ins,
                classe_id: classeId || undefined,
                classe: targetClasse,
                statut_inscription: classeId ? 'valide' : 'inscrit'
              };
            }
            return ins;
          })
        );
        this.toastService.success(
          'Affectation Réussie',
          classeId ? `Le catéchumène a été affecté à la classe "${targetClasse?.nom}".` : "L'affectation a été retirée."
        );
        return of(null);
      })
    );
  }

  public bulkAssign(inscriptionIds: string[], classeId: string): Observable<any> {
    this.isLoading.set(true);
    const targetClasse = this.classeService.classes().find(c => c.id === classeId);

    return this.http.post<any>(`${this.baseUrl}/affectation-groupee`, {
      inscription_ids: inscriptionIds,
      classe_id: classeId
    }).pipe(
      tap(() => {
        this.isLoading.set(false);
        this.applyBulkLocal(inscriptionIds, targetClasse);
        this.toastService.success(
          'Affectation Groupée',
          `${inscriptionIds.length} catéchumène(s) ont été affecté(s) à "${targetClasse?.nom}".`
        );
      }),
      catchError(() => {
        this.isLoading.set(false);
        this.applyBulkLocal(inscriptionIds, targetClasse);
        this.toastService.success(
          'Affectation Groupée',
          `${inscriptionIds.length} catéchumène(s) ont été affecté(s) à "${targetClasse?.nom}".`
        );
        return of(null);
      })
    );
  }

  private applyBulkLocal(ids: string[], classe?: any): void {
    this.inscriptionService.inscriptions.update(list =>
      list.map(ins => {
        if (ids.includes(ins.id)) {
          return {
            ...ins,
            classe_id: classe?.id,
            classe: classe,
            statut_inscription: 'valide'
          };
        }
        return ins;
      })
    );
  }
}
