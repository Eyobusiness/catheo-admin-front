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
import { EvaluationService } from '../services/evaluation.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { ModuleTrimestrielService } from '../../../Organisations/Modules-treimestriels/services/module-trimestriel.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  EvaluationDto,
  EvaluationFilters,
  EvaluationType
} from '../models/evaluation.model';
import { EvaluationFormModalComponent } from '../components/evaluation-form-modal/evaluation-form-modal.component';
import { EvaluationNotesGridModalComponent } from '../components/evaluation-notes-grid-modal/evaluation-notes-grid-modal.component';
import { EvaluationDetailModalComponent } from '../components/evaluation-detail-modal/evaluation-detail-modal.component';
import { ClasseMoyennesViewComponent } from '../components/classe-moyennes-view/classe-moyennes-view.component';
import { CatechumeneSyntheseModalComponent } from '../components/catechumene-synthese-modal/catechumene-synthese-modal.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-evaluation-page',
  imports: [
    CommonModule,
    FormsModule,
    EvaluationFormModalComponent,
    EvaluationNotesGridModalComponent,
    EvaluationDetailModalComponent,
    ClasseMoyennesViewComponent,
    CatechumeneSyntheseModalComponent,
    HasPermissionDirective
  ],
  templateUrl: './evaluation-page.component.html',
  styleUrl: './evaluation-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluationPageComponent implements OnInit {
  public readonly service = inject(EvaluationService);
  public readonly sectionService = inject(SectionService);
  public readonly niveauService = inject(NiveauService);
  public readonly classeService = inject(ClasseService);
  public readonly moduleTrimestrielService = inject(ModuleTrimestrielService);
  public readonly anneeService = inject(AnneeCatecheseService);
  public readonly authService = inject(AuthService);

  // Vue active : 'evaluations' ou 'moyennes'
  public readonly activeTab = signal<'evaluations' | 'moyennes'>('evaluations');

  // Filtres principaux en cascade : Session -> Niveau -> Classe
  public readonly selectedSectionId = signal<string>(''); // Représente la Session (Enfants, Jeunes, Adultes)
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');

  // Filtres secondaires
  public readonly searchQuery = signal<string>('');
  public readonly filterType = signal<string>('tous');
  public readonly filterStatut = signal<string>('tous');
  public readonly filterPeriode = signal<string>('toutes');

  // Données des référentiels
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.classeService.classes;
  public readonly modules = this.moduleTrimestrielService.modules;
  public readonly activeAnnee = this.anneeService.activeAnnee;
  public readonly currentUser = this.authService.currentUser;
  public readonly isLoading = this.service.isLoading;

  // Modals
  public readonly isFormModalOpen = signal<boolean>(false);
  public readonly selectedForEdit = signal<EvaluationDto | null>(null);

  public readonly isNotesGridOpen = signal<boolean>(false);
  public readonly selectedForNotes = signal<EvaluationDto | null>(null);

  public readonly isDetailModalOpen = signal<boolean>(false);
  public readonly selectedForDetail = signal<EvaluationDto | null>(null);

  public readonly isSyntheseModalOpen = signal<boolean>(false);
  public readonly selectedCatechumeneId = signal<string>('');

  public readonly isDeleteModalOpen = signal<boolean>(false);
  public readonly selectedForDelete = signal<EvaluationDto | null>(null);

  public readonly typesList: EvaluationType[] = [
    'Devoir',
    'Interrogation',
    'Composition',
    'Examen',
    'Oral'
  ];

  // Est-ce un animateur ?
  public readonly isAnimateur = computed(() => {
    const u = this.currentUser();
    if (!u) return false;
    const roleStr = String(u.role || u.role_nom || u.profil?.nom || u.profil?.code || '').toLowerCase();
    return roleStr.includes('animateur') || roleStr.includes('enseignant');
  });

  // Niveaux filtrés par la Session sélectionnée
  public readonly availableNiveaux = computed(() => {
    const secId = this.selectedSectionId();
    const all = this.niveaux();
    if (!secId) return all;
    return all.filter(n => n.section_id === secId || n.section?.id === secId);
  });

  // Classes filtrées par la Session et le Niveau sélectionnés
  public readonly availableClasses = computed(() => {
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

  // Nom de la classe actuellement sélectionnée
  public readonly selectedClasseName = computed(() => {
    const cid = this.selectedClasseId();
    if (!cid) return 'Toutes les classes';
    const found = this.classes().find(c => c.id === cid);
    return found ? found.nom : 'Classe sélectionnée';
  });

  // Liste filtrée localement selon recherche et filtres de tableau
  public readonly filteredEvaluations = computed(() => {
    let list = this.service.evaluations();
    const q = this.searchQuery().toLowerCase().trim();
    const t = this.filterType();
    const s = this.filterStatut();
    const p = this.filterPeriode();

    if (q) {
      list = list.filter(e =>
        (e.nom || '').toLowerCase().includes(q) ||
        (e.titre || '').toLowerCase().includes(q) ||
        (e.classe?.nom && e.classe.nom.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    if (t !== 'tous') {
      list = list.filter(e => String(e.type_eval || e.type || '').toLowerCase() === t.toLowerCase());
    }

    if (s !== 'tous') {
      list = list.filter(e => String(e.statut || e.statut_code || '').toLowerCase() === s.toLowerCase());
    }

    if (p !== 'toutes') {
      list = list.filter(e => {
        const perLib = typeof e.periode === 'string' ? e.periode : e.periode?.libelle;
        return perLib === p || e.module_trimestriel?.libelle === p || e.module_trimestriel_id === p;
      });
    }

    return list;
  });

  constructor() {
    // Si l'animateur n'a qu'une seule classe, la pré-sélectionner
    effect(() => {
      const cls = this.classes();
      if (this.isAnimateur() && cls.length === 1 && !this.selectedClasseId()) {
        const single = cls[0];
        this.selectedClasseId.set(single.id);
        if (single.niveau_id) this.selectedNiveauId.set(single.niveau_id);
        if (single.niveau?.section_id) this.selectedSectionId.set(single.niveau.section_id);
      }
    });
  }

  public ngOnInit(): void {
    // 1. Charger les référentiels
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.moduleTrimestrielService.getAll().subscribe();

    // 2. Charger les évaluations
    this.loadEvaluations();
  }

  /**
   * Charge les évaluations avec les paramètres stricts attendus par Laravel :
   * section_id, niveau_id, classe_id, annee_catechese_id
   */
  public loadEvaluations(): void {
    const filters: EvaluationFilters = {};

    const secId = this.selectedSectionId();
    const nivId = this.selectedNiveauId();
    const clsId = this.selectedClasseId();
    const active = this.activeAnnee();

    if (secId) filters.section_id = secId;
    if (nivId) filters.niveau_id = nivId;
    if (clsId) filters.classe_id = clsId;
    if (active?.id) filters.annee_catechese_id = active.id;

    this.service.getAll(filters).subscribe();
  }

  // --- Gestion du workflow de filtres en cascade ---

  public onSectionChange(sectionId: string): void {
    this.selectedSectionId.set(sectionId);
    // Réinitialise les niveaux et classes inférieurs
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');
    this.loadEvaluations();
  }

  public onNiveauChange(niveauId: string): void {
    this.selectedNiveauId.set(niveauId);
    // Réinitialise la classe
    this.selectedClasseId.set('');
    this.loadEvaluations();
  }

  public onClasseChange(classeId: string): void {
    this.selectedClasseId.set(classeId);
    this.loadEvaluations();
  }

  public resetAllFilters(): void {
    this.selectedSectionId.set('');
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');
    this.searchQuery.set('');
    this.filterType.set('tous');
    this.filterStatut.set('tous');
    this.filterPeriode.set('toutes');
    this.loadEvaluations();
  }

  // --- Gestion des Modals ---

  public openCreateModal(): void {
    this.selectedForEdit.set(null);
    this.isFormModalOpen.set(true);
  }

  public openEditModal(ev: EvaluationDto): void {
    this.selectedForEdit.set(ev);
    this.isFormModalOpen.set(true);
  }

  public closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedForEdit.set(null);
  }

  /**
   * Après création / modification réussie :
   * Si c'est une création, ouvrir IMMÉDIATEMENT la grille de saisie des notes !
   */
  public onEvaluationSaved(ev: EvaluationDto): void {
    const wasEdit = !!this.selectedForEdit()?.id;
    this.closeFormModal();
    this.loadEvaluations();

    if (!wasEdit && ev?.id) {
      // Règle 9 : Saisie immédiate des notes
      this.openNotesGrid(ev);
    }
  }

  public openNotesGrid(ev: EvaluationDto): void {
    this.selectedForNotes.set(ev);
    this.isNotesGridOpen.set(true);
  }

  public closeNotesGrid(): void {
    this.isNotesGridOpen.set(false);
    this.selectedForNotes.set(null);
  }

  public onNotesSaved(): void {
    this.loadEvaluations();
  }

  public openDetailModal(ev: EvaluationDto): void {
    this.selectedForDetail.set(ev);
    this.isDetailModalOpen.set(true);
  }

  public closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedForDetail.set(null);
  }

  public onDetailGoToNotes(ev: EvaluationDto): void {
    this.closeDetailModal();
    this.openNotesGrid(ev);
  }

  public openSynthese(catechumeneId: string): void {
    this.selectedCatechumeneId.set(catechumeneId);
    this.isSyntheseModalOpen.set(true);
  }

  public closeSynthese(): void {
    this.isSyntheseModalOpen.set(false);
    this.selectedCatechumeneId.set('');
  }

  public toggleStatut(ev: EvaluationDto): void {
    this.service.toggleEvaluationStatut(ev.id).subscribe();
  }

  public openDeleteModal(ev: EvaluationDto): void {
    this.selectedForDelete.set(ev);
    this.isDeleteModalOpen.set(true);
  }

  public closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedForDelete.set(null);
  }

  public confirmDelete(): void {
    const target = this.selectedForDelete();
    if (target) {
      this.service.deleteEvaluation(target.id).subscribe({
        next: () => {
          this.closeDeleteModal();
        }
      });
    }
  }

  public getTrimestreLibelle(ev: EvaluationDto): string {
    if (ev.module_trimestriel?.libelle) return ev.module_trimestriel.libelle;
    if (typeof ev.periode === 'object' && ev.periode?.libelle) return ev.periode.libelle;
    if (typeof ev.periode === 'string' && ev.periode) return ev.periode;
    if (ev.module_trimestriel_id) {
      const match = this.modules().find(m => m.id === ev.module_trimestriel_id);
      if (match) return match.libelle;
    }
    return 'Période';
  }
}
