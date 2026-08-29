import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
import {
  CatechumeneSacrement,
  ExceptionSacrement,
  MotifException,
  SacrementRecord,
  TypeSacrement
} from '../models/sacrements.model';
import { environment } from '../../../environments/environment';

function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.catechumenes)) return res.data.catechumenes;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (Array.isArray(res.catechumenes)) return res.catechumenes;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

@Injectable({
  providedIn: 'root'
})
export class SacrementsService {
  private readonly http = inject(HttpClient);

  private readonly catechumenesUrl = `${environment.apiUrl}/catechumenes`;
  private readonly baseUrl = `${environment.apiUrl}/sacrements`;

  // Liste réactive des catéchumènes
  public readonly catechumenes = signal<CatechumeneSacrement[]>([]);
  public readonly isLoading = signal<boolean>(false);

  constructor() {
    this.loadCatechumenesFromApi();
  }

  // --- CHARGEMENT SYNCHRONISÉ DEPUIS L'API LARAVEL ---

  public loadCatechumenesFromApi(): void {
    this.isLoading.set(true);
    this.http.get<any>(this.catechumenesUrl).pipe(
      map(res => extractArrayData(res)),
      tap(rawList => {
        if (rawList && rawList.length > 0) {
          const mapped: CatechumeneSacrement[] = rawList.map((item: any) => {
            const derniereInscription = item.inscriptions_annuelles && item.inscriptions_annuelles.length > 0
              ? item.inscriptions_annuelles[0]
              : null;

            const niveauNom = derniereInscription?.classe?.niveau?.nom || item.niveau?.nom || item.niveau || '3ème Année';
            const niveauId = derniereInscription?.classe?.niveau?.id || item.niveau?.id || item.niveau_id || '';

            const classeNom = derniereInscription?.classe?.nom || item.classe?.nom || item.classe || 'Classe A';
            const classeId = derniereInscription?.classe?.id || item.classe?.id || item.classe_id || '';

            const sectionNom = derniereInscription?.classe?.section?.nom || derniereInscription?.classe?.niveau?.section?.nom || item.section?.nom || item.section || 'Enfants';
            const sectionId = derniereInscription?.classe?.section?.id || derniereInscription?.classe?.niveau?.section?.id || item.section?.id || item.section_id || '';

            const isBapt = !!(item.est_baptise || item.date_bapteme);
            const isCom = !!(item.date_premiere_communion);
            const isConf = !!(item.date_confirmation);

            const baptemeRec: SacrementRecord | undefined = isBapt ? {
              id: 'bap-' + item.id,
              type: 'Baptême',
              date: item.date_bapteme || '2023-04-08',
              lieu: item.paroisse_bapteme || item.lieu_bapteme || 'Paroisse Cœur Immaculé de Marie',
              celebrant: 'Père Curé',
              parrain: item.nom_parrain,
              numRegistre: item.num_carnet_bapteme,
              dateEnregistrement: item.created_at || new Date().toISOString()
            } : undefined;

            const comRec: SacrementRecord | undefined = isCom ? {
              id: 'com-' + item.id,
              type: 'Première Communion',
              date: item.date_premiere_communion || '2024-05-19',
              lieu: item.paroisse_premiere_communion || 'Paroisse Cœur Immaculé de Marie',
              celebrant: 'Père Curé',
              dateEnregistrement: item.created_at || new Date().toISOString()
            } : undefined;

            const confRec: SacrementRecord | undefined = isConf ? {
              id: 'conf-' + item.id,
              type: 'Confirmation',
              date: item.date_confirmation || '2025-06-08',
              lieu: item.paroisse_confirmation || 'Paroisse Cœur Immaculé de Marie',
              celebrant: item.ministre_confirmation || 'Monseigneur l\'Archevêque',
              parrain: item.nom_parrain,
              dateEnregistrement: item.created_at || new Date().toISOString()
            } : undefined;

            return {
              id: item.id?.toString() || 'cat-' + Math.random(),
              matricule: item.code_catechumene || item.matricule || `CAT-${item.id}`,
              nom: item.nom || '',
              prenoms: item.prenoms || '',
              section: sectionNom,
              section_id: sectionId,
              classe: classeNom,
              classe_id: classeId,
              niveau: niveauNom,
              niveau_id: niveauId,
              telephone: item.telephone || item.telephone_pere || item.telephone_tuteur || '',
              statut: item.statut || 'actif',
              isBaptise: isBapt,
              isPremiereCommunion: isCom,
              isConfirme: isConf,
              baptemeRecord: baptemeRec,
              premiereCommunionRecord: comRec,
              confirmationRecord: confRec,
              exceptions: Array.isArray(item.exceptions) ? item.exceptions.map((e: any) => ({
                id: e.id?.toString() || 'exc-' + Math.random(),
                catechumeneId: item.id?.toString(),
                sacrementType: e.sacrement_type || e.sacrementType || 'Baptême',
                motif: e.motif || 'Décision du Curé',
                autorisePar: e.autorise_par || e.autorisePar || 'Père Curé',
                observation: e.observation || e.observations || '',
                dateAjout: e.date_ajout || e.dateAjout || (e.created_at ? e.created_at.split('T')[0] : new Date().toISOString().split('T')[0])
              })) : []
            };
          });

          this.catechumenes.set(mapped);
        }
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of([]);
      })
    ).subscribe();
  }

