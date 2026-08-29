import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { EvaluationService } from '../services/evaluation.service';
import { ModuleTrimestrielService } from '../../../Organisations/Modules-treimestriels/services/module-trimestriel.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import {
  EvaluationDto,
  EvaluationItem,
  EvaluationStatus,
  EvaluationType,
  CreateEvaluationDto,
  UpdateEvaluationDto
} from '../models/evaluation.model';

@Component({
  selector: 'app-evaluation-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './evaluation-page.component.html',
  styleUrl: './evaluation-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluationPageComponent implements OnInit {
  public readonly service = inject(EvaluationService);
  public readonly moduleTrimestrielService = inject(ModuleTrimestrielService);
  public readonly classeService = inject(ClasseService);
  public readonly anneeService = inject(AnneeCatecheseService);

  public readonly searchQuery = signal('');
  public readonly filterType = signal<string>('tous');
  public readonly filterStatut = signal<string>('tous');
  public readonly filterClasse = signal<string>('toutes');
  public readonly filterPeriode = signal<string>('toutes');

  public readonly typesList: EvaluationType[] = [
    'Interrogation',
    'Devoir',
    'Composition',
    'Examen',
    'Oral'
  ];

  // Dynamic modules trimestriels & classes from backend
  public readonly modules = this.moduleTrimestrielService.modules;
  public readonly classes = this.classeService.classes;
  public readonly activeAnnee = this.anneeService.activeAnnee;
  public readonly isLoading = this.service.isLoading;

  // Modals
  public readonly isModalOpen = signal(false);
  public readonly isEditMode = signal(false);
  public readonly selectedEval = signal<EvaluationItem | null>(null);
  public readonly isDeleteModalOpen = signal(false);

  public readonly evalForm = new FormGroup({
    nom: new FormControl('', [Validators.required, Validators.minLength(3)]),
    type: new FormControl<EvaluationType>('Devoir', [Validators.required]),
    module_trimestriel_id: new FormControl('', [Validators.required]),
    periode: new FormControl('', [Validators.required]),
    date: new FormControl(new Date().toISOString().split('T')[0], [Validators.required]),
    classe_id: new FormControl('', [Validators.required]),
    coefficient: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(10)]),
    bareme: new FormControl(20, [Validators.required, Validators.min(1), Validators.max(100)]),
    anneePastorale: new FormControl('2025-2026', [Validators.required]),
    statut: new FormControl<EvaluationStatus>('Actif', [Validators.required]),
    observation: new FormControl('')
  });

  public ngOnInit(): void {
    this.service.getAll().subscribe();
    this.moduleTrimestrielService.getAll().subscribe();
    this.classeService.getAll().subscribe();
  }

  public readonly filteredEvaluations = computed(() => {
    let list = this.service.evaluations();
    const q = this.searchQuery().toLowerCase().trim();
    const t = this.filterType();
    const s = this.filterStatut();
    const c = this.filterClasse();
    const p = this.filterPeriode();

    if (q) {
      list = list.filter(e =>
        (e.nom || '').toLowerCase().includes(q) ||
        (e.classe?.nom && e.classe.nom.toLowerCase().includes(q)) ||
        (e.observation && e.observation.toLowerCase().includes(q))
      );
    }

    if (t !== 'tous') {
      list = list.filter(e => String(e.type || '').toLowerCase() === t.toLowerCase());
    }

    if (s !== 'tous') {
      list = list.filter(e => String(e.statut || '').toLowerCase() === s.toLowerCase());
    }

    if (c !== 'toutes') {
      list = list.filter(e => e.classe_id === c || e.classe?.id === c);
    }

    if (p !== 'toutes') {
      list = list.filter(e => {
        const perLib = typeof e.periode === 'string' ? e.periode : e.periode?.libelle;
        return perLib === p || e.module_trimestriel?.libelle === p || e.module_trimestriel_id === p;
      });
    }

    return list;
  });

  public getClasseName(classeId?: string, classeObj?: any): string {
    if (classeObj?.nom) return classeObj.nom;
    if (!classeId) return 'Toutes classes';
    const found = this.classes().find(c => c.id === classeId);
    return found ? found.nom : 'Classe';
  }

  public getTrimestreLibelle(ev: EvaluationDto): string {
    if (ev.module_trimestriel?.libelle) return ev.module_trimestriel.libelle;
    if (typeof ev.periode === 'object' && ev.periode?.libelle) return ev.periode.libelle;
    if (typeof ev.periode === 'string' && ev.periode) return ev.periode;
    if (ev.module_trimestriel_id) {
      const match = this.modules().find(m => m.id === ev.module_trimestriel_id);
      if (match) return match.libelle;
    }
    return 'Trimestre';
  }

  public onTrimestreSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const moduleId = select.value;
    const found = this.modules().find(m => m.id === moduleId);
    if (found) {
      this.evalForm.controls.periode.setValue(found.libelle);
      this.evalForm.controls.module_trimestriel_id.setValue(found.id);
    }
  }

  public openCreateModal(): void {
    this.isEditMode.set(false);
    this.selectedEval.set(null);
    const active = this.activeAnnee();
    const defaultAnnee = active ? active.libelle : '2025-2026';
    const defaultClasse = this.classes().length > 0 ? this.classes()[0].id : '';
    const defaultModule = this.modules().length > 0 ? this.modules()[0] : null;

    this.evalForm.reset({
      nom: '',
      type: 'Devoir',
      module_trimestriel_id: defaultModule?.id || '',
      periode: defaultModule?.libelle || '',
      date: new Date().toISOString().split('T')[0],
      classe_id: defaultClasse,
      coefficient: 1,
      bareme: 20,
      anneePastorale: defaultAnnee,
      statut: 'Actif',
      observation: ''
    });
    this.isModalOpen.set(true);
  }

  public openEditModal(ev: EvaluationItem): void {
    this.isEditMode.set(true);
    this.selectedEval.set(ev);

    let moduleId = ev.module_trimestriel_id || ev.module_trimestriel?.id || '';
    const periodeLibelle = typeof ev.periode === 'string' ? ev.periode : ev.periode?.libelle || '';

    if (!moduleId && periodeLibelle) {
      const match = this.modules().find(m => m.libelle === periodeLibelle);
      if (match) moduleId = match.id;
    }

    const active = this.activeAnnee();
    const defaultAnnee = active ? active.libelle : (ev.anneePastorale || '2025-2026');

    this.evalForm.patchValue({
      nom: ev.nom,
      type: (ev.type as EvaluationType) || 'Devoir',
      module_trimestriel_id: moduleId,
      periode: periodeLibelle,
      date: ev.date ? ev.date.substring(0, 10) : new Date().toISOString().split('T')[0],
      classe_id: ev.classe_id || ev.classe?.id || '',
      coefficient: ev.coefficient || 1,
      bareme: ev.bareme || 20,
      anneePastorale: defaultAnnee,
      statut: (ev.statut as EvaluationStatus) || 'Actif',
      observation: ev.observation || ''
    });
    this.isModalOpen.set(true);
  }

  public closeModal(): void {
    this.isModalOpen.set(false);
  }

  public submitForm(): void {
    if (this.evalForm.invalid) {
      this.evalForm.markAllAsTouched();
      return;
    }

    const val = this.evalForm.getRawValue();
    const activeAnneeObj = this.activeAnnee();
    const anneePastoraleStr = activeAnneeObj ? activeAnneeObj.libelle : (val.anneePastorale || '2025-2026');

    let periodeName = val.periode;
    if (val.module_trimestriel_id) {
      const found = this.modules().find(m => m.id === val.module_trimestriel_id);
      if (found) periodeName = found.libelle;
    }

    if (this.isEditMode() && this.selectedEval()) {
      const dto: UpdateEvaluationDto = {
        nom: val.nom!,
        type: val.type!,
        module_trimestriel_id: val.module_trimestriel_id || undefined,
        periode: periodeName!,
        date: val.date!,
        date_evaluation: val.date!,
        classe_id: val.classe_id || undefined,
        coefficient: Number(val.coefficient),
        bareme: Number(val.bareme),
        anneePastorale: anneePastoraleStr,
        annee_catechese_id: activeAnneeObj?.id || undefined,
        statut: val.statut!,
        observation: val.observation || undefined
      };
      this.service.update(this.selectedEval()!.id, dto).subscribe(() => {
        this.closeModal();
      });
    } else {
      const dto: CreateEvaluationDto = {
        nom: val.nom!,
        type: val.type!,
        module_trimestriel_id: val.module_trimestriel_id || undefined,
        periode: periodeName!,
        date: val.date!,
        date_evaluation: val.date!,
        classe_id: val.classe_id || undefined,
        coefficient: Number(val.coefficient),
        bareme: Number(val.bareme),
        anneePastorale: anneePastoraleStr,
        annee_catechese_id: activeAnneeObj?.id || undefined,
        statut: val.statut!,
        observation: val.observation || undefined
      };
      this.service.create(dto).subscribe(() => {
        this.closeModal();
      });
    }
  }

  public toggleStatut(ev: EvaluationItem): void {
    this.service.toggleEvaluationStatut(ev.id).subscribe();
  }

  public openDeleteModal(ev: EvaluationItem): void {
    this.selectedEval.set(ev);
    this.isDeleteModalOpen.set(true);
  }

  public confirmDelete(): void {
    const target = this.selectedEval();
    if (target) {
      this.service.deleteEvaluation(target.id).subscribe(() => {
        this.isDeleteModalOpen.set(false);
      });
    }
  }
}
