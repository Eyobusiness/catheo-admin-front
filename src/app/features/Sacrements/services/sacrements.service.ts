import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, of, tap } from 'rxjs';
import {
  CatechumeneSacrement,
  ExceptionSacrement,
  MotifException,
  SacrementRecord,
  TypeSacrement
} from '../models/sacrements.model';
import { environment } from '../../../environments/environment';
import { InscriptionAnnuelleService } from '../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { CatechumeneService } from '../../Catechumenes/liste-catechumene/services/catechumene.service';
import { SectionService } from '../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../Organisations/Classe/services/classe.service';
import { AnneeCatecheseService } from '../../../core/services/annee-catechese.service';

@Injectable({
  providedIn: 'root'
})
export class SacrementsService {
  private readonly http = inject(HttpClient);
  private readonly inscriptionService = inject(InscriptionAnnuelleService);
  private readonly catechumeneService = inject(CatechumeneService);
  private readonly sectionService = inject(SectionService);
  private readonly niveauService = inject(NiveauService);
  private readonly classeService = inject(ClasseService);
  private readonly anneeService = inject(AnneeCatecheseService);

  private readonly baseUrl = `${environment.apiUrl}/sacrements`;
  private readonly catechumenesUrl = `${environment.apiUrl}/catechumenes`;

  // Liste réactive des catéchumènes de la base de données
  public readonly catechumenes = signal<CatechumeneSacrement[]>([]);
  public readonly exceptions = signal<ExceptionSacrement[]>([]);
  public readonly isLoading = signal<boolean>(false);

  // Données dédiées issues des requêtes backend spécifiques par sacrement
  public readonly apiCandidatsBapteme = signal<CatechumeneSacrement[]>([]);
  public readonly apiCandidatsCommunion = signal<CatechumeneSacrement[]>([]);
  public readonly apiCandidatsConfirmation = signal<CatechumeneSacrement[]>([]);

  constructor() {
    this.loadCatechumenesFromApi();
  }

  // --- REQUÊTES SPÉCIFIQUES BACKEND PAR SACREMENT SELON LES CONDITIONS PASTORALES ---

  public fetchCandidatsBapteme(filters: Record<string, string> = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    return this.http.get<any>(`${this.baseUrl}/candidats/bapteme`, { params }).pipe(
      tap(res => {
        const list = res.data || [];
        this.apiCandidatsBapteme.set(list.map((item: any) => this.mapBackendCandidateToSacrement(item, 'Baptême')));
      }),
      catchError(() => of({ data: [] }))
    );
  }

  public fetchCandidatsPremiereCommunion(filters: Record<string, string> = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    return this.http.get<any>(`${this.baseUrl}/candidats/premiere-communion`, { params }).pipe(
      tap(res => {
        const list = res.data || [];
        this.apiCandidatsCommunion.set(list.map((item: any) => this.mapBackendCandidateToSacrement(item, 'Première Communion')));
      }),
      catchError(() => of({ data: [] }))
    );
  }

  public fetchCandidatsConfirmation(filters: Record<string, string> = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    return this.http.get<any>(`${this.baseUrl}/candidats/confirmation`, { params }).pipe(
      tap(res => {
        const list = res.data || [];
        this.apiCandidatsConfirmation.set(list.map((item: any) => this.mapBackendCandidateToSacrement(item, 'Confirmation')));
      }),
      catchError(() => of({ data: [] }))
    );
  }

  public fetchExceptions(filters: Record<string, string> = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    return this.http.get<any>(`${this.baseUrl}/exceptions`, { params }).pipe(
      tap(res => {
        const list = res.data || [];
        const mapped: ExceptionSacrement[] = list.map((item: any) => ({
          id: String(item.id || item.uuid || ''),
          catechumeneId: String(item.catechumeneId || item.catechumene_id || ''),
          catechumeneNomComplet: item.catechumeneNomComplet || item.catechumene_nom_complet || '',
          section: item.section || '',
          section_id: item.section_id ? String(item.section_id) : undefined,
          classe: item.classe || '',
          classe_id: item.classe_id ? String(item.classe_id) : undefined,
          niveau: item.niveau || '',
          niveau_id: item.niveau_id ? String(item.niveau_id) : undefined,
          sacrementType: (item.sacrementType || item.sacrement_type || 'Baptême') as TypeSacrement,
          motif: item.motif as MotifException,
          autorisePar: item.autorisePar || item.autorise_par || '',
          observation: item.observation || '',
          dateAjout: item.dateAjout || item.date_derogation || '',
          annee_catechese_id: item.annee_catechese_id ? String(item.annee_catechese_id) : undefined,
          anneeCatecheseLibelle: item.anneeCatecheseLibelle || item.annee_catechese_libelle || ''
        }));
        this.exceptions.set(mapped);
      }),
      catchError(() => of({ data: [] }))
    );
  }