  // --- RÈGLES PASTORALES DYNAMIQUES (Computed Signals) ---

  // 1. CANDIDATS BAPTÊME : 3ème Année + NON BAPTISÉ (ou exception)
  public readonly candidatsBapteme = computed<CatechumeneSacrement[]>(() => {
    return this.catechumenes().filter(c => {
      const is3emeAnnee = c.niveau.toLowerCase().includes('3') || c.niveau.toLowerCase().includes('troisi');
      const nonBaptise = !c.isBaptise;
      const isAuto = is3emeAnnee && nonBaptise;
      const hasException = c.exceptions?.some(e => e.sacrementType === 'Baptême');
      return isAuto || hasException;
    });
  });

  // 2. CANDIDATS PREMIÈRE COMMUNION : 3ème Année + DÉJÀ BAPTISÉ + NON COMMUNIÉ (ou exception)
  public readonly candidatsPremiereCommunion = computed<CatechumeneSacrement[]>(() => {
    return this.catechumenes().filter(c => {
      const is3emeAnnee = c.niveau.toLowerCase().includes('3') || c.niveau.toLowerCase().includes('troisi');
      const dejaBaptise = c.isBaptise;
      const nonCommunie = !c.isPremiereCommunion;
      const isAuto = is3emeAnnee && dejaBaptise && nonCommunie;
      const hasException = c.exceptions?.some(e => e.sacrementType === 'Première Communion');
      return isAuto || hasException;
    });
  });

  // 3. CANDIDATS CONFIRMATION : 5ème Année + NON CONFIRMÉ (ou exception)
  public readonly candidatsConfirmation = computed<CatechumeneSacrement[]>(() => {
    return this.catechumenes().filter(c => {
      const is5emeAnnee = c.niveau.toLowerCase().includes('5') || c.niveau.toLowerCase().includes('cinqui');
      const nonConfirme = !c.isConfirme;
      const isAuto = is5emeAnnee && nonConfirme;
      const hasException = c.exceptions?.some(e => e.sacrementType === 'Confirmation');
      return isAuto || hasException;
    });
  });

  // 4. TOUTES LES EXCEPTIONS PASTORALES
  public readonly allExceptions = computed<ExceptionSacrement[]>(() => {
    const list: ExceptionSacrement[] = [];
    this.catechumenes().forEach(c => {
      if (c.exceptions && c.exceptions.length > 0) {
        c.exceptions.forEach(e => {
          list.push({
            ...e,
            catechumeneNomComplet: `${c.nom} ${c.prenoms}`,
            section: c.section,
            section_id: c.section_id,
            classe: c.classe,
            classe_id: c.classe_id,
            niveau: c.niveau,
            niveau_id: c.niveau_id
          });
        });
      }
    });
    return list;
  });

  public getStatsForList(list: CatechumeneSacrement[], selectedSection: string = '') {
    const total = list.length;
    const valides = list.filter(c => c.isBaptise || c.isPremiereCommunion || c.isConfirme).length;
    const enAttente = total - valides;

    // Regroupement dynamique par section
    const sectionsMap = new Map<string, number>();
    list.forEach(c => {
      const sec = c.section || 'Non assigné';
      sectionsMap.set(sec, (sectionsMap.get(sec) || 0) + 1);
    });

    const statsSections = Array.from(sectionsMap.entries())
      .map(([nom, count]) => ({ nom, count }))
      .sort((a, b) => a.nom.localeCompare(b.nom));

    // Regroupement par classe
    let statsClasses: { classe: string; count: number }[] = [];
    const filteredForClasses = selectedSection
      ? list.filter(c => c.section_id === selectedSection || c.section === selectedSection)
      : list;

    const classesMap = new Map<string, number>();
    filteredForClasses.forEach(c => {
      const cl = c.classe || 'Non assigné';
      classesMap.set(cl, (classesMap.get(cl) || 0) + 1);
    });

    statsClasses = Array.from(classesMap.entries())
      .map(([classe, count]) => ({ classe, count }))
      .sort((a, b) => a.classe.localeCompare(b.classe));

    return {
      total,
      valides,
      enAttente,
      statsSections,
      statsClasses
    };
  }

  // --- ACTIONS & SYNCHRONISATION BACKEND ---

