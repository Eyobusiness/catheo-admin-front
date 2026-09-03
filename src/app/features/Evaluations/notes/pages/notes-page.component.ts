import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../services/notes.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { CatechumeneService } from '../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { RecapNoteRow } from '../models/notes.model';
import { EvaluationDto } from '../../evaluation/models/evaluation.model';
import { ToastService } from '../../../../core/services/toast.service';
import { EnteteCatecheseComponent } from '../../../../shared/ui/components/entete-catechese/entete-catechese.component';
import { PdfService } from '../../../../core/services/pdf.service';

interface NoteDraftItem {
  catechumeneId: string;
  matricule: string;
  nomPrenoms: string;
  genre: string;
  note: number | null;
  appreciation?: string;
}

@Component({
  selector: 'app-notes-page',
  imports: [CommonModule, FormsModule, EnteteCatecheseComponent],
  templateUrl: './notes-page.component.html',
  styleUrl: './notes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesPageComponent implements OnInit {
  public readonly service = inject(NotesService);
  public readonly sectionService = inject(SectionService);
  public readonly niveauService = inject(NiveauService);
  public readonly catechumeneService = inject(CatechumeneService);
  private readonly toastService = inject(ToastService);
  private readonly pdfService = inject(PdfService);

  // Services data signals
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.service.classeService.classes;
  public readonly evaluations = this.service.evalService.evaluations;
  public readonly inscriptions = this.service.inscriptionService.inscriptions;
  public readonly catechumenes = this.catechumeneService.catechumenes;
  public readonly isSaving = this.service.isSaving;

  // Selected filters
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly selectedEvaluationId = signal<string>('');
  public readonly searchQuery = signal<string>('');

  // Draft notes for current selection
  public readonly notesDraft = signal<NoteDraftItem[]>([]);

  // Modals & UI
  public readonly isPrintModalOpen = signal(false);

  // Cascading filtered lists
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

  // Filtered evaluations for selected class
  public readonly availableEvaluations = computed<EvaluationDto[]>(() => {
    const evs = this.evaluations();
    const cid = this.selectedClasseId();
    if (!cid) return evs;
    const filtered = evs.filter(e => e.classe_id === cid || e.classe?.id === cid);
    return filtered.length > 0 ? filtered : evs;
  });

  // Current active evaluation object
  public readonly currentEvaluation = computed<EvaluationDto | undefined>(() => {
    const id = this.selectedEvaluationId();
    return this.evaluations().find(e => e.id === id);
  });

  // Current selected class name
  public readonly selectedClasseName = computed<string>(() => {
    const cid = this.selectedClasseId();
    if (!cid) return '';
    const cls = this.classes().find(c => c.id === cid);
    return cls ? cls.nom : '';
  });

  // KPI Calculations
  public readonly classeMoyenne = computed(() => {
    const validNotes = this.notesDraft().filter(n => n.note !== null && !isNaN(n.note!)).map(n => Number(n.note!));
    if (validNotes.length === 0) return 0;
    const sum = validNotes.reduce((a, b) => a + b, 0);
    return parseFloat((sum / validNotes.length).toFixed(2));
  });

  public readonly highestNote = computed(() => {
    const validNotes = this.notesDraft().filter(n => n.note !== null && !isNaN(n.note!)).map(n => Number(n.note!));
    if (validNotes.length === 0) return 0;
    return Math.max(...validNotes);
  });

  public readonly lowestNote = computed(() => {
    const validNotes = this.notesDraft().filter(n => n.note !== null && !isNaN(n.note!)).map(n => Number(n.note!));
    if (validNotes.length === 0) return 0;
    return Math.min(...validNotes);
  });

  public readonly enteredCount = computed(() => {
    return this.notesDraft().filter(n => n.note !== null && !isNaN(n.note!)).length;
  });

  public readonly totalElevesCount = computed(() => {
    return this.notesDraft().length;
  });

  // Filtered draft by search query
  public readonly filteredDraft = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.notesDraft();
    if (!q) return list;
    return list.filter(st =>
      st.nomPrenoms.toLowerCase().includes(q) ||
      st.matricule.toLowerCase().includes(q)
    );
  });

  // Recap table for official record / PV
  public readonly recapNotesTable = computed<RecapNoteRow[]>(() => {
    const items = this.notesDraft();
    const bareme = this.currentEvaluation()?.bareme || 20;
    const coeff = this.currentEvaluation()?.coefficient || 1;

    // Rank calculation
    const sorted = [...items].sort((a, b) => (b.note ?? -1) - (a.note ?? -1));

    return items.map((st, idx) => {
      const noteVal = st.note;
      const total = noteVal !== null ? Number((noteVal * coeff).toFixed(2)) : null;
      const moyenne = noteVal !== null ? Number(noteVal.toFixed(2)) : null;

      const rankIndex = sorted.findIndex(s => s.catechumeneId === st.catechumeneId);
      const rang = noteVal !== null ? `${rankIndex + 1}e` : '-';

      let app = st.appreciation || '';
      if (!app && noteVal !== null) {
        const ratio = (noteVal / bareme) * 20;
        if (ratio >= 16) app = 'Très Bien';
        else if (ratio >= 14) app = 'Bien';
        else if (ratio >= 12) app = 'Assez Bien';
        else if (ratio >= 10) app = 'Passable';
        else app = 'Insuffisant';
      }

      return {
        index: idx + 1,
        catechumeneId: st.catechumeneId,
        nomPrenoms: st.nomPrenoms,
        genre: st.genre || 'M',
        n1: noteVal,
        n2: null,
        total,
        coeff,
        moyenne,
        rang,
        appreciation: app
      };
    });
  });

  constructor() {
    // Synchronize draft list when classe or evaluation changes
    effect(() => {
      const cid = this.selectedClasseId();
      const allInscriptions = this.inscriptions();
      const allCats = this.catechumenes();
      const currentEval = this.currentEvaluation();

      // Find inscriptions belonging to the selected class
      let classInscriptions = allInscriptions;
      if (cid) {
        classInscriptions = allInscriptions.filter(i => i.classe_id === cid || i.classe?.id === cid);
      }

      const existingNotes: any[] = currentEval?.notes || [];

      const draft: NoteDraftItem[] = classInscriptions.map(ins => {
        const catId = ins.catechumene_id || ins.catechumene?.id || ins.id;
        const cat = ins.catechumene || allCats.find(c => c.id === catId);

        const nom = cat?.nom || '';
        const prenoms = cat?.prenoms || '';
        const fullName = `${nom} ${prenoms}`.trim() || `Catéchumène #${catId.substring(0, 6)}`;
        const matricule = cat?.matricule || cat?.code_catechumene || ins.code_inscription || '';
        const genre = cat?.sexe || 'M';

        // Check if a note already exists for this student
        const foundNote = existingNotes.find(n =>
          (n.catechumene_id && (n.catechumene_id === catId || n.catechumene_id === ins.id)) ||
          (n.catechumeneId && (n.catechumeneId === catId || n.catechumeneId === ins.id))
        );

        const noteVal = foundNote ? (foundNote.note_obtenue ?? foundNote.note ?? null) : null;
        const appreciationVal = foundNote?.appreciation || '';

        return {
          catechumeneId: catId,
          matricule,
          nomPrenoms: fullName,
          genre,
          note: noteVal !== null ? Number(noteVal) : null,
          appreciation: appreciationVal
        };
      });

      this.notesDraft.set(draft);
    }, { allowSignalWrites: true });
  }

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.service.classeService.getAll().subscribe(cls => {
      if (cls.length > 0 && !this.selectedClasseId()) {
        this.selectedClasseId.set(cls[0].id);
      }
    });
    this.service.evalService.getAll().subscribe(evals => {
      if (evals.length > 0 && !this.selectedEvaluationId()) {
        this.selectedEvaluationId.set(evals[0].id);
      }
    });
    this.service.inscriptionService.getAll().subscribe();
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
    const available = this.availableEvaluations();
    if (available.length > 0) {
      this.selectedEvaluationId.set(available[0].id);
    }
  }

  public onEvaluationChange(evalId: string): void {
    this.selectedEvaluationId.set(evalId);
    const found = this.evaluations().find(e => e.id === evalId);
    if (found?.classe_id && found.classe_id !== this.selectedClasseId()) {
      this.selectedClasseId.set(found.classe_id);
    }
  }

  public onNoteInput(catechumeneId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value !== '' ? parseFloat(input.value) : null;
    const bareme = this.currentEvaluation()?.bareme || 20;

    let finalVal = val;
    if (val !== null) {
      if (val < 0) finalVal = 0;
      if (val > bareme) finalVal = bareme;
    }

    this.notesDraft.update(list =>
      list.map(item => {
        if (item.catechumeneId === catechumeneId) {
          let app = item.appreciation || '';
          if (finalVal !== null) {
            const ratio = (finalVal / bareme) * 20;
            if (ratio >= 16) app = 'Très Bien';
            else if (ratio >= 14) app = 'Bien';
            else if (ratio >= 12) app = 'Assez Bien';
            else if (ratio >= 10) app = 'Passable';
            else app = 'Insuffisant';
          }
          return { ...item, note: finalVal, appreciation: app };
        }
        return item;
      })
    );
  }

  public onAppreciationInput(catechumeneId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    this.notesDraft.update(list =>
      list.map(item => item.catechumeneId === catechumeneId ? { ...item, appreciation: val } : item)
    );
  }

  public getAppreciation(note: number | null, bareme = 20): string {
    if (note === null || isNaN(note)) return '-';
    const ratio = (note / bareme) * 20;
    if (ratio >= 16) return 'Très Bien';
    if (ratio >= 14) return 'Bien';
    if (ratio >= 12) return 'Assez Bien';
    if (ratio >= 10) return 'Passable';
    return 'Insuffisant';
  }

  public submitNotes(): void {
    const evalId = this.selectedEvaluationId();
    if (!evalId) {
      this.toastService.warning('Attention', 'Veuillez sélectionner une évaluation avant d\'enregistrer.');
      return;
    }

    const draft = this.notesDraft();
    const payload = draft.map(item => ({
      catechumene_id: item.catechumeneId,
      catechumeneId: item.catechumeneId,
      note_obtenue: item.note,
      note: item.note,
      appreciation: item.appreciation || this.getAppreciation(item.note, this.currentEvaluation()?.bareme || 20)
    }));

    this.service.saveNotes(evalId, payload).subscribe();
  }

  public openPrintModal(): void {
    this.isPrintModalOpen.set(true);
  }

  public closePrintModal(): void {
    this.isPrintModalOpen.set(false);
  }

  public printDocument(): void {
    const ev = this.currentEvaluation();
    const classeId = this.selectedClasseId();
    const classeNom = this.selectedClasseName();

    const filters: any = {
      evaluation_id: ev?.id,
      classe_id: classeId
    };

    this.pdfService.previewFicheNotesPdf(filters, {
      title: 'Récapitulatif des Notes',
      subtitle: `${ev?.titre || 'Évaluation'} — ${classeNom || 'Classe'}`,
      fileName: `recap-notes-${ev?.titre || 'eval'}.pdf`
    });
    this.closePrintModal();
  }
}
