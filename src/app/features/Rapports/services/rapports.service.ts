import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
import {
  NiveauStat,
  RapportPastoralItem,
  SacrementStat,
  SectionStat,
  StatistiquesPastorales
} from '../models/rapports.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RapportsService {
  private readonly http = inject(HttpClient);
  private readonly dashboardUrl = `${environment.apiUrl}/dashboard`;

  // Données statistiques par défaut
  private readonly defaultStats: StatistiquesPastorales = {
    totalInscrits: 0,
    totalGarcons: 0,
    totalFilles: 0,
    tauxAssiduiteGlobal: 0,
    tauxReussiteGlobal: 0,
    totalSacrementsPrevus: 0,
    totalSacrementsValides: 0,
    totalRecouvrementPct: 0,
    repartitionSections: [],
    repartitionNiveaux: [],
    statistiquesSacrements: [],
    evolutionPresenceMensuelle: []
  };

  public readonly stats = signal<StatistiquesPastorales>(this.defaultStats);
  public readonly rapports = signal<RapportPastoralItem[]>([]);
  public readonly isLoading = signal<boolean>(false);

  constructor() {
    this.fetchBackendStats();
  }

  // --- CHARGEMENT DES KPIS DEPUIS LE BACKEND LARAVEL ---

  public fetchBackendStats(): void {
    this.isLoading.set(true);
    this.http.get<any>(`${this.dashboardUrl}/kpis`).pipe(
      tap(res => {
        if (res && res.data) {
          const d = res.data;
          this.stats.update(current => ({
            ...current,
            totalInscrits: d.total_inscrits || current.totalInscrits,
            totalGarcons: d.total_garcons || current.totalGarcons,
            totalFilles: d.total_filles || current.totalFilles,
            tauxAssiduiteGlobal: d.taux_assiduite_global || current.tauxAssiduiteGlobal,
            totalRecouvrementPct: d.taux_recouvrement || current.totalRecouvrementPct
          }));
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe();
  }

  // --- ACTIONS RAPPORTS PASTORAUX ---

  public createRapport(rapport: Omit<RapportPastoralItem, 'id' | 'dateGeneration' | 'statut' | 'statistiques'>): void {
    const newRapport: RapportPastoralItem = {
      ...rapport,
      id: 'rap-' + Date.now(),
      dateGeneration: new Date().toISOString().split('T')[0],
      statut: 'Brouillon',
      statistiques: this.stats()
    };

    this.rapports.update(list => [newRapport, ...list]);
  }

  public updateRapport(id: string, updates: Partial<RapportPastoralItem>): void {
    this.rapports.update(list =>
      list.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  }

  public validerRapport(id: string): void {
    this.updateRapport(id, { statut: 'Officiel' });
  }

  public archiverRapport(id: string): void {
    this.updateRapport(id, { statut: 'Archivé' });
  }

  public deleteRapport(id: string): void {
    this.rapports.update(list => list.filter(r => r.id !== id));
  }
}