  public addException(
    catechumeneId: string,
    sacrementType: TypeSacrement,
    motif: MotifException,
    autorisePar: string,
    observation?: string
  ): void {
    const cat = this.catechumenes().find(c => c.id === catechumeneId);
    const newException: ExceptionSacrement = {
      id: 'exc-' + Date.now(),
      catechumeneId,
      section: cat?.section,
      section_id: cat?.section_id,
      classe: cat?.classe,
      classe_id: cat?.classe_id,
      niveau: cat?.niveau,
      niveau_id: cat?.niveau_id,
      sacrementType,
      motif,
      autorisePar,
      observation,
      dateAjout: new Date().toISOString().split('T')[0]
    };

    this.catechumenes.update(list =>
      list.map(c => {
        if (c.id === catechumeneId) {
          const existingExc = c.exceptions || [];
          return {
            ...c,
            exceptions: [...existingExc, newException]
          };
        }
        return c;
      })
    );

    // Envoi backend API
    this.http.post(`${this.baseUrl}/exceptions`, newException).pipe(catchError(() => of(null))).subscribe();
  }

  public deleteException(exceptionId: string): void {
    this.catechumenes.update(list =>
      list.map(c => ({
        ...c,
        exceptions: c.exceptions ? c.exceptions.filter(e => e.id !== exceptionId) : []
      }))
    );

    this.http.delete(`${this.baseUrl}/exceptions/${exceptionId}`).pipe(catchError(() => of(null))).subscribe();
  }

  public enregistrerSacrement(
    catechumeneId: string,
    record: Omit<SacrementRecord, 'id' | 'dateEnregistrement'>
  ): void {
    const now = new Date().toISOString().split('T')[0];
    const fullRecord: SacrementRecord = {
      ...record,
      id: 'sac-' + Date.now(),
      dateEnregistrement: now
    };

    // Mise à jour de l'état réactif local
    this.catechumenes.update(list =>
      list.map(c => {
        if (c.id === catechumeneId) {
          if (record.type === 'Baptême') {
            return { ...c, isBaptise: true, baptemeRecord: fullRecord };
          } else if (record.type === 'Première Communion') {
            return { ...c, isPremiereCommunion: true, premiereCommunionRecord: fullRecord };
          } else if (record.type === 'Confirmation') {
            return { ...c, isConfirme: true, confirmationRecord: fullRecord };
          }
        }
        return c;
      })
    );

    // Synchronisation PUT vers le backend Laravel (/api/v1/catechumenes/{id})
    const payload: any = {};
    if (record.type === 'Baptême') {
      payload.est_baptise = true;
      payload.date_bapteme = record.date;
      payload.lieu_bapteme = record.lieu;
      payload.paroisse_bapteme = record.lieu;
      if (record.parrain) payload.nom_parrain = record.parrain;
      if (record.numRegistre) payload.num_carnet_bapteme = record.numRegistre;
    } else if (record.type === 'Première Communion') {
      payload.date_premiere_communion = record.date;
      payload.paroisse_premiere_communion = record.lieu;
    } else if (record.type === 'Confirmation') {
      payload.date_confirmation = record.date;
      payload.paroisse_confirmation = record.lieu;
      payload.ministre_confirmation = record.celebrant;
      if (record.parrain) payload.nom_parrain = record.parrain;
    }

    this.http.put(`${this.catechumenesUrl}/${catechumeneId}`, payload).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  public validerSacrementsBulk(ids: string[], type: TypeSacrement): void {
    const now = new Date().toISOString().split('T')[0];
    const idsSet = new Set(ids);

    this.catechumenes.update(list =>
      list.map(c => {
        if (idsSet.has(c.id)) {
          const fullRecord: SacrementRecord = {
            id: 'sac-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            type,
            date: now,
            lieu: 'Paroisse Cœur Immaculé de Marie',
            celebrant: type === 'Confirmation' ? 'Monseigneur l\'Archevêque' : 'Père Curé',
            dateEnregistrement: now
          };

          if (type === 'Baptême') {
            return { ...c, isBaptise: true, baptemeRecord: fullRecord };
          } else if (type === 'Première Communion') {
            return { ...c, isPremiereCommunion: true, premiereCommunionRecord: fullRecord };
          } else if (type === 'Confirmation') {
            return { ...c, isConfirme: true, confirmationRecord: fullRecord };
          }
        }
        return c;
      })
    );

    // Envoi de la mise à jour pour chaque catéchumène sélectionné
    ids.forEach(id => {
      const payload: any = {};
      if (type === 'Baptême') {
        payload.est_baptise = true;
        payload.date_bapteme = now;
      } else if (type === 'Première Communion') {
        payload.date_premiere_communion = now;
      } else if (type === 'Confirmation') {
        payload.date_confirmation = now;
        payload.ministre_confirmation = 'Monseigneur l\'Archevêque';
      }
      this.http.put(`${this.catechumenesUrl}/${id}`, payload).pipe(catchError(() => of(null))).subscribe();
    });
  }

  public removeCandidate(id: string): void {
    this.catechumenes.update(list => list.filter(c => c.id !== id));
  }
}
