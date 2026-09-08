import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BulletinService } from '../services/bulletin.service';
import { BulletinDocData, BulletinEvaluationItemDto } from '../models/bulletin.model';
import { BilanAnnuelItem } from '../../bilan-annuel/models/bilan-annuel.model';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { InscriptionAnnuelleService } from '../../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { CatechumeneService } from '../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { SeanceService } from '../../../Presences/services/seance.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { EvaluationService } from '../../evaluation/services/evaluation.service';
import { ClasseMoyennesResponse } from '../../evaluation/models/evaluation.model';
import { PdfPreviewService } from '../../../../core/services/pdf-preview.service';
import { AffectationAnimateurService } from '../../../Organisations/affectation-animateurs/services/affectation-animateur.service';
import { ModuleTrimestrielService } from '../../../Organisations/Modules-treimestriels/services/module-trimestriel.service';

@Component({
  selector: 'app-bulletin-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './bulletin-page.component.html',
  styleUrl: './bulletin-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulletinPageComponent implements OnInit {
  public readonly service = inject(BulletinService);
  public readonly sectionService = inject(SectionService);
  public readonly niveauService = inject(NiveauService);
  public readonly classeService = inject(ClasseService);
  public readonly inscriptionService = inject(InscriptionAnnuelleService);
  public readonly catechumeneService = inject(CatechumeneService);
  public readonly seanceService = inject(SeanceService);
  public readonly anneeService = inject(AnneeCatecheseService);
  public readonly evalService = inject(EvaluationService);
  public readonly pdfPreviewService = inject(PdfPreviewService);
  public readonly affectationService = inject(AffectationAnimateurService);
  public readonly moduleTrimestrielService = inject(ModuleTrimestrielService);

  // Signaux des services
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.classeService.classes;
  public readonly inscriptions = this.inscriptionService.inscriptions;
  public readonly catechumenes = this.catechumeneService.catechumenes;
  public readonly seances = this.seanceService.seances;
  public readonly activeAnnee = this.anneeService.activeAnnee;
  public readonly modules = this.moduleTrimestrielService.modules;

  // Données de classe et moyennes calculées par le backend
  public readonly classAverages = signal<ClasseMoyennesResponse | null>(null);
  public readonly isLoadingAverages = signal<boolean>(false);

  // Signaux de filtres (sans présélection automatique)
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly selectedPeriode = signal<string>('Trimestre 1');
  public readonly searchQuery = signal<string>('');

  // Listes en cascade
  public readonly filteredNiveaux = computed(() => {
    const secId = this.selectedSectionId();
    const all = this.niveaux();
    if (!secId) return all;
    return all.filter(n => n.section_id === secId || n.section?.id === secId);
  });

  public readonly filteredClasses = computed(() => {
    const secId = this.selectedSectionId();
    const nivId = this.selectedNiveauId();
    let list = this.classes();
    if (secId) {
      list = list.filter(c => c.niveau?.section_id === secId || c.niveau?.section?.id === secId);
    }
    if (nivId) {
      list = list.filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
    }
    return list;
  });

  public readonly selectedSectionName = computed<string>(() => {
    const sid = this.selectedSectionId();
    const s = this.sections().find(item => item.id === sid);
    return s ? s.nom : '';
  });

  public readonly selectedNiveauName = computed<string>(() => {
    const nid = this.selectedNiveauId();
    const n = this.niveaux().find(item => item.id === nid);
    return n ? n.nom : '';
  });

  public readonly selectedClasseName = computed<string>(() => {
    const cid = this.selectedClasseId();
    const cls = this.classes().find(c => c.id === cid);
    return cls ? cls.nom : 'Aucune classe sélectionnée';
  });

  public readonly selectedClasseAnimateurs = computed<string>(() => {
    const cid = this.selectedClasseId();
    if (!cid) return '';

    // 1. Depuis AffectationAnimateurService
    const list = this.affectationService.affectations().filter(
      a => a.classe_id === cid || a.classe?.id === cid
    );
    if (list.length > 0) {
      const names = list
        .map(a => {
          const anim = a.animateur;
          if (!anim) return '';
          return `${anim.nom} ${anim.prenoms}`.trim();
        })
        .filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }

    // 2. Fallback classe object
    const cls = this.classes().find(c => c.id === cid) as any;
    if (cls?.animateurs_nom) return cls.animateurs_nom;
    if (Array.isArray(cls?.animateurs) && cls.animateurs.length > 0) {
      return cls.animateurs
        .map((a: any) => typeof a === 'string' ? a : `${a.nom || ''} ${a.prenoms || ''}`.trim())
        .filter(Boolean)
        .join(', ');
    }

    return '';
  });

  public readonly currentAnneePastorale = computed<string>(() => {
    const active = this.activeAnnee();
    return active ? active.libelle : '2025-2026';
  });

  // Statut de validation officielle
  public readonly isValide = computed(() => {
    const cid = this.selectedClasseId();
    if (!cid) return false;
    return this.service.bilanService.isBilanOfficielValide(this.currentAnneePastorale(), cid);
  });

  // Liste des bilans calculée UNIQUEMENT si une classe est sélectionnée
  public readonly classBilans = computed<BilanAnnuelItem[]>(() => {
    const cid = this.selectedClasseId();
    if (!cid) return [];

    const allInscriptions = this.inscriptions();
    const allCats = this.catechumenes();
    const allSeances = this.seances();
    const activeAnnee = this.currentAnneePastorale();
    const averages = this.classAverages();

    const classInscriptions = allInscriptions.filter(i => i.classe_id === cid || i.classe?.id === cid);

    const classSeances = allSeances.filter(s =>
      (s.classe_id === cid || s.classe?.id === cid) && s.presences && s.presences.length > 0
    );
    const totalSeances = classSeances.length;

    return classInscriptions.map(ins => {
      const catId = ins.catechumene_id || ins.catechumene?.id || ins.id;
      const cat = ins.catechumene || allCats.find(c => c.id === catId);

      const nom = cat?.nom || '';
      const prenoms = cat?.prenoms || '';
      const fullName = `${nom} ${prenoms}`.trim() || `Catéchumène #${catId.substring(0, 6)}`;
      const matricule = cat?.matricule || cat?.code_catechumene || ins.code_inscription || '';

      // Calcul assiduité cours
      let presenceCoursAuto = 90;
      if (totalSeances > 0) {
        const presents = classSeances.filter(s =>
          s.presences?.some(p =>
            p.catechumene_id === catId &&
            (p.statut_presence === 'present' || p.statut_presence === 'retard' || p.est_present)
          )
        ).length;
        presenceCoursAuto = Math.round((presents / totalSeances) * 100);
      }

      // Moyenne réelle calculée par le backend
      const eleveAvg = averages?.eleves?.find(e =>
        String(e.catechumene_id) === String(catId) ||
        (matricule && e.matricule && String(e.matricule).toLowerCase().trim() === String(matricule).toLowerCase().trim()) ||
        (e.nom_prenoms && fullName && String(e.nom_prenoms).toLowerCase().trim() === String(fullName).toLowerCase().trim())
      );
      const rawMoy = eleveAvg?.moyenne ?? (eleveAvg as any)?.moyenne_generale ?? (eleveAvg as any)?.moyenne_sur_20 ?? (eleveAvg as any)?.moyenne_annuelle;
      let moyenneGenerale = (rawMoy !== undefined && rawMoy !== null && rawMoy !== '')
        ? parseFloat(Number(rawMoy).toFixed(2))
        : null;

      if (moyenneGenerale === null && eleveAvg?.details_notes && eleveAvg.details_notes.length > 0) {
        let sumCoeff = 0;
        let sumPts = 0;
        for (const n of eleveAvg.details_notes) {
          const noteSur20 = n.note_sur_20 !== null && n.note_sur_20 !== undefined
            ? Number(n.note_sur_20)
            : (n.note_obtenue !== null && n.note_obtenue !== undefined && n.note_max > 0 ? (Number(n.note_obtenue) / n.note_max) * 20 : null);
          if (noteSur20 !== null) {
            const coeff = n.coefficient || 1;
            sumCoeff += coeff;
            sumPts += noteSur20 * coeff;
          }
        }
        if (sumCoeff > 0) {
          moyenneGenerale = parseFloat((sumPts / sumCoeff).toFixed(2));
        }
      }

      // Décision : la décision validée par l'animateur lors du bilan prime en priorité absolue
      const savedBilan = this.service.bilanService.getBilanData(activeAnnee, cid);
      const savedItem = savedBilan?.find(b =>
        (matricule && b.matricule && b.matricule.trim().toLowerCase() === matricule.trim().toLowerCase()) ||
        b.catechumeneId === catId
      );

      let decision = savedItem?.decision;
      if (!decision) {
        if (moyenneGenerale !== null) {
          if (moyenneGenerale >= 10) decision = 'Admis';
          else if (moyenneGenerale >= 8.5) decision = 'Ajourné';
          else decision = 'Non admis';
        } else {
          decision = 'Admis';
        }
      }

      return {
        catechumeneId: catId,
        matricule,
        nomPrenoms: fullName,
        section: ins.section?.nom || this.selectedSectionName(),
        niveau: ins.niveau?.nom || this.selectedNiveauName(),
        classe: ins.classe?.nom || this.selectedClasseName(),
        anneePastorale: activeAnnee,
        moyenneGenerale,
        presenceCoursPct: presenceCoursAuto,
        presenceMesse: 0,
        presenceCEB: 0,
        presenceMouvement: 0,
        decision: decision as any
      };
    });
  });

  // Liste filtrée des bilans pour la classe sélectionnée
  public readonly filteredBilans = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.classBilans();

    if (!q) return list;
    return list.filter(b =>
      b.nomPrenoms.toLowerCase().includes(q) ||
      b.matricule.toLowerCase().includes(q)
    );
  });

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.inscriptionService.getAll().subscribe();
    this.seanceService.getAll().subscribe();
    this.affectationService.getAll().subscribe();
    this.moduleTrimestrielService.getAll().subscribe();
  }

  public onSectionChange(sectionId: string): void {
    this.selectedSectionId.set(sectionId);
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');
    this.classAverages.set(null);
  }

  public onNiveauChange(niveauId: string): void {
    this.selectedNiveauId.set(niveauId);
    this.selectedClasseId.set('');
    this.classAverages.set(null);
  }

  public onClasseChange(classeId: string): void {
    this.selectedClasseId.set(classeId);
    if (classeId) {
      this.loadClassData(classeId);
    } else {
      this.classAverages.set(null);
    }
  }

  public onPeriodeChange(periode: string): void {
    this.selectedPeriode.set(periode);
    if (this.selectedClasseId()) {
      this.loadClassData(this.selectedClasseId());
    }
  }

  public loadClassData(classeId: string): void {
    this.isLoadingAverages.set(true);
    const periode = this.selectedPeriode();
    this.evalService.getClassAverages(classeId, this.activeAnnee()?.id, periode).subscribe({
      next: res => {
        this.classAverages.set(res);
        this.isLoadingAverages.set(false);
      },
      error: () => {
        this.classAverages.set(null);
        this.isLoadingAverages.set(false);
      }
    });
  }

  /**
   * Calcul du rang de l'élève
   */
  public getRang(bilan: BilanAnnuelItem): string {
    const sorted = [...this.filteredBilans()]
      .filter(x => x.moyenneGenerale !== null)
      .sort((a, b) => (b.moyenneGenerale ?? 0) - (a.moyenneGenerale ?? 0));

    const index = sorted.findIndex(x => x.catechumeneId === bilan.catechumeneId);
    if (index === -1) return '—';
    const rankNum = index + 1;
    return rankNum === 1 ? '1er' : `${rankNum}e`;
  }

  /**
   * Construit l'objet BulletinDocData pour un catéchumène donné
   */
  public buildBulletinDocData(bilan: BilanAnnuelItem): BulletinDocData {
    const averages = this.classAverages();
    const eleveAvg = averages?.eleves?.find(e =>
      e.catechumene_id === bilan.catechumeneId ||
      (bilan.matricule && e.matricule && e.matricule.toLowerCase() === bilan.matricule.toLowerCase())
    );

    // Construction des détails des évaluations
    const evalsList = averages?.evaluations || [];

    // Détermination du trimestre à afficher
    const periodeSelect = this.selectedPeriode();
    const trimestreAffiche = (periodeSelect && periodeSelect !== 'toutes' && periodeSelect !== 'all')
      ? periodeSelect
      : ((averages as any)?.trimestre || (evalsList[0] as any)?.periode || (evalsList[0] as any)?.trimestre || 'Trimestre 1');

    const evaluationItems: BulletinEvaluationItemDto[] = evalsList.map(ev => {
      const noteEntry = eleveAvg?.details_notes?.find(n => n.evaluation_id === ev.id);
      const noteObtenue = noteEntry?.note_obtenue !== undefined && noteEntry?.note_obtenue !== null
        ? Number(noteEntry.note_obtenue)
        : null;
      const noteSur20 = noteEntry?.note_sur_20 !== undefined && noteEntry?.note_sur_20 !== null
        ? Number(noteEntry.note_sur_20)
        : (noteObtenue !== null && ev.note_max > 0 ? parseFloat(((noteObtenue / ev.note_max) * 20).toFixed(2)) : null);

      const totalPondere = noteSur20 !== null ? parseFloat((noteSur20 * ev.coefficient).toFixed(2)) : null;

      return {
        titre: ev.titre,
        type: ev.type_eval || 'Devoir',
        coefficient: ev.coefficient,
        bareme: ev.note_max,
        note_obtenue: noteObtenue,
        note_sur_20: noteSur20,
        total_pondere: totalPondere,
        appreciation: noteEntry?.appreciation || ''
      };
    });

    // Totaux
    let totalCoeff = 0;
    let totalPoints = 0;
    evaluationItems.forEach(item => {
      if (item.total_pondere !== null) {
        totalCoeff += item.coefficient;
        totalPoints += item.total_pondere;
      }
    });

    const calculatedMoy = totalCoeff > 0 ? parseFloat((totalPoints / totalCoeff).toFixed(2)) : null;

    let finalMoyenne = (bilan.moyenneGenerale !== null && bilan.moyenneGenerale !== undefined)
      ? bilan.moyenneGenerale
      : (eleveAvg?.moyenne !== null && eleveAvg?.moyenne !== undefined
          ? Number(eleveAvg.moyenne)
          : calculatedMoy);

    const moyClasse = averages?.statistiques?.moyenne_classe !== undefined && averages?.statistiques?.moyenne_classe !== null
      ? Number(averages.statistiques.moyenne_classe)
      : null;

    return {
      catechumene_id: bilan.catechumeneId,
      nom_prenoms: bilan.nomPrenoms,
      matricule: bilan.matricule,
      section: bilan.section || this.selectedSectionName() || averages?.classe?.section || averages?.classe?.session || '—',
      niveau: bilan.niveau || this.selectedNiveauName() || averages?.classe?.niveau || '—',
      classe: bilan.classe || this.selectedClasseName() || averages?.classe?.nom || '—',
      animateurs: this.selectedClasseAnimateurs() || '—',
      annee_pastorale: bilan.anneePastorale || this.currentAnneePastorale(),
      trimestre: trimestreAffiche,
      periode: trimestreAffiche,
      rang: this.getRang(bilan),
      total_eleves: this.filteredBilans().length,
      evaluations: evaluationItems,
      total_coefficients: totalCoeff,
      total_points: parseFloat(totalPoints.toFixed(2)),
      moyenne_generale: finalMoyenne,
      moyenne_classe: moyClasse,
      presence_cours_pct: bilan.presenceCoursPct,
      presence_messe: bilan.presenceMesse,
      presence_ceb: bilan.presenceCEB,
      presence_mouvement: bilan.presenceMouvement,
      decision: bilan.decision,
      appreciation_generale: eleveAvg?.appreciation || ''
    };
  }

  /**
   * Ouvre directement le bulletin individuel dans le Lecteur PDF Catheo Universel (Format A4 Portrait)
   */
  public openBulletinPdf(bilan: BilanAnnuelItem): void {
    const docData = this.buildBulletinDocData(bilan);
    const trimestreTag = docData.trimestre || this.selectedPeriode() || 'Trimestre 1';

    this.pdfPreviewService.openDocument('bulletin', docData, {
      title: `Bulletin de Catéchèse (${trimestreTag}) — ${bilan.nomPrenoms}`,
      subtitle: `${docData.section} • ${docData.niveau} • ${docData.classe} • ${trimestreTag}`,
      fileName: `bulletin-${trimestreTag.toLowerCase().replace(/\s+/g, '-')}-${bilan.matricule || 'eleve'}.pdf`,
      formatBadge: 'A4 Portrait'
    });
  }

  /**
   * Imprime / affiche TOUS les bulletins de la classe sélectionnée dans le Lecteur PDF Catheo Universel
   */
  public openTousLesBulletinsPdf(): void {
    const list = this.filteredBilans();
    if (list.length === 0) return;

    const allBulletins = list.map(b => this.buildBulletinDocData(b));
    const clsName = this.selectedClasseName();
    const trimestreTag = this.selectedPeriode() || 'Annuel';

    this.pdfPreviewService.openDocument('bulletin', { bulletins: allBulletins }, {
      title: `Tous les Bulletins (${trimestreTag}) — Classe : ${clsName}`,
      subtitle: `${allBulletins.length} élève(s) • ${this.selectedSectionName()} • ${this.selectedNiveauName()} • ${trimestreTag}`,
      fileName: `bulletins-${trimestreTag.toLowerCase().replace(/\s+/g, '-')}-classe-${clsName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      formatBadge: `A4 Portrait (${allBulletins.length} bulletins)`
    });
  }
}
