import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  CatechumeneSacrementListRowDto,
  PaginatedResponse,
  ParcoursSacrementItemDto,
  SacrementDto,
  SacrementFilterParams,
  StoreCatechumenSacrementDto,
  UpdateCatechumenSacrementDto
} from '../models/sacrement.model';

@Injectable({
  providedIn: 'root'
})
export class SacrementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}`;

  /**
   * 1. Récupérer les 3 types de sacrements (Baptême, Première Communion, Confirmation)
   */
  public getSacrements(): Observable<ApiResponse<SacrementDto[]>> {
    return this.http.get<ApiResponse<SacrementDto[]>>(`${this.baseUrl}/sacrements`);
  }

  /**
   * 2. Obtenir un type de sacrement par son ID/UUID
   */
  public getSacrementById(id: string): Observable<ApiResponse<SacrementDto>> {
    return this.http.get<ApiResponse<SacrementDto>>(`${this.baseUrl}/sacrements/${id}`);
  }

  /**
   * 3. Tableau des Catéchumènes avec filtrage dynamique (Section, Niveau, Classe, Sacrement, Statut, Recherche)
   */
  public getCatechumens(filters: SacrementFilterParams = {}): Observable<PaginatedResponse<CatechumeneSacrementListRowDto>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<CatechumeneSacrementListRowDto>>(
      `${this.baseUrl}/sacrements/catechumens`,
      { params }
    );
  }

  /**
   * 4. Parcours sacramentel complet (3 sacrements avec états) pour un catéchumène
   */
  public getCatechumenParcours(catechumeneId: string): Observable<ApiResponse<ParcoursSacrementItemDto[]>> {
    return this.http.get<ApiResponse<ParcoursSacrementItemDto[]>>(
      `${this.baseUrl}/catechumens/${catechumeneId}/sacrements`
    );
  }

  /**
   * 5. Enregistrer un sacrement en préparation ou validé
   */
  public storeParcoursSacrement(
    catechumeneId: string,
    payload: StoreCatechumenSacrementDto
  ): Observable<ApiResponse<ParcoursSacrementItemDto>> {
    return this.http.post<ApiResponse<ParcoursSacrementItemDto>>(
      `${this.baseUrl}/catechumens/${catechumeneId}/sacrements`,
      payload
    );
  }

  /**
   * 6. Consulter le détail d'un sacrement du parcours
   */
  public getParcoursItem(
    catechumeneId: string,
    sacrementId: string
  ): Observable<ApiResponse<ParcoursSacrementItemDto>> {
    return this.http.get<ApiResponse<ParcoursSacrementItemDto>>(
      `${this.baseUrl}/catechumens/${catechumeneId}/sacrements/${sacrementId}`
    );
  }

  /**
   * 7. Mettre à jour ou VALIDER un sacrement reçu (Synchronise automatiquement le dossier du catéchumène)
   */
  public updateOrValidateParcours(
    catechumeneId: string,
    sacrementId: string,
    payload: UpdateCatechumenSacrementDto
  ): Observable<ApiResponse<ParcoursSacrementItemDto>> {
    return this.http.put<ApiResponse<ParcoursSacrementItemDto>>(
      `${this.baseUrl}/catechumens/${catechumeneId}/sacrements/${sacrementId}`,
      payload
    );
  }

  /**
   * 8. Supprimer un sacrement du parcours (Soft Delete)
   */
  public deleteParcours(
    catechumeneId: string,
    sacrementId: string
  ): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/catechumens/${catechumeneId}/sacrements/${sacrementId}`
    );
  }
}
