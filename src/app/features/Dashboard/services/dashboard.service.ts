import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummaryData, DashboardSummaryResponse } from '../models/dashboard.model';
import { ToastService } from '../../../core/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  public readonly dashboardData = signal<DashboardSummaryData | null>(null);
  public readonly isLoading = signal<boolean>(false);

  /**
   * Charger la synthèse générale du Dashboard
   * GET /api/v1/dashboard/summary
   */
  public getSummary(anneeId?: string | number): Observable<DashboardSummaryResponse | null> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (anneeId) {
      params = params.set('annee_catechese_id', anneeId.toString());
    }

    return this.http.get<DashboardSummaryResponse>(`${this.apiUrl}/summary`, { params }).pipe(
      tap({
        next: (res) => {
          this.dashboardData.set(res?.data || null);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.toastService.error(
          'Tableau de bord',
          error.error?.message || 'Impossible de charger la synthèse du tableau de bord.'
        );
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }
}