  private mapBackendCandidateToSacrement(item: any, type: TypeSacrement): CatechumeneSacrement {
    const isBapt = Boolean(item.est_baptise || item.date_bapteme || item.sacrements_status?.bapteme === 'valide');
    const isCom = Boolean(item.sacrements_status?.premiere_communion === 'valide' || item.date_premiere_communion);
    const isConf = Boolean(item.sacrements_status?.confirmation === 'valide' || item.date_confirmation);

    return {
      id: String(item.id || item.uuid || ''),
      matricule: item.matricule || item.code_catechumene || `CAT-${item.id}`,
      nom: item.nom || '',
      prenoms: item.prenoms || item.prenom || '',
      section: item.section_nom || item.section?.nom || '',
      section_id: String(item.section_id || item.section?.id || ''),
      section_code: (item.section_code || item.section?.code || '').toUpperCase(),
      classe: item.classe_nom || item.classe?.nom || '',
      classe_id: String(item.classe_id || item.classe?.id || ''),
      niveau: item.niveau_nom || item.niveau?.nom || '',
      niveau_id: String(item.niveau_id || item.niveau?.id || ''),
      telephone: item.telephone || '',
      statut: item.statut || 'actif',
      isBaptise: isBapt,
      isPremiereCommunion: isCom,
      isConfirme: isConf,
      baptemeRecord: isBapt ? {
        id: 'bap-' + item.id,
        type: 'Baptême',
        date: item.date_bapteme || '',
        lieu: item.paroisse_bapteme || '',
        celebrant: item.celebrant_bapteme || item.ministre_bapteme || '',
        dateEnregistrement: item.created_at || ''
      } : undefined,
      premiereCommunionRecord: isCom ? {
        id: 'com-' + item.id,
        type: 'Première Communion',
        date: item.date_premiere_communion || '',
        lieu: item.paroisse_premiere_communion || '',
        celebrant: item.celebrant_premiere_communion || item.celebrant_communion || '',
        dateEnregistrement: item.created_at || ''
      } : undefined,
      confirmationRecord: isConf ? {
        id: 'conf-' + item.id,
        type: 'Confirmation',
        date: item.date_confirmation || '',
        lieu: item.paroisse_confirmation || '',
        celebrant: item.ministre_confirmation || item.celebrant_confirmation || '',
        dateEnregistrement: item.created_at || ''
      } : undefined,
      exceptions: []
    };
  }

  // --- CHARGEMENT SYNCHRONISÉ DEPUIS L'API LARAVEL ---

