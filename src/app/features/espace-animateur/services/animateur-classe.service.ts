import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AffectationAnimateurDetail,
  AnneePastoraleDetail,
  CatechumeneInscrit,
  ClasseDetail,
  MaClasseResponse,
  NiveauDetail,
  SectionDetail
} from '../model/animateur-classe.model';

@Injectable({
  providedIn: 'root'
})
export class AnimateurClasseService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/animateur/ma-classe`;

  // Signals d'état pour la classe de l'animateur
  public readonly classeData = signal<MaClasseResponse | null>(null);
  public readonly isLoading = signal<boolean>(false);
  public readonly hasNoAffectation = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);

  // Sélecteurs dérivés réactifs
  public readonly classe = computed<ClasseDetail | null>(() => {
    const d = this.classeData();
    if (!d) return null;
    return d.classe || d.data?.classe || null;
  });

  public readonly niveau = computed<NiveauDetail | null>(() => {
    const d = this.classeData();
    if (!d) return null;
    return d.niveau || d.data?.niveau || null;
  });

  public readonly section = computed<SectionDetail | null>(() => {
    const d = this.classeData();
    if (!d) return null;
    return d.section || d.data?.section || null;
  });

  public readonly anneePastorale = computed<AnneePastoraleDetail | null>(() => {
    const d = this.classeData();
    if (!d) return null;
    return (
      d.annee_pastorale ||
      d.annee_catechese ||
      d.data?.annee_pastorale ||
      d.data?.annee_catechese ||
      null
    );
  });

  public readonly affectation = computed<AffectationAnimateurDetail | null>(() => {
    const d = this.classeData();
    if (!d) return null;
    return d.affectation || d.data?.affectation || null;
  });

  public readonly catechumenes = computed<CatechumeneInscrit[]>(() => {
    const d = this.classeData();
    if (!d) return [];
    const list =
      d.catechumenes ||
      d.eleves ||
      d.data?.catechumenes ||
      d.data?.eleves ||
      [];

    return list.map((item: any) => {
      const catId = String(item.id || item.catechumene_id || item.inscription_id || '');
      const nom = item.nom || item.catechumene?.nom || '';
      const prenoms = item.prenoms || item.catechumene?.prenoms || '';
      const nomComplet = item.nom_complet || item.catechumene?.nom_complet || `${nom} ${prenoms}`.trim() || `Élève #${catId}`;

      const telephone = item.telephone || item.catechumene?.telephone || null;
      const telephoneParent = item.telephone_parent
        || item.telephone_pere
        || item.telephone_mere
        || item.telephone_tuteur
        || item.catechumene?.telephone_parent
        || item.catechumene?.telephone_pere
        || item.catechumene?.telephone_mere
        || item.catechumene?.telephone_tuteur
        || null;

      const telephonePere = item.telephone_pere || item.catechumene?.telephone_pere || null;
      const telephoneMere = item.telephone_mere || item.catechumene?.telephone_mere || null;
      const telephoneTuteur = item.telephone_tuteur || item.catechumene?.telephone_tuteur || null;

      const nomPere = item.nom_pere || item.catechumene?.nom_pere || null;
      const nomMere = item.nom_mere || item.catechumene?.nom_mere || null;
      const nomTuteur = item.nom_tuteur || item.catechumene?.nom_tuteur || null;
      const nomParent = item.nom_parent || (nomPere ? `Père (${nomPere})` : (nomMere ? `Mère (${nomMere})` : (nomTuteur ? `Tuteur (${nomTuteur})` : null)));

      return {
        id: catId,
        uuid: String(item.uuid || item.catechumene_id || catId),
        matricule: item.matricule || item.catechumene?.matricule || item.code_catechumene || '',
        nom,
        prenoms,
        nom_complet: nomComplet,
        sexe: item.sexe || item.catechumene?.sexe || '',
        date_naissance: item.date_naissance || item.catechumene?.date_naissance || null,
        telephone: telephone || undefined,
        telephone_parent: telephoneParent || undefined,
        telephone_pere: telephonePere || undefined,
        nom_pere: nomPere || undefined,
        telephone_mere: telephoneMere || undefined,
        nom_mere: nomMere || undefined,
        telephone_tuteur: telephoneTuteur || undefined,
        nom_tuteur: nomTuteur || undefined,
        nom_parent: nomParent || undefined,
        statut: item.statut || 'inscrit',
        photo: item.photo || item.catechumene?.photo || null
      };
    });
  });

  public readonly effectif = computed<number>(() => {
    const d = this.classeData();
    if (!d) return 0;
    const explicit = d.effectif ?? (d as any).total_eleves ?? d.data?.effectif ?? d.data?.total_eleves ?? d.data?.classe?.effectif_actuel;
    if (typeof explicit === 'number') return explicit;
    return this.catechumenes().length;
  });

  public readonly classeNomComplet = computed<string>(() => {
    const sec = this.section()?.nom;
    const niv = this.niveau()?.nom;
    const cls = this.classe()?.nom;
    const parts = [sec, niv, cls].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : 'Classe non définie';
  });

  /**
   * Récupère automatiquement la classe de l'animateur connecté
   * Endpoint : GET /api/v1/animateur/ma-classe
   * Règle métier : Aucun classe_id n'est envoyé par le frontend.
   */
  public getMaClasse(): Observable<MaClasseResponse | null> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http.get<MaClasseResponse>(this.endpoint).pipe(
      tap(res => {
        this.isLoading.set(false);
        this.hasNoAffectation.set(false);
        this.classeData.set(res);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 404) {
          // Cas métier : aucune affectation active pour l'année en cours
          this.hasNoAffectation.set(true);
          this.classeData.set(null);
          return of(null);
        }

        const msg =
          err.error?.message ||
          'Impossible de récupérer les informations de votre classe pour le moment.';
        this.errorMessage.set(msg);
        return of(null);
      })
    );
  }
}
