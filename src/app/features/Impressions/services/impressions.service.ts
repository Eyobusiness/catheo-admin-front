import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  ImpressionEnteteDto,
  ImpressionFilterDto,
  FicheNotesResponseDto,
  ListePresenceResponseDto,
  ListeCatechumenesResponseDto,
  SuiviSacramentalResponseDto,
  FicheBilanAnnuelResponseDto,
  FicheRenseignementBaptemeDto,
  FicheRenseignementPremiereCommunionDto,
  FicheRenseignementConfirmationDto,
  PrintStudent
} from '../models/impressions.model';
import { AnneeCatecheseService } from '../../../core/services/annee-catechese.service';
import { SectionService } from '../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../Organisations/Classe/services/classe.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../environments/environment';

function extractData(res: any): any {
  if (!res) return null;
  if (res.data !== undefined) return res.data;
  return res;
}

@Injectable({
  providedIn: 'root'
})
export class ImpressionsService {
  private readonly http = inject(HttpClient);
  private readonly anneeService = inject(AnneeCatecheseService);
  private readonly sectionService = inject(SectionService);
  private readonly niveauService = inject(NiveauService);
  private readonly classeService = inject(ClasseService);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/impressions`;

  // Reactive state signals
  public readonly isLoading = signal<boolean>(false);
  public readonly activeAnnee = this.anneeService.activeAnnee;
  public readonly enteteInfo = signal<ImpressionEnteteDto | null>(null);

  // Listes pour filtres dynamiques
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.classeService.classes;

  // =========================================================================
  // 1. EN-TÊTE OFFICIEL PAROISSIAL (/api/v1/impressions/entete)
  // =========================================================================
  public getEntete(): Observable<ImpressionEnteteDto | null> {
    return this.http.get<any>(`${this.baseUrl}/entete`).pipe(
      map(res => extractData(res)),
      tap(entete => {
        if (entete) {
          this.enteteInfo.set(entete);
        }
      }),
      catchError(err => {
        return of(this.enteteInfo());
      })
    );
  }

  // =========================================================================
  // 2. FICHE DE NOTES (/api/v1/impressions/fiche-notes)
  // =========================================================================
  public getFicheNotes(filters: ImpressionFilterDto): Observable<FicheNotesResponseDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/fiche-notes`, filters).pipe(
      map(res => extractData(res)),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger la fiche de notes.');
        return of(null);
      })
    );
  }

  // =========================================================================
  // 3. FICHE DE PRÉSENCE / ÉMARGEMENT (/api/v1/impressions/fiche-presences)
  // =========================================================================
  public getFichePresences(filters: ImpressionFilterDto): Observable<ListePresenceResponseDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/fiche-presences`, filters).pipe(
      map(res => extractData(res)),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger la fiche de présences.');
        return of(null);
      })
    );
  }

  // =========================================================================
  // 4. TABLEAU D'ÉMARGEMENT DYNAMIQUE (/api/v1/impressions/liste-presence)
  // =========================================================================
  public getListePresence(filters: ImpressionFilterDto): Observable<ListePresenceResponseDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/liste-presence`, filters).pipe(
      map(res => extractData(res)),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger la liste de présence.');
        return of(null);
      })
    );
  }

  // =========================================================================
  // 5. REGISTRE ET LISTE OFFICIELLE (/api/v1/impressions/liste-catechumenes)
  // =========================================================================
  public getListeCatechumenes(filters: ImpressionFilterDto): Observable<ListeCatechumenesResponseDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/liste-catechumenes`, filters).pipe(
      map(res => extractData(res)),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger le registre des catéchumènes.');
        return of(null);
      })
    );
  }

  // =========================================================================
  // 6. SUIVI SACRAMENTAL (/api/v1/impressions/suivi-sacramental)
  // =========================================================================
  public getSuiviSacramental(filters: ImpressionFilterDto): Observable<SuiviSacramentalResponseDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/suivi-sacramental`, filters).pipe(
      map(res => extractData(res)),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger la fiche de suivi sacramental.');
        return of(null);
      })
    );
  }

  // =========================================================================
  // 7. FICHE DE BILAN ANNUEL (/api/v1/impressions/fiche-bilan-annuel)
  // =========================================================================
  public getFicheBilanAnnuel(filters: ImpressionFilterDto): Observable<FicheBilanAnnuelResponseDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/fiche-bilan-annuel`, filters).pipe(
      map(res => extractData(res)),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger la fiche de bilan annuel.');
        return of(null);
      })
    );
  }

  // =========================================================================
  // 8. FICHE RENSEIGNEMENT BAPTÊME (/api/v1/impressions/fiche-renseignement-bapteme)
  // =========================================================================
  public getFicheRenseignementBapteme(params: { catechumene_id?: string; classe_id?: string; annee_catechese_id?: string }): Observable<FicheRenseignementBaptemeDto[] | FicheRenseignementBaptemeDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/fiche-renseignement-bapteme`, params).pipe(
      map(res => extractData(res)),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger la fiche de renseignement baptême.');
        return of(null);
      })
    );
  }

  // =========================================================================
  // 9. FICHE RENSEIGNEMENT 1ÈRE COMMUNION (/api/v1/impressions/fiche-renseignement-premiere-communion)
  // =========================================================================
  public getFicheRenseignementPremiereCommunion(params: { catechumene_id?: string; classe_id?: string; annee_catechese_id?: string }): Observable<FicheRenseignementPremiereCommunionDto[] | FicheRenseignementPremiereCommunionDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/fiche-renseignement-premiere-communion`, params).pipe(
      map(res => extractData(res)),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger la fiche de renseignement première communion.');
        return of(null);
      })
    );
  }

  // =========================================================================
  // 10. FICHE RENSEIGNEMENT CONFIRMATION (/api/v1/impressions/fiche-renseignement-confirmation)
  // =========================================================================
  public getFicheRenseignementConfirmation(params: { catechumene_id?: string; classe_id?: string; annee_catechese_id?: string }): Observable<FicheRenseignementConfirmationDto[] | FicheRenseignementConfirmationDto | null> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.baseUrl}/fiche-renseignement-confirmation`, params).pipe(
      map(res => extractData(res)),
      tap(() => this.isLoading.set(false)),
      catchError(err => {
        this.isLoading.set(false);
        this.toastService.error('Erreur', 'Impossible de charger la fiche de renseignement confirmation.');
        return of(null);
      })
    );
  }

  // Compatibilité et alias
  public fetchBackendEntete() { return this.getEntete(); }
  public fetchFicheNotes(p: any) { return this.getFicheNotes(p); }
  public fetchSuiviSacramental(p: any) { return this.getSuiviSacramental(p); }
  public fetchFichePresences(p: any) { return this.getFichePresences(p); }
  public fetchFicheBilanAnnuel(p: any) { return this.getFicheBilanAnnuel(p); }
  public fetchFicheRenseignementBapteme(p: any) { return this.getFicheRenseignementBapteme(p); }
  public fetchFicheRenseignementPremiereCommunion(p: any) { return this.getFicheRenseignementPremiereCommunion(p); }
  public fetchFicheRenseignementConfirmation(p: any) { return this.getFicheRenseignementConfirmation(p); }
}
