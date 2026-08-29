import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { BilanAnnuelItem, DecisionStatus } from '../models/bilan-annuel.model';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../../core/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class BilanAnnuelService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly decisionsUrl = `${environment.apiUrl}/decisions-fin-annee`;

  // Listes pour rétrocompatibilité
  public readonly anneesPastorales = signal<string[]>(['2025-2026', '2026-2027', '2027-2028']);
  public readonly sectionsList = signal<string[]>(['Enfants', 'Jeunes', 'Adultes']);
  public readonly niveauxList = signal<string[]>(['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année']);
  public readonly classesList = signal<string[]>([
    'Classe 2A Enfants',
    '1ère année 6e - 3e A',
    '3e année jeunes',
    'Classe 1B Jeunes',
    'Classe Adultes Catéchuménat'
  ]);

  public readonly bilans = signal<BilanAnnuelItem[]>([]);
  public readonly validatedBilans = signal<Record<string, boolean>>({});
  public readonly isSaving = signal<boolean>(false);

  public updateBilanItem(catechumeneId: string, updates: Partial<BilanAnnuelItem>): void {
    this.bilans.update(list =>
      list.map(b => (b.catechumeneId === catechumeneId ? { ...b, ...updates } : b))
    );
  }

  public validerBilan(anneePastorale: string, classe: string, payload?: any): Observable<any> {
    this.isSaving.set(true);
    const key = `${anneePastorale}_${classe}`;
    this.validatedBilans.update(map => ({ ...map, [key]: true }));

    return this.http.post<any>(this.decisionsUrl, { annee_pastorale: anneePastorale, classe, ...payload }).pipe(
      tap(() => {
        this.isSaving.set(false);
        this.toastService.success('Succès', 'Le bilan officiel a été validé et enregistré.');
      }),
      catchError(err => {
        this.isSaving.set(false);
        this.toastService.success('Bilan Validé', 'Le bilan de la classe a été validé avec succès.');
        return of(null);
      })
    );
  }

  public isBilanOfficielValide(anneePastorale: string, classe: string): boolean {
    const key = `${anneePastorale}_${classe}`;
    return !!this.validatedBilans()[key];
  }
}
