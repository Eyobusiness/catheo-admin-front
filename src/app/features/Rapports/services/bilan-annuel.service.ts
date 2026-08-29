import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BilanAnnuelData, BilanAnnuelResponse } from '../models/bilan-annuel.model';
import { ToastService } from '../../../core/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class BilanAnnuelService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/dashboard/bilan-annuel`;

  public readonly bilanData = signal<BilanAnnuelData | null>(null);
  public readonly isLoading = signal<boolean>(false);

  /**
   * Charger le Bilan Annuel pour une année pastorale spécifique ou l'année active
   * GET /api/v1/dashboard/bilan-annuel/{anneeCatecheseId?}
   */
  public getBilanAnnuel(anneeId?: string | number): Observable<BilanAnnuelResponse | null> {
    this.isLoading.set(true);
    const url = anneeId ? `${this.apiUrl}/${anneeId}` : this.apiUrl;

    return this.http.get<BilanAnnuelResponse>(url).pipe(
      tap({
        next: (res) => {
          this.bilanData.set(res?.data || null);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.toastService.error(
          'Bilan Annuel',
          error.error?.message || 'Impossible de récupérer le bilan pastoral annuel.'
        );
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }
}
