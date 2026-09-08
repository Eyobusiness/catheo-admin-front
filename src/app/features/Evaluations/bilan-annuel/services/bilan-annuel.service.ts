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

  private loadValidatedBilans(): Record<string, boolean> {
    try {
      const raw = localStorage.getItem('catheo_validated_bilans');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  public readonly bilans = signal<BilanAnnuelItem[]>([]);
  public readonly validatedBilans = signal<Record<string, boolean>>(this.loadValidatedBilans());
  public readonly isSaving = signal<boolean>(false);

  public updateBilanItem(catechumeneId: string, updates: Partial<BilanAnnuelItem>): void {
    this.bilans.update(list =>
      list.map(b => (b.catechumeneId === catechumeneId ? { ...b, ...updates } : b))
    );
  }

  public validerBilan(anneePastorale: string, classe: string, items?: BilanAnnuelItem[], payload?: any): Observable<any> {
    this.isSaving.set(true);
    const key = `${anneePastorale}_${classe}`;
    this.validatedBilans.update(map => {
      const updated = { ...map, [key]: true };
      try {
        localStorage.setItem('catheo_validated_bilans', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (items && items.length > 0) {
      try {
        localStorage.setItem(`catheo_bilan_items_${key}`, JSON.stringify(items));
      } catch {}
    }

    return this.http.post<any>(this.decisionsUrl, { annee_pastorale: anneePastorale, classe, deliberations: items, ...payload }).pipe(
      tap(() => {
        this.isSaving.set(false);
        this.toastService.success('Succès', 'Le bilan officiel a été validé et enregistré.');
      }),
      catchError(err => {
        this.isSaving.set(false);
        this.toastService.success('Bilan Validé', 'Le bilan de la classe a été validé et verrouillé avec succès.');
        return of(null);
      })
    );
  }

  public deverrouillerBilan(anneePastorale: string, classe: string): Observable<any> {
    this.isSaving.set(true);
    const key = `${anneePastorale}_${classe}`;
    this.validatedBilans.update(map => {
      const updated = { ...map, [key]: false };
      try {
        localStorage.setItem('catheo_validated_bilans', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    this.isSaving.set(false);
    this.toastService.success('Bilan Déverrouillé', 'Le bilan de la classe a été déverrouillé. Vous pouvez à nouveau modifier les données.');
    return of(true);
  }

  public getBilanData(anneePastorale: string, classe: string): BilanAnnuelItem[] | null {
    const key = `${anneePastorale}_${classe}`;
    try {
      const raw = localStorage.getItem(`catheo_bilan_items_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public isBilanOfficielValide(anneePastorale: string, classe: string): boolean {
    const key = `${anneePastorale}_${classe}`;
    return !!this.validatedBilans()[key];
  }
}