  public loadCatechumenesFromApi(): void {
    this.isLoading.set(true);
    forkJoin({
      inscriptions: this.inscriptionService.getAll().pipe(catchError(() => of([]))),
      catechumenes: this.catechumeneService.getAll().pipe(catchError(() => of([]))),
      sections: this.sectionService.getAll().pipe(catchError(() => of([]))),
      niveaux: this.niveauService.getAll().pipe(catchError(() => of([]))),
      classes: this.classeService.getAll().pipe(catchError(() => of([]))),
      candidatsBapteme: this.fetchCandidatsBapteme(),
      candidatsCommunion: this.fetchCandidatsPremiereCommunion(),
      candidatsConfirmation: this.fetchCandidatsConfirmation(),
      exceptions: this.fetchExceptions(),
    }).subscribe({
      next: ({ inscriptions, catechumenes, sections, niveaux, classes }) => {
        this.buildCatechumenesList(inscriptions, catechumenes, sections, niveaux, classes);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // --- FONCTIONS DE DÉTECTION PASTORALE RÉELLES ---

  public checkIsBaptise(c: any, alt?: any): boolean {
    const objs = [c, alt].filter(Boolean);
    for (const obj of objs) {
      if (
        obj.est_baptise === true ||
        obj.est_baptise === 1 ||
        obj.est_baptise === '1' ||
        obj.est_baptise === 'true' ||
        obj.isBaptise === true ||
        obj.baptise === true ||
        obj.baptise === 1 ||
        obj.baptise === '1' ||
        obj.is_baptise === true ||
        obj.is_baptise === 1 ||
        obj.is_baptise === '1'
      ) {
        return true;
      }
      const dBapt = obj.date_bapteme || obj.dateBapteme;
      if (dBapt && String(dBapt).trim() !== '' && String(dBapt).trim() !== 'null' && String(dBapt).trim() !== '0000-00-00') {
        return true;
      }
      const pBapt = obj.paroisse_bapteme || obj.paroisseBapteme || obj.lieu_bapteme || obj.ville_bapteme || obj.diocese_bapteme;
      if (pBapt && String(pBapt).trim() !== '' && String(pBapt).trim() !== 'null') {
        return true;
      }
      const nCarnet = obj.num_carnet_bapteme || obj.numero_carnet_bapteme || obj.registre_bapteme;
      if (nCarnet && String(nCarnet).trim() !== '' && String(nCarnet).trim() !== 'null') {
        return true;
      }
    }
    return false;
  }

  public checkIsCommunie(c: any, alt?: any): boolean {
    const objs = [c, alt].filter(Boolean);
    for (const obj of objs) {
      if (
        obj.est_communie === true ||
        obj.est_communie === 1 ||
        obj.est_communie === '1' ||
        obj.est_communie === 'true' ||
        obj.isPremiereCommunion === true ||
        obj.isCommunie === true
      ) {
        return true;
      }
      const d = obj.date_premiere_communion || obj.datePremiereCommunion;
      if (d && String(d).trim() !== '' && String(d).trim() !== 'null' && String(d).trim() !== '0000-00-00') {
        return true;
      }
      const p = obj.paroisse_premiere_communion || obj.lieu_premiere_communion;
      if (p && String(p).trim() !== '' && String(p).trim() !== 'null') {
        return true;
      }
    }
    return false;
  }

  public checkIsConfirme(c: any, alt?: any): boolean {
    const objs = [c, alt].filter(Boolean);
    for (const obj of objs) {
      if (
        obj.est_confirme === true ||
        obj.est_confirme === 1 ||
        obj.est_confirme === '1' ||
        obj.est_confirme === 'true' ||
        obj.isConfirme === true
      ) {
        return true;
      }
      const d = obj.date_confirmation || obj.dateConfirmation;
      if (d && String(d).trim() !== '' && String(d).trim() !== 'null' && String(d).trim() !== '0000-00-00') {
        return true;
      }
      const p = obj.paroisse_confirmation || obj.lieu_confirmation;
      if (p && String(p).trim() !== '' && String(p).trim() !== 'null') {
        return true;
      }
    }
    return false;
  }

  public is3emeAnnee(niveauNom?: string, niveauOrdre?: number, niveauObj?: any): boolean {
    if (niveauOrdre === 3) return true;
    if (niveauObj?.ordre === 3 || niveauObj?.ordre_affichage === 3) return true;
    const val = (typeof niveauNom === 'string' && niveauNom) || niveauObj?.nom || (typeof niveauObj === 'string' ? niveauObj : '');
    if (!val) return false;
    const s = String(val).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.includes('3') || s.includes('trois') || s.includes('communion');
  }

  public is4emeAnnee(niveauNom?: string, niveauOrdre?: number, niveauObj?: any): boolean {
    if (niveauOrdre === 4) return true;
    if (niveauObj?.ordre === 4 || niveauObj?.ordre_affichage === 4) return true;
    const val = (typeof niveauNom === 'string' && niveauNom) || niveauObj?.nom || (typeof niveauObj === 'string' ? niveauObj : '');
    if (!val) return false;
    const s = String(val).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.includes('4') || s.includes('quatr');
  }

  public is5emeAnnee(niveauNom?: string, niveauOrdre?: number, niveauObj?: any): boolean {
    if (niveauOrdre === 5) return true;
    if (niveauObj?.ordre === 5 || niveauObj?.ordre_affichage === 5) return true;
    const val = (typeof niveauNom === 'string' && niveauNom) || niveauObj?.nom || (typeof niveauObj === 'string' ? niveauObj : '');
    if (!val) return false;
    const s = String(val).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.includes('5') || s.includes('cinq') || s.includes('confirmat');
  }

  public isSectionAdulte(secCode?: string, secNom?: string, secObj?: any, extra?: string): boolean {
    const code = (secCode || secObj?.code || '').trim().toUpperCase();
    const nom = (secNom || secObj?.nom || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const ext = (extra || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return (
      code === 'SEC-ADULTE' ||
      code.includes('ADULTE') ||
      nom.includes('adulte') ||
      ext.includes('adulte')
    );
  }

  // --- CONSTRUCTION DE LA LISTE RÉELLE ---

  public buildCatechumenesList(
    inscriptions: any[],
    catechumenes: any[],
    sections: any[],
    niveaux: any[],
    classes: any[]
  ): void {
    const finalInscriptions = Array.isArray(inscriptions) && inscriptions.length > 0
      ? inscriptions
      : this.inscriptionService.inscriptions();
    const finalCatechumenes = Array.isArray(catechumenes) && catechumenes.length > 0
      ? catechumenes
      : this.catechumeneService.catechumenes();
    const finalSections = Array.isArray(sections) && sections.length > 0
      ? sections
      : this.sectionService.sections();
    const finalNiveaux = Array.isArray(niveaux) && niveaux.length > 0
      ? niveaux
      : this.niveauService.niveaux();
    const finalClasses = Array.isArray(classes) && classes.length > 0
      ? classes
      : this.classeService.classes();

    const currentList = this.catechumenes();
    const exceptionsMap = new Map<string, any[]>();
    // Charger depuis le signal exceptions issu de l'API
    this.exceptions().forEach(e => {
      const existing = exceptionsMap.get(e.catechumeneId) || [];
      if (!existing.some(x => x.id === e.id)) {
        existing.push(e);
      }
      exceptionsMap.set(e.catechumeneId, existing);
    });
    // Compléter avec les exceptions déjà présentes
    currentList.forEach(c => {
      if (c.exceptions && c.exceptions.length > 0) {
        const existing = exceptionsMap.get(c.id) || [];
        c.exceptions.forEach(e => {
          if (!existing.some(x => x.id === e.id)) {
            existing.push(e);
          }
        });
        exceptionsMap.set(c.id, existing);
        if (c.uuid) {
          exceptionsMap.set(c.uuid, existing);
        }
      }
    });

    const resultMap = new Map<string, CatechumeneSacrement>();
    const activeAnneeId = this.anneeService.activeAnnee()?.id;

    // Grouper les inscriptions par catéchumène pour toujours sélectionner la plus récente / active
    const inscByCatId = new Map<string, any>();
    for (const insc of finalInscriptions) {
      const cid = String(insc.catechumene_id || insc.catechumene?.id || '');
      if (!cid) continue;

      const existing = inscByCatId.get(cid);
      if (!existing) {
        inscByCatId.set(cid, insc);
      } else {
        const existingIsActive = activeAnneeId && String(existing.annee_catechese_id) === String(activeAnneeId);
        const currentIsActive = activeAnneeId && String(insc.annee_catechese_id) === String(activeAnneeId);
        if (!existingIsActive && currentIsActive) {
          inscByCatId.set(cid, insc);
        } else if (existingIsActive === currentIsActive) {
          if (Number(insc.id || 0) > Number(existing.id || 0)) {
            inscByCatId.set(cid, insc);
          }
        }
      }
    }

    // 1. On parcourt les inscriptions annuelles filtrées (une par catéchumène, la plus récente)
    for (const insc of inscByCatId.values()) {
      const cid = String(insc.catechumene_id || insc.catechumene?.id || '');
      const fullCat = finalCatechumenes.find(c => String(c.id) === cid || String(c.uuid) === cid);
      const cat = fullCat ? { ...fullCat, ...(insc.catechumene || {}) } : (insc.catechumene || null);
      if (!cat) continue;

      const catId = String(cat.id || cat.uuid || cid || insc.id);

      // Résolution Classe (en premier pour pouvoir déduire le niveau si besoin)
      const clObj = finalClasses.find(c => String(c.id) === String(insc.classe_id || insc.classe?.id))
        || (typeof insc.classe === 'object' ? insc.classe : null)
        || finalClasses.find(c => String(c.id) === String(cat.classe_id || cat.classe?.id));
      const classeNom = clObj?.nom || (typeof insc.classe === 'string' ? insc.classe : '') || (typeof cat.classe === 'string' ? cat.classe : '') || '';
      const classeId = String(clObj?.id || insc.classe_id || cat.classe_id || '');

      // Résolution Niveau
      const nivObj = clObj?.niveau
        || finalNiveaux.find(n => String(n.id) === String(clObj?.niveau_id || insc.niveau_id || insc.classe?.niveau_id || cat.niveau_id))
        || (typeof insc.niveau === 'object' ? insc.niveau : null)
        || (typeof cat.niveau === 'object' ? cat.niveau : null);
      let niveauNom = nivObj?.nom || (typeof insc.niveau === 'string' ? insc.niveau : '') || (typeof cat.niveau === 'string' ? cat.niveau : '') || '';
      const niveauId = String(nivObj?.id || clObj?.niveau_id || insc.niveau_id || cat.niveau_id || '');
      let rawOrdre = nivObj?.ordre ?? nivObj?.ordre_affichage;
      let niveauOrdre = typeof rawOrdre === 'number' ? rawOrdre : (typeof rawOrdre === 'string' ? parseInt(rawOrdre, 10) : undefined);

      // Déduction pastorale si le niveau n'est pas renseigné ou générique mais la classe l'est
      if ((!niveauNom || (!this.is3emeAnnee(niveauNom, niveauOrdre) && !this.is4emeAnnee(niveauNom, niveauOrdre) && !this.is5emeAnnee(niveauNom, niveauOrdre))) && classeNom) {
        if (this.is3emeAnnee(classeNom)) {
          niveauNom = '3ème Année';
          niveauOrdre = 3;
        } else if (this.is4emeAnnee(classeNom)) {
          niveauNom = '4ème Année';
          niveauOrdre = 4;
        } else if (this.is5emeAnnee(classeNom)) {
          niveauNom = '5ème Année';
          niveauOrdre = 5;
        }
      }

      // Résolution Section
      const secObj = clObj?.section
        || nivObj?.section
        || finalSections.find(s => String(s.id) === String(clObj?.section_id || nivObj?.section_id || insc.section_id || cat.section_id))
        || (typeof insc.section === 'object' ? insc.section : null)
        || (typeof cat.section === 'object' ? cat.section : null);
      let sectionNom = secObj?.nom || (typeof insc.section === 'string' ? insc.section : '') || (typeof cat.section === 'string' ? cat.section : '') || '';
      const sectionId = String(secObj?.id || nivObj?.section_id || insc.section_id || cat.section_id || '');
      let sectionCode = (secObj?.code || '').toUpperCase();

      // Déduction pastorale si la section est adulte via le nom de la classe ou du niveau
      if (!sectionCode && (classeNom.toLowerCase().includes('adulte') || niveauNom.toLowerCase().includes('adulte') || sectionNom.toLowerCase().includes('adulte'))) {
        sectionCode = 'SEC-ADULTE';
        if (!sectionNom) sectionNom = 'Adultes';
      }

      const isBapt = this.checkIsBaptise(cat, insc);
      const isCom = this.checkIsCommunie(cat, insc);
      const isConf = this.checkIsConfirme(cat, insc);

      const baptemeRec: SacrementRecord | undefined = isBapt ? {
        id: 'bap-' + catId,
        type: 'Baptême',
        date: cat.date_bapteme || '',
        lieu: cat.paroisse_bapteme || cat.lieu_bapteme || cat.ville_bapteme || cat.diocese_bapteme || '',
        celebrant: cat.celebrant_bapteme || cat.ministre_bapteme || '',
        parrain: cat.nom_parrain || '',
        numRegistre: cat.num_carnet_bapteme || '',
        dateEnregistrement: cat.created_at || ''
      } : undefined;

      const comRec: SacrementRecord | undefined = isCom ? {
        id: 'com-' + catId,
        type: 'Première Communion',
        date: cat.date_premiere_communion || '',
        lieu: cat.paroisse_premiere_communion || '',
        celebrant: cat.celebrant_premiere_communion || cat.celebrant_communion || '',
        dateEnregistrement: cat.created_at || ''
      } : undefined;

      const confRec: SacrementRecord | undefined = isConf ? {
        id: 'conf-' + catId,
        type: 'Confirmation',
        date: cat.date_confirmation || '',
        lieu: cat.paroisse_confirmation || '',
        celebrant: cat.ministre_confirmation || '',
        parrain: cat.nom_parrain || '',
        dateEnregistrement: cat.created_at || ''
      } : undefined;

      const rawPhone = cat.telephone || cat.telephone_pere || cat.telephone_mere || cat.telephone_tuteur || '';

      resultMap.set(catId, {
        id: catId,
        uuid: cat.uuid || (cid.length > 20 ? cid : undefined),
        matricule: cat.code_catechumene || cat.matricule || `CAT-${catId}`,
        nom: cat.nom || '',
        prenoms: cat.prenoms || '',
        section: sectionNom,
        section_id: sectionId,
        section_code: sectionCode,
        classe: classeNom,
        classe_id: classeId,
        niveau: niveauNom,
        niveau_id: niveauId,
        niveau_ordre: niveauOrdre,
        telephone: rawPhone,
        statut: cat.statut || 'actif',
        isBaptise: isBapt,
        isPremiereCommunion: isCom,
        isConfirme: isConf,
        baptemeRecord: baptemeRec,
        premiereCommunionRecord: comRec,
        confirmationRecord: confRec,
        exceptions: exceptionsMap.get(catId) || (cat.uuid ? exceptionsMap.get(cat.uuid) : null) || (Array.isArray(cat.exceptions) ? cat.exceptions : [])
      });
    }

    // 2. On complète avec les catéchumènes de catechumeneService qui ne seraient pas encore dans resultMap
    for (const cat of finalCatechumenes) {
      const catId = String(cat.id);
      if (resultMap.has(catId)) continue;

      const inArray = Array.isArray(cat.inscriptions_annuelles) ? [...cat.inscriptions_annuelles] : [];
      inArray.sort((a: any, b: any) => Number(b.id || 0) - Number(a.id || 0));
      const latestInsc = inArray.find((i: any) => activeAnneeId && String(i.annee_catechese_id) === String(activeAnneeId)) || inArray[0];

      const clObj = finalClasses.find(c => String(c.id) === String(latestInsc?.classe_id || cat.classe_id))
        || (typeof latestInsc?.classe === 'object' ? latestInsc.classe : null)
        || (typeof cat.classe === 'object' ? cat.classe : null);
      const classeNom = clObj?.nom || (typeof latestInsc?.classe === 'string' ? latestInsc.classe : '') || (typeof cat.classe === 'string' ? cat.classe : '') || '';
      const classeId = String(clObj?.id || latestInsc?.classe_id || cat.classe_id || '');

      const nivObj = clObj?.niveau
        || finalNiveaux.find(n => String(n.id) === String(clObj?.niveau_id || latestInsc?.niveau_id || latestInsc?.classe?.niveau_id || cat.niveau_id))
        || (typeof latestInsc?.niveau === 'object' ? latestInsc.niveau : null)
        || (typeof cat.niveau === 'object' ? cat.niveau : null);
      let niveauNom = nivObj?.nom || (typeof latestInsc?.niveau === 'string' ? latestInsc.niveau : '') || (typeof cat.niveau === 'string' ? cat.niveau : '') || '';
      const niveauId = String(nivObj?.id || clObj?.niveau_id || latestInsc?.niveau_id || cat.niveau_id || '');

      let rawOrdre = nivObj?.ordre ?? nivObj?.ordre_affichage;
      let niveauOrdre = typeof rawOrdre === 'number' ? rawOrdre : (typeof rawOrdre === 'string' ? parseInt(rawOrdre, 10) : undefined);

      // Déduction pastorale si le niveau n'est pas renseigné ou générique mais la classe l'est
      if ((!niveauNom || (!this.is3emeAnnee(niveauNom, niveauOrdre) && !this.is4emeAnnee(niveauNom, niveauOrdre) && !this.is5emeAnnee(niveauNom, niveauOrdre))) && classeNom) {
        if (this.is3emeAnnee(classeNom)) {
          niveauNom = '3ème Année';
          niveauOrdre = 3;
        } else if (this.is4emeAnnee(classeNom)) {
          niveauNom = '4ème Année';
          niveauOrdre = 4;
        } else if (this.is5emeAnnee(classeNom)) {
          niveauNom = '5ème Année';
          niveauOrdre = 5;
        }
      }

      const secObj = clObj?.section
        || nivObj?.section
        || finalSections.find(s => String(s.id) === String(clObj?.section_id || nivObj?.section_id || latestInsc?.section_id || cat.section_id))
        || (typeof latestInsc?.section === 'object' ? latestInsc.section : null)
        || (typeof cat.section === 'object' ? cat.section : null);
      let sectionNom = secObj?.nom || (typeof latestInsc?.section === 'string' ? latestInsc.section : '') || (typeof cat.section === 'string' ? cat.section : '') || '';
      const sectionId = String(secObj?.id || nivObj?.section_id || latestInsc?.section_id || cat.section_id || '');
      let sectionCode = (secObj?.code || '').toUpperCase();

      if (!sectionCode && (classeNom.toLowerCase().includes('adulte') || niveauNom.toLowerCase().includes('adulte') || sectionNom.toLowerCase().includes('adulte'))) {
        sectionCode = 'SEC-ADULTE';
        if (!sectionNom) sectionNom = 'Adultes';
      }

      const isBapt = this.checkIsBaptise(cat, latestInsc);
      const isCom = this.checkIsCommunie(cat, latestInsc);
      const isConf = this.checkIsConfirme(cat, latestInsc);

      const rawPhone = cat.telephone || cat.telephone_pere || cat.telephone_mere || cat.telephone_tuteur || '';

      resultMap.set(catId, {
        id: catId,
        uuid: cat.uuid || (catId.length > 20 ? catId : undefined),
        matricule: cat.code_catechumene || cat.matricule || `CAT-${catId}`,
        nom: cat.nom || '',
        prenoms: cat.prenoms || '',
        section: sectionNom,
        section_id: sectionId,
        section_code: sectionCode,
        classe: classeNom,
        classe_id: classeId,
        niveau: niveauNom || nivObj?.nom || '',
        niveau_id: niveauId || String(nivObj?.id || ''),
        niveau_ordre: niveauOrdre,
        telephone: rawPhone,
        statut: cat.statut || 'actif',
        isBaptise: isBapt,
        isPremiereCommunion: isCom,
        isConfirme: isConf,
        baptemeRecord: isBapt ? {
          id: 'bap-' + catId,
          type: 'Baptême',
          date: cat.date_bapteme || '',
          lieu: cat.paroisse_bapteme || cat.lieu_bapteme || cat.ville_bapteme || cat.diocese_bapteme || '',
          celebrant: cat.celebrant_bapteme || cat.ministre_bapteme || '',
          parrain: cat.nom_parrain || '',
          numRegistre: cat.num_carnet_bapteme || '',
          dateEnregistrement: cat.created_at || ''
        } : undefined,
        premiereCommunionRecord: isCom ? {
          id: 'com-' + catId,
          type: 'Première Communion',
          date: cat.date_premiere_communion || '',
          lieu: cat.paroisse_premiere_communion || '',
          celebrant: cat.celebrant_premiere_communion || cat.celebrant_communion || '',
          dateEnregistrement: cat.created_at || ''
        } : undefined,
        confirmationRecord: isConf ? {
          id: 'conf-' + catId,
          type: 'Confirmation',
          date: cat.date_confirmation || '',
          lieu: cat.paroisse_confirmation || '',
          celebrant: cat.ministre_confirmation || '',
          parrain: cat.nom_parrain || '',
          dateEnregistrement: cat.created_at || ''
        } : undefined,
        exceptions: exceptionsMap.get(catId) || (cat.uuid ? exceptionsMap.get(cat.uuid) : null) || (Array.isArray(cat.exceptions) ? cat.exceptions : [])
      });
    }

    this.catechumenes.set(Array.from(resultMap.values()));
  }

  // --- RÈGLES PASTORALES DYNAMIQUES (Computed Signals) ---

  // 1. CANDIDATS BAPTÊME : 3ème Année + NON BAPTISÉ (ou exception)
  public readonly candidatsBapteme = computed<CatechumeneSacrement[]>(() => {
    const apiList = this.apiCandidatsBapteme();
    const fallbackList = this.catechumenes().filter(c => {
      const is3eme = this.is3emeAnnee(c.niveau, c.niveau_ordre) || this.is3emeAnnee(c.classe);
      const nonBaptise = !c.isBaptise;
      return is3eme && nonBaptise;
    });
    const baseList = apiList.length > 0 ? apiList : fallbackList;
    const excCatIds = new Set(this.exceptions().filter(e => e.sacrementType === 'Baptême').map(e => e.catechumeneId));
    const exceptions = this.catechumenes().filter(c =>
      excCatIds.has(c.id) ||
      (c.uuid && excCatIds.has(c.uuid)) ||
      c.exceptions?.some(e => e.sacrementType === 'Baptême')
    );
    const map = new Map<string, CatechumeneSacrement>();
    baseList.forEach(c => map.set(c.id, c));
    exceptions.forEach(c => map.set(c.id, c));
    return Array.from(map.values());
  });

  // 2. CANDIDATS PREMIÈRE COMMUNION : 3ème Année + DÉJÀ BAPTISÉ (ou exception)
  public readonly candidatsPremiereCommunion = computed<CatechumeneSacrement[]>(() => {
    const apiList = this.apiCandidatsCommunion();
    const fallbackList = this.catechumenes().filter(c => {
      const is3eme = this.is3emeAnnee(c.niveau, c.niveau_ordre) || this.is3emeAnnee(c.classe);
      const dejaBaptise = c.isBaptise;
      return is3eme && dejaBaptise;
    });
    const baseList = apiList.length > 0 ? apiList : fallbackList;
    const excCatIds = new Set(this.exceptions().filter(e => e.sacrementType === 'Première Communion').map(e => e.catechumeneId));
    const exceptions = this.catechumenes().filter(c =>
      excCatIds.has(c.id) ||
      (c.uuid && excCatIds.has(c.uuid)) ||
      c.exceptions?.some(e => e.sacrementType === 'Première Communion')
    );
    const map = new Map<string, CatechumeneSacrement>();
    baseList.forEach(c => map.set(c.id, c));
    exceptions.forEach(c => map.set(c.id, c));
    return Array.from(map.values());
  });

  // 3. CANDIDATS CONFIRMATION :
  // - Si section SEC-ADULTE : 4ème ou 5ème Année + BAPTISÉ (ou exception)
  // - Sinon : 5ème Année + BAPTISÉ (ou exception)
  public readonly candidatsConfirmation = computed<CatechumeneSacrement[]>(() => {
    const apiList = this.apiCandidatsConfirmation();
    const fallbackList = this.catechumenes().filter(c => {
      const isAdulte = this.isSectionAdulte(c.section_code, c.section, null, `${c.classe} ${c.niveau}`);
      const is4eme = this.is4emeAnnee(c.niveau, c.niveau_ordre) || this.is4emeAnnee(c.classe);
      const is5eme = this.is5emeAnnee(c.niveau, c.niveau_ordre) || this.is5emeAnnee(c.classe);
      const isNiveauValide = isAdulte ? (is4eme || is5eme) : is5eme;
      const dejaBaptise = c.isBaptise;
      return isNiveauValide && dejaBaptise;
    });
    const baseList = apiList.length > 0 ? apiList : fallbackList;
    const excCatIds = new Set(this.exceptions().filter(e => e.sacrementType === 'Confirmation').map(e => e.catechumeneId));
    const exceptions = this.catechumenes().filter(c =>
      excCatIds.has(c.id) ||
      (c.uuid && excCatIds.has(c.uuid)) ||
      c.exceptions?.some(e => e.sacrementType === 'Confirmation')
    );
    const map = new Map<string, CatechumeneSacrement>();
    baseList.forEach(c => map.set(c.id, c));
    exceptions.forEach(c => map.set(c.id, c));
    return Array.from(map.values());
  });

  // 4. TOUTES LES EXCEPTIONS PASTORALES
  public readonly allExceptions = computed<ExceptionSacrement[]>(() => {
    const fromApi = this.exceptions();
    const catMap = new Map<string, CatechumeneSacrement>();
    this.catechumenes().forEach(c => {
      catMap.set(c.id, c);
      if (c.uuid) catMap.set(c.uuid, c);
    });

    const result: ExceptionSacrement[] = fromApi.map(e => {
      const cat = catMap.get(e.catechumeneId);
      return {
        ...e,
        catechumeneNomComplet: e.catechumeneNomComplet || (cat ? `${cat.nom} ${cat.prenoms}` : 'Catéchumène'),
        section: e.section || cat?.section || '',
        section_id: e.section_id || cat?.section_id,
        classe: e.classe || cat?.classe || '',
        classe_id: e.classe_id || cat?.classe_id,
        niveau: e.niveau || cat?.niveau || '',
        niveau_id: e.niveau_id || cat?.niveau_id,
      };
    });

    this.catechumenes().forEach(c => {
      if (c.exceptions && c.exceptions.length > 0) {
        c.exceptions.forEach(e => {
          if (!result.some(r => r.id === e.id)) {
            result.push({
              ...e,
              catechumeneNomComplet: `${c.nom} ${c.prenoms}`,
              section: c.section,
              section_id: c.section_id,
              classe: c.classe,
              classe_id: c.classe_id,
              niveau: c.niveau,
              niveau_id: c.niveau_id
            });
          }
        });
      }
    });

    return result;
  });

  // 5. CATÉCHUMÈNES ÉLIGIBLES À UNE DÉROGATION PASTORALE (HORS CRITÈRES NORMAUX & NON ENCORE REÇU)
  public getCatechumenesEligiblesPourDerogation(sacrementType: TypeSacrement): CatechumeneSacrement[] {
    const all = this.catechumenes();
    if (sacrementType === 'Baptême') {
      const naturelsIds = new Set(
        all.filter(c => (this.is3emeAnnee(c.niveau, c.niveau_ordre) || this.is3emeAnnee(c.classe)) && !c.isBaptise).map(c => c.id)
      );
      this.apiCandidatsBapteme().forEach(c => naturelsIds.add(c.id));

      return all.filter(c =>
        !c.isBaptise &&
        !naturelsIds.has(c.id) &&
        !c.exceptions?.some(e => e.sacrementType === 'Baptême')
      );
    } else if (sacrementType === 'Première Communion') {
      const naturelsIds = new Set(
        all.filter(c => (this.is3emeAnnee(c.niveau, c.niveau_ordre) || this.is3emeAnnee(c.classe)) && c.isBaptise).map(c => c.id)
      );
      this.apiCandidatsCommunion().forEach(c => naturelsIds.add(c.id));

      return all.filter(c =>
        !c.isPremiereCommunion &&
        !naturelsIds.has(c.id) &&
        !c.exceptions?.some(e => e.sacrementType === 'Première Communion')
      );
    } else if (sacrementType === 'Confirmation') {
      const naturelsIds = new Set(
        all.filter(c => {
          const isAdulte = this.isSectionAdulte(c.section_code, c.section, null, `${c.classe} ${c.niveau}`);
          const is4eme = this.is4emeAnnee(c.niveau, c.niveau_ordre) || this.is4emeAnnee(c.classe);
          const is5eme = this.is5emeAnnee(c.niveau, c.niveau_ordre) || this.is5emeAnnee(c.classe);
          const isNiveauValide = isAdulte ? (is4eme || is5eme) : is5eme;
          return isNiveauValide && c.isBaptise;
        }).map(c => c.id)
      );
      this.apiCandidatsConfirmation().forEach(c => naturelsIds.add(c.id));

      return all.filter(c =>
        !c.isConfirme &&
        !naturelsIds.has(c.id) &&
        !c.exceptions?.some(e => e.sacrementType === 'Confirmation')
      );
    }
    return all;
  }

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
  ): Observable<any> {
    const cat = this.catechumenes().find(c => c.id === catechumeneId);
    const activeAnnee = this.anneeService.activeAnnee();
    const payload = {
      catechumene_id: catechumeneId,
      sacrement_type: sacrementType,
      motif,
      autorise_par: autorisePar,
      observation,
      annee_catechese_id: activeAnnee?.id,
      date_derogation: new Date().toISOString().split('T')[0]
    };

    return this.http.post<any>(`${this.baseUrl}/exceptions`, payload).pipe(
      tap(res => {
        const item = res.data;
        const newException: ExceptionSacrement = {
          id: String(item?.id || item?.uuid || ('exc-' + Date.now())),
          catechumeneId,
          catechumeneNomComplet: cat ? `${cat.nom} ${cat.prenoms}` : (item?.catechumeneNomComplet || ''),
          section: cat?.section || item?.section || '',
          section_id: cat?.section_id || item?.section_id,
          classe: cat?.classe || item?.classe || '',
          classe_id: cat?.classe_id || item?.classe_id,
          niveau: cat?.niveau || item?.niveau || '',
          niveau_id: cat?.niveau_id || item?.niveau_id,
          sacrementType,
          motif,
          autorisePar,
          observation,
          dateAjout: item?.dateAjout || item?.date_derogation || new Date().toISOString().split('T')[0],
          annee_catechese_id: item?.annee_catechese_id || item?.anneeCatecheseId || activeAnnee?.id,
          anneeCatecheseLibelle: item?.anneeCatecheseLibelle || item?.annee_catechese_libelle || activeAnnee?.libelle || ''
        };

        this.exceptions.update(list => [newException, ...list]);

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
      })
    );
  }

  public updateException(
    exceptionId: string,
    data: {
      motif?: MotifException;
      autorisePar?: string;
      observation?: string;
      sacrementType?: TypeSacrement;
    }
  ): Observable<any> {
    const payload: any = {};
    if (data.motif) payload.motif = data.motif;
    if (data.autorisePar) payload.autorise_par = data.autorisePar;
    if (data.observation !== undefined) payload.observation = data.observation;
    if (data.sacrementType) payload.sacrement_type = data.sacrementType;

    return this.http.put<any>(`${this.baseUrl}/exceptions/${exceptionId}`, payload).pipe(
      tap(res => {
        this.exceptions.update(list =>
          list.map(e => {
            if (e.id === exceptionId) {
              return {
                ...e,
                motif: data.motif || e.motif,
                autorisePar: data.autorisePar || e.autorisePar,
                observation: data.observation !== undefined ? data.observation : e.observation,
                sacrementType: data.sacrementType || e.sacrementType
              };
            }
            return e;
          })
        );

        this.catechumenes.update(list =>
          list.map(c => {
            if (c.exceptions && c.exceptions.some(e => e.id === exceptionId)) {
              return {
                ...c,
                exceptions: c.exceptions.map(e => {
                  if (e.id === exceptionId) {
                    return {
                      ...e,
                      motif: data.motif || e.motif,
                      autorisePar: data.autorisePar || e.autorisePar,
                      observation: data.observation !== undefined ? data.observation : e.observation,
                      sacrementType: data.sacrementType || e.sacrementType
                    };
                  }
                  return e;
                })
              };
            }
            return c;
          })
        );
      })
    );
  }

  public deleteException(exceptionId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/exceptions/${exceptionId}`).pipe(
      tap(() => {
        this.exceptions.update(list => list.filter(e => e.id !== exceptionId));
        this.catechumenes.update(list =>
          list.map(c => ({
            ...c,
            exceptions: c.exceptions ? c.exceptions.filter(e => e.id !== exceptionId) : []
          }))
        );
      })
    );
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
            lieu: '',
            celebrant: '',
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
      }
      this.http.put(`${this.catechumenesUrl}/${id}`, payload).pipe(catchError(() => of(null))).subscribe();
    });
  }

  public removeCandidate(id: string): void {
    this.catechumenes.update(list => list.filter(c => c.id !== id));
  }
}
