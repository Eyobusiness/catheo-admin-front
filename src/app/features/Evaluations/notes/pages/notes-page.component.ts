import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '../services/notes.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { ModuleTrimestrielService } from '../../../Organisations/Modules-treimestriels/services/module-trimestriel.service';
import { EvaluationService } from '../../evaluation/services/evaluation.service';
import {
  EvaluationDto,
  ClasseStatistiquesDto,
  CreateEvaluationDto,
  EvaluationType,
  ClasseMoyennesResponse,
  EleveMoyenneItemDto
} from '../../evaluation/models/evaluation.model';
import { RecapNoteRow } from '../models/notes.model';
import { ToastService } from '../../../../core/services/toast.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { PdfPreviewService } from '../../../../core/services/pdf-preview.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

interface NoteDraftItem {
  catechumeneId: string;
  matricule: string;
  nomPrenoms: string;
  genre: string;
  note: number | null;
  rawInput: string;
  isInvalid: boolean;
  appreciation?: string;
}

@Component({
  selector: 'app-notes-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-page.component.html',
  styleUrl: './notes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesPageComponent implements OnInit {
  public readonly service = inject(NotesService);
  public readonly evalService = inject(EvaluationService);
  public readonly sectionService = inject(SectionService);
  public readonly niveauService = inject(NiveauService);
  public readonly classeService = inject(ClasseService);
  public readonly moduleService = inject(ModuleTrimestrielService);
  public readonly anneeService = inject(AnneeCatecheseService);
  private readonly toastService = inject(ToastService);
  private readonly pdfService = inject(PdfService);
  private readonly pdfPreviewService = inject(PdfPreviewService);

  // Données des services
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.classeService.classes;
  public readonly modules = this.moduleService.modules;
  public readonly evaluations = this.evalService.evaluations;
  public readonly activeAnnee = this.anneeService.activeAnnee;
  public readonly isSaving = this.evalService.isSavingNotes;
  public readonly isLoadingGrid = signal<boolean>(false);

  // Vue des inputs de note pour la navigation clavier (Entrée / Flèche bas)
  public readonly noteInputs = viewChildren<ElementRef<HTMLInputElement>>('noteInput');

  // Filtres principaux de la page de notes
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly selectedEvaluationId = signal<string>('');
  public readonly searchQuery = signal<string>('');

  // Liste des notes en cours d'édition
  public readonly notesDraft = signal<NoteDraftItem[]>([]);

  // Statistiques backend de la classe
  public readonly classStats = signal<ClasseStatistiquesDto | null>(null);
  public readonly classMoyennesData = signal<ClasseMoyennesResponse | null>(null);
  public readonly isLoadingMoyennes = signal<boolean>(false);

  // Modals & UI
  public readonly isPrintModalOpen = signal(false);
  public readonly isCreateEvalModalOpen = signal(false);
  public readonly isCreatingEval = signal(false);

  // Champs du formulaire "Ajouter une évaluation" dans la modal
  public readonly evalFormSectionId = signal<string>('');
  public readonly evalFormNiveauId = signal<string>('');
  public readonly evalFormClasseId = signal<string>('');
  public readonly evalFormTitre = signal<string>('');
  public readonly evalFormType = signal<EvaluationType>('Devoir');
  public readonly evalFormDate = signal<string>(new Date().toISOString().substring(0, 10));
  public readonly evalFormCoeff = signal<number>(1);
  public readonly evalFormBareme = signal<number>(20);
  public readonly evalFormPeriode = signal<string>('Trimestre 1');
  public readonly evalFormModuleId = signal<string>('');
  public readonly evalFormDescription = signal<string>('');

  public readonly typesList: EvaluationType[] = [
    'Devoir',
    'Interrogation',
    'Composition',
    'Examen',
    'Oral'
  ];

  // Niveaux et Classes filtrés pour la page principale
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

  // Niveaux et Classes filtrés dans la Modal d'ajout d'évaluation
  public readonly modalFilteredNiveaux = computed(() => {
    const secId = this.evalFormSectionId();
    const all = this.niveaux();
    if (!secId) return all;
    return all.filter(n => n.section_id === secId || n.section?.id === secId);
  });

  public readonly modalFilteredClasses = computed(() => {
    const secId = this.evalFormSectionId();
    const nivId = this.evalFormNiveauId();
    let list = this.classes();
    if (secId) {
      list = list.filter(c => c.niveau?.section_id === secId || c.niveau?.section?.id === secId);
    }
    if (nivId) {
      list = list.filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
    }
    return list;
  });

  // Évaluations disponibles pour la classe sélectionnée (vide si aucune classe choisie)
  public readonly availableEvaluations = computed<EvaluationDto[]>(() => {
    const cid = this.selectedClasseId();
    if (!cid) return [];
    const evs = this.evaluations();
    return evs.filter(e => e.classe_id === cid || e.classe?.id === cid);
  });

  // Évaluation active
  public readonly currentEvaluation = computed<EvaluationDto | undefined>(() => {
    const cid = this.selectedClasseId();
    const id = this.selectedEvaluationId();
    if (!cid || !id) return undefined;
    return this.evaluations().find(e => e.id === id);
  });

  // Nom de la classe sélectionnée
  public readonly selectedClasseName = computed<string>(() => {
    const cid = this.selectedClasseId();
    if (!cid) return '';
    const cls = this.classes().find(c => c.id === cid);
    return cls ? cls.nom : '';
  });

  // Statistiques issues strictement du backend
  public readonly classeMoyenne = computed<string>(() => {
    if (!this.selectedClasseId()) return 'Non évalué';
    const evStats = this.currentEvaluation()?.stats;
    if (evStats?.moyenne_classe !== null && evStats?.moyenne_classe !== undefined) {
      return `${evStats.moyenne_classe}`;
    }
    const st = this.classStats();
    if (st?.moyenne_classe !== null && st?.moyenne_classe !== undefined) {
      return `${st.moyenne_classe}`;
    }
    return 'Non évalué';
  });

  public readonly highestNote = computed<string>(() => {
    if (!this.selectedClasseId()) return '—';
    const evStats = this.currentEvaluation()?.stats;
    if (evStats?.plus_forte_note !== null && evStats?.plus_forte_note !== undefined) {
      return `${evStats.plus_forte_note}`;
    }
    const st = this.classStats();
    if (st?.meilleure_moyenne !== null && st?.meilleure_moyenne !== undefined) {
      return `${st.meilleure_moyenne}`;
    }
    return '—';
  });

  public readonly lowestNote = computed<string>(() => {
    if (!this.selectedClasseId()) return '—';
    const evStats = this.currentEvaluation()?.stats;
    if (evStats?.plus_faible_note !== null && evStats?.plus_faible_note !== undefined) {
      return `${evStats.plus_faible_note}`;
    }
    const st = this.classStats();
    if (st?.plus_faible_moyenne !== null && st?.plus_faible_moyenne !== undefined) {
      return `${st.plus_faible_moyenne}`;
    }
    return '—';
  });

  public readonly enteredCount = computed(() => {
    return this.notesDraft().filter(n => n.note !== null).length;
  });

  public readonly totalElevesCount = computed(() => {
    return this.notesDraft().length;
  });

  public readonly filteredDraft = computed(() => {
    if (!this.selectedClasseId() || !this.selectedEvaluationId()) return [];
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.notesDraft();
    if (!q) return list;
    return list.filter(st =>
      st.nomPrenoms.toLowerCase().includes(q) ||
      st.matricule.toLowerCase().includes(q)
    );
  });

  public readonly recapNotesTable = computed<RecapNoteRow[]>(() => {
    const items = this.notesDraft();
    const coeff = this.currentEvaluation()?.coefficient || 1;

    return items.map((st, idx) => {
      const noteVal = st.note;
      const total = noteVal !== null ? Number((noteVal * coeff).toFixed(2)) : null;

      return {
        index: idx + 1,
        catechumeneId: st.catechumeneId,
        nomPrenoms: st.nomPrenoms,
        genre: st.genre || 'M',
        n1: noteVal,
        n2: null,
        total,
        coeff,
        moyenne: noteVal,
        rang: '-',
        appreciation: st.appreciation || ''
      };
    });
  });

  constructor() {
    // Dès qu'une classe et une évaluation sont sélectionnées, charger la grille de saisie
    effect(() => {
      const cid = this.selectedClasseId();
      const evalId = this.selectedEvaluationId();
      if (cid && evalId) {
        this.loadNotesForEvaluation(evalId);
      } else {
        this.notesDraft.set([]);
      }
    });

    // Dès qu'une classe est sélectionnée, mettre à jour les statistiques de la classe
    effect(() => {
      const cid = this.selectedClasseId();
      const active = this.activeAnnee();
      if (cid) {
        this.evalService.getClassAverages(cid, active?.id).subscribe({
          next: res => {
            this.classStats.set(res.statistiques);
          },
          error: () => {
            this.classStats.set(null);
          }
        });
      } else {
        this.classStats.set(null);
      }
    });
  }

  public ngOnInit(): void {
    // Charger les référentiels sans pré-sélection automatique de classe pour respecter le choix utilisateur
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.moduleService.getAll().subscribe();
    this.evalService.getAll().subscribe();
  }

  public loadNotesForEvaluation(evalId: string): void {
    this.isLoadingGrid.set(true);
    this.evalService.getNotesGrid(evalId).subscribe({
      next: res => {
        const items = res.data || [];
        const draft: NoteDraftItem[] = items.map(item => {
          const val = item.note_obtenue !== null && item.note_obtenue !== undefined
            ? Number(item.note_obtenue)
            : (item.note !== null && item.note !== undefined ? Number(item.note) : null);

          return {
            catechumeneId: item.catechumene_id,
            matricule: item.matricule || '—',
            nomPrenoms: item.nom_prenoms || 'Catéchumène',
            genre: 'M',
            note: val,
            rawInput: val !== null ? String(val) : '',
            isInvalid: false,
            appreciation: item.appreciation || ''
          };
        });

        this.notesDraft.set(draft);
        this.isLoadingGrid.set(false);
      },
      error: () => {
        this.isLoadingGrid.set(false);
      }
    });
  }

  public onSectionChange(sectionId: string): void {
    this.selectedSectionId.set(sectionId);
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');
    this.selectedEvaluationId.set('');
    this.notesDraft.set([]);
  }

  public onNiveauChange(niveauId: string): void {
    this.selectedNiveauId.set(niveauId);
    this.selectedClasseId.set('');
    this.selectedEvaluationId.set('');
    this.notesDraft.set([]);
  }

  public onClasseChange(classeId: string): void {
    this.selectedClasseId.set(classeId);
    this.selectedEvaluationId.set('');
    this.notesDraft.set([]);
  }

  public onEvaluationChange(evalId: string): void {
    this.selectedEvaluationId.set(evalId);
    const found = this.evaluations().find(e => e.id === evalId);
    if (found) {
      if (found.classe_id && found.classe_id !== this.selectedClasseId()) {
        this.selectedClasseId.set(found.classe_id);
      }
      if (found.niveau_id && found.niveau_id !== this.selectedNiveauId()) {
        this.selectedNiveauId.set(found.niveau_id);
      }
      if (found.section_id && found.section_id !== this.selectedSectionId()) {
        this.selectedSectionId.set(found.section_id);
      }
    }
  }

  // --- Modal "Ajouter une évaluation" ---

  public openCreateEvaluationModal(): void {
    // Pré-remplissage avec le contexte déjà sélectionné sur la page
    const curSec = this.selectedSectionId();
    const curNiv = this.selectedNiveauId();
    const curCls = this.selectedClasseId();

    const initialSec = curSec || (this.sections().length > 0 ? this.sections()[0].id : '');
    this.evalFormSectionId.set(initialSec);

    // Initialiser les niveaux pour cette section
    const matchingNivs = this.niveaux().filter(n => n.section_id === initialSec || n.section?.id === initialSec);
    const initialNiv = curNiv || (matchingNivs.length > 0 ? matchingNivs[0].id : '');
    this.evalFormNiveauId.set(initialNiv);

    // Initialiser les classes pour ce niveau
    const matchingCls = this.classes().filter(c => c.niveau_id === initialNiv || c.niveau?.id === initialNiv);
    const initialCls = curCls || (matchingCls.length > 0 ? matchingCls[0].id : '');
    this.evalFormClasseId.set(initialCls);

    this.evalFormTitre.set('');
    this.evalFormType.set('Devoir');
    this.evalFormDate.set(new Date().toISOString().substring(0, 10));
    this.evalFormCoeff.set(1);
    this.evalFormBareme.set(20);
    this.evalFormDescription.set('');

    const mods = this.modules();
    if (mods.length > 0) {
      this.evalFormModuleId.set(mods[0].id);
      this.evalFormPeriode.set(mods[0].libelle);
    }

    this.isCreateEvalModalOpen.set(true);
  }

  public closeCreateEvaluationModal(): void {
    this.isCreateEvalModalOpen.set(false);
  }

  public onModalSectionChange(secId: string): void {
    this.evalFormSectionId.set(secId);
    this.evalFormNiveauId.set('');
    this.evalFormClasseId.set('');
    const nivs = this.niveaux().filter(n => n.section_id === secId || n.section?.id === secId);
    if (nivs.length > 0) {
      this.evalFormNiveauId.set(nivs[0].id);
      const cls = this.classes().filter(c => c.niveau_id === nivs[0].id || c.niveau?.id === nivs[0].id);
      if (cls.length > 0) {
        this.evalFormClasseId.set(cls[0].id);
      }
    }
  }

  public onModalNiveauChange(nivId: string): void {
    this.evalFormNiveauId.set(nivId);
    this.evalFormClasseId.set('');
    const cls = this.classes().filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
    if (cls.length > 0) {
      this.evalFormClasseId.set(cls[0].id);
    }
  }

  public validateAndCreateEvaluation(): void {
    const titre = this.evalFormTitre().trim();
    const classeId = this.evalFormClasseId();

    if (!titre) {
      this.toastService.warning('Validation', 'Veuillez renseigner le titre de l\'évaluation.');
      return;
    }

    if (!classeId) {
      this.toastService.warning('Validation', 'Veuillez sélectionner une classe.');
      return;
    }

    this.isCreatingEval.set(true);
    const active = this.activeAnnee();

    const dto: CreateEvaluationDto = {
      titre,
      nom: titre,
      type_eval: this.evalFormType(),
      type: this.evalFormType(),
      classe_id: classeId,
      coefficient: Number(this.evalFormCoeff()) || 1,
      note_max: Number(this.evalFormBareme()) || 20,
      bareme: Number(this.evalFormBareme()) || 20,
      date_evaluation: this.evalFormDate(),
      date: this.evalFormDate(),
      module_trimestriel_id: this.evalFormModuleId() || undefined,
      periode: this.evalFormPeriode() || undefined,
      description: this.evalFormDescription() || undefined,
      annee_catechese_id: active?.id,
      statut: 'Actif'
    };

    this.evalService.create(dto).subscribe({
      next: created => {
        this.isCreatingEval.set(false);
        this.closeCreateEvaluationModal();

        // 1. Synchroniser les sélecteurs de contexte sur la classe et l'évaluation créée
        if (this.evalFormSectionId()) this.selectedSectionId.set(this.evalFormSectionId());
        if (this.evalFormNiveauId()) this.selectedNiveauId.set(this.evalFormNiveauId());
        this.selectedClasseId.set(created.classe_id || classeId);
        this.selectedEvaluationId.set(created.id);

        // 2. Bascule immédiate sur la saisie des notes pour les élèves de cette classe
        this.loadNotesForEvaluation(created.id);
        this.toastService.success(
          'Évaluation créée !',
          `Saisie des notes ouverte pour « ${created.titre || created.nom} »`
        );
      },
      error: err => {
        this.isCreatingEval.set(false);
        const msg = err?.error?.message || 'Erreur lors de la création de l\'évaluation.';
        this.toastService.error('Erreur', msg);
      }
    });
  }

  // --- Saisie, navigation et validation des notes ---

  public onNoteInput(catechumeneId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.trim();
    const bareme = Number(this.currentEvaluation()?.note_max || this.currentEvaluation()?.bareme || 20);

    this.notesDraft.update(list =>
      list.map(item => {
        if (item.catechumeneId === catechumeneId) {
          if (raw === '') {
            // Note vide = non évalué (null), jamais zéro !
            return { ...item, note: null, rawInput: '', isInvalid: false };
          }

          const parsed = Number(raw.replace(',', '.'));
          if (isNaN(parsed) || parsed < 0 || parsed > bareme) {
            return { ...item, note: null, rawInput: raw, isInvalid: true };
          }

          return { ...item, note: parsed, rawInput: raw, isInvalid: false };
        }
        return item;
      })
    );
  }

  public onNoteKeyDown(event: KeyboardEvent, index: number): void {
    const inputs = this.noteInputs();
    if (!inputs || inputs.length === 0) return;

    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = index + 1;
      if (next < inputs.length) {
        inputs[next].nativeElement.focus();
        inputs[next].nativeElement.select();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = index - 1;
      if (prev >= 0) {
        inputs[prev].nativeElement.focus();
        inputs[prev].nativeElement.select();
      }
    }
  }

  public onAppreciationInput(catechumeneId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    this.notesDraft.update(list =>
      list.map(item => item.catechumeneId === catechumeneId ? { ...item, appreciation: val } : item)
    );
  }

  public submitNotes(): void {
    const evalId = this.selectedEvaluationId();
    if (!evalId) {
      this.toastService.warning('Attention', 'Veuillez sélectionner une évaluation avant d\'enregistrer.');
      return;
    }

    const hasInvalid = this.notesDraft().some(n => n.isInvalid);
    if (hasInvalid) {
      this.toastService.warning('Validation', 'Certaines notes saisies sont invalides (dépassent le barème ou négatives).');
      return;
    }

    const draft = this.notesDraft();
    const payload = draft.map(item => ({
      catechumene_id: item.catechumeneId,
      note_obtenue: item.note, // null si non noté
      appreciation: item.appreciation ? item.appreciation.trim() : null
    }));

    this.evalService.saveNotes(evalId, { notes: payload }).subscribe({
      next: () => {
        // 1. Recharger les notes fraîches
        this.loadNotesForEvaluation(evalId);
        // 2. Recharger l'évaluation pour rafraîchir les statistiques
        this.evalService.getById(evalId).subscribe();
        // 3. Recharger les moyennes de classe
        const cid = this.selectedClasseId();
        const active = this.activeAnnee();
        if (cid) {
          this.evalService.getClassAverages(cid, active?.id).subscribe({
            next: res => this.classStats.set(res.statistiques)
          });
        }
      }
    });
  }

  public openPrintModal(): void {
    const cid = this.selectedClasseId();
    if (!cid) {
      this.toastService.warning('Attention', 'Veuillez sélectionner une classe pour afficher le relevé des notes.');
      return;
    }

    const classeNom = this.selectedClasseName();
    this.pdfPreviewService.startLoading('releve-notes', {
      title: 'Relevé Général des Notes & Moyennes',
      subtitle: classeNom ? `Classe : ${classeNom}` : '',
      formatBadge: 'A4 Portrait',
      fileName: `releve-notes-${classeNom || 'classe'}.pdf`,
      loadingMessage: 'Calcul des moyennes et préparation du relevé de notes...'
    });

    const active = this.activeAnnee();
    this.evalService.getClassAverages(cid, active?.id).subscribe({
      next: res => {
        this.classMoyennesData.set(res);
        this.pdfPreviewService.openDocument('releve-notes', res, {
          title: 'Relevé Général des Notes & Moyennes',
          subtitle: `Classe : ${res.classe?.nom || classeNom}`,
          formatBadge: 'A4 Portrait',
          fileName: `releve-notes-${res.classe?.nom || classeNom}.pdf`
        });
      },
      error: () => {
        this.toastService.error('Erreur', 'Impossible de charger le relevé des notes de la classe.');
        this.pdfPreviewService.close();
      }
    });
  }

  public closePrintModal(): void {
    this.pdfPreviewService.close();
  }
}
