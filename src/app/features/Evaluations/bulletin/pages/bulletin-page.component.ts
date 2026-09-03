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
import { BulletinDetailRow } from '../models/bulletin.model';
import { BilanAnnuelItem } from '../../bilan-annuel/models/bilan-annuel.model';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { InscriptionAnnuelleService } from '../../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { CatechumeneService } from '../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { SeanceService } from '../../../Presences/services/seance.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { EnteteCatecheseComponent } from '../../../../shared/ui/components/entete-catechese/entete-catechese.component';
import { PdfService } from '../../../../core/services/pdf.service';

@Component({
  selector: 'app-bulletin-page',
  imports: [CommonModule, FormsModule, EnteteCatecheseComponent],
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
  private readonly pdfService = inject(PdfService);

  // Signaux des services
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.classeService.classes;
  public readonly inscriptions = this.inscriptionService.inscriptions;
  public readonly catechumenes = this.catechumeneService.catechumenes;
  public readonly seances = this.seanceService.seances;
  public readonly evaluations = this.service.evalService.evaluations;
  public readonly notes = this.service.notesService.notes;
  public readonly activeAnnee = this.anneeService.activeAnnee;

  // Signaux de filtres
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly searchQuery = signal<string>('');

  // Aperçu du bulletin
  public readonly isBulletinModalOpen = signal(false);
  public readonly selectedBilan = signal<BilanAnnuelItem | null>(null);

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

  public readonly selectedClasseName = computed<string>(() => {
    const cid = this.selectedClasseId();
    const cls = this.classes().find(c => c.id === cid);
    return cls ? cls.nom : 'Toutes les classes';
  });

  public readonly currentAnneePastorale = computed<string>(() => {
    const active = this.activeAnnee();
    return active ? active.libelle : '2025-2026';
  });

  // Statut de validation officielle
  public readonly isValide = computed(() => {
    return this.service.bilanService.isBilanOfficielValide(this.currentAnneePastorale(), this.selectedClasseId());
  });

  // Liste des bilans calculée de façon réactive
  public readonly classBilans = computed<BilanAnnuelItem[]>(() => {
    const cid = this.selectedClasseId();
    const allInscriptions = this.inscriptions();
    const allCats = this.catechumenes();
    const allSeances = this.seances();
    const activeAnnee = this.currentAnneePastorale();
    const allEvals = this.evaluations().filter(e => !cid || e.classe_id === cid || e.classe?.id === cid);
    const allNotes = this.notes();

    let classInscriptions = allInscriptions;
    if (cid) {
      classInscriptions = allInscriptions.filter(i => i.classe_id === cid || i.classe?.id === cid);
    }

    const classSeances = cid
      ? allSeances.filter(s => (s.classe_id === cid || s.classe?.id === cid) && s.presences && s.presences.length > 0)
      : allSeances.filter(s => s.presences && s.presences.length > 0);

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

      // Calcul moyenne générale
      let totalPondere = 0;
      let totalCoeff = 0;
      allEvals.forEach(ev => {
        const entry = allNotes.find(n => (n.evaluationId === ev.id || n.evaluation_id === ev.id) && (n.catechumeneId === catId || n.catechumene_id === catId));
        const noteVal = entry?.note_obtenue ?? entry?.note ?? null;
        if (noteVal !== null && ev.bareme > 0) {
          const noteSur20 = (Number(noteVal) / ev.bareme) * 20;
          totalPondere += noteSur20 * ev.coefficient;
          totalCoeff += ev.coefficient;
        }
      });

      const moyenneGenerale = totalCoeff > 0 ? parseFloat((totalPondere / totalCoeff).toFixed(2)) : 12.5;
      const decision = moyenneGenerale >= 10 ? 'Admis' : (moyenneGenerale >= 8.5 ? 'Ajourné' : 'Non admis');

      return {
        catechumeneId: catId,
        matricule,
        nomPrenoms: fullName,
        section: ins.section?.nom || '',
        niveau: ins.niveau?.nom || '',
        classe: ins.classe?.nom || this.selectedClasseName(),
        anneePastorale: activeAnnee,
        moyenneGenerale,
        presenceCoursPct: presenceCoursAuto,
        presenceMesse: 0,
        presenceCEB: 0,
        presenceMouvement: 0,
        decision
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

  // Détails des notes pour le bulletin sélectionné
  public readonly bulletinNotes = computed<BulletinDetailRow[]>(() => {
    const b = this.selectedBilan();
    if (!b) return [];

    const cid = this.selectedClasseId();
    let evals = this.evaluations();
    if (cid) {
      evals = evals.filter(e => e.classe_id === cid || e.classe?.id === cid);
    }

    const allNotes = this.notes();

    return evals.map(ev => {
      const entry = allNotes.find(n => (n.evaluationId === ev.id || n.evaluation_id === ev.id) && (n.catechumeneId === b.catechumeneId || n.catechumene_id === b.catechumeneId));
      const noteVal = entry?.note_obtenue ?? entry?.note ?? null;
      const noteSur20 = noteVal !== null && ev.bareme > 0 ? (Number(noteVal) / ev.bareme) * 20 : null;

      return {
        nom: ev.nom,
        type: ev.type,
        coeff: ev.coefficient,
        bareme: ev.bareme,
        note: noteVal !== null ? Number(noteVal) : null,
        noteSur20: noteSur20 !== null ? parseFloat(noteSur20.toFixed(2)) : null
      };
    });
  });

  // Totaux du bulletin
  public readonly bulletinTotals = computed(() => {
    const notes = this.bulletinNotes();
    let totalPondere = 0;
    let totalCoeff = 0;

    notes.forEach(n => {
      if (n.noteSur20 !== null) {
        totalPondere += n.noteSur20 * n.coeff;
        totalCoeff += n.coeff;
      }
    });

    return {
      totalPondere: parseFloat(totalPondere.toFixed(2)),
      totalCoeff
    };
  });

  // Rang du catéchumène dans la classe
  public readonly studentRang = computed(() => {
    const b = this.selectedBilan();
    if (!b) return '1er';

    const classBilans = [...this.filteredBilans()].sort((x, y) => y.moyenneGenerale - x.moyenneGenerale);
    const index = classBilans.findIndex(x => x.catechumeneId === b.catechumeneId);
    const rankNum = index >= 0 ? index + 1 : 1;
    return rankNum === 1 ? '1er' : `${rankNum}e`;
  });

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.classeService.getAll().subscribe(cls => {
      if (cls.length > 0 && !this.selectedClasseId()) {
        this.selectedClasseId.set(cls[0].id);
      }
    });
    this.inscriptionService.getAll().subscribe();
    this.seanceService.getAll().subscribe();
    this.service.evalService.getAll().subscribe();
  }

  public onSectionChange(sectionId: string): void {
    this.selectedSectionId.set(sectionId);
    this.selectedNiveauId.set('');
    const availableCls = this.filteredClasses();
    if (availableCls.length > 0) {
      this.selectedClasseId.set(availableCls[0].id);
    }
  }

  public onNiveauChange(niveauId: string): void {
    this.selectedNiveauId.set(niveauId);
    const availableCls = this.filteredClasses();
    if (availableCls.length > 0) {
      this.selectedClasseId.set(availableCls[0].id);
    }
  }

  public onClasseChange(classeId: string): void {
    this.selectedClasseId.set(classeId);
  }

  public openBulletin(bilan: BilanAnnuelItem): void {
    this.selectedBilan.set(bilan);
    this.isBulletinModalOpen.set(true);
  }

  public closeBulletin(): void {
    this.isBulletinModalOpen.set(false);
  }

  public printBulletin(): void {
    const bilan = this.selectedBilan();
    if (!bilan) return;

    const filters: any = {
      catechumene_id: bilan.catechumeneId,
      classe_id: this.selectedClasseId()
    };

    this.pdfService.previewBilanAnnuelPdf(filters, {
      title: `Bulletin Évaluation — ${bilan.nomPrenoms}`,
      subtitle: `Classe : ${bilan.classe || 'Catéchèse'}`,
      fileName: `bulletin-${bilan.matricule || 'eval'}.pdf`
    });
  }
}
