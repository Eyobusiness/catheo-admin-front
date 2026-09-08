import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvaluationDto, CreateEvaluationDto, UpdateEvaluationDto, EvaluationType } from '../../models/evaluation.model';
import { EvaluationService } from '../../services/evaluation.service';
import { ClasseService } from '../../../../Organisations/Classe/services/classe.service';
import { ModuleTrimestrielService } from '../../../../Organisations/Modules-treimestriels/services/module-trimestriel.service';
import { AnneeCatecheseService } from '../../../../../core/services/annee-catechese.service';
import { SectionService } from '../../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../../Organisations/Niveaux/services/niveau.service';

@Component({
  selector: 'app-evaluation-form-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './evaluation-form-modal.component.html',
  styleUrl: './evaluation-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluationFormModalComponent implements OnInit {
  private readonly evaluationService = inject(EvaluationService);
  private readonly classeService = inject(ClasseService);
  private readonly moduleTrimestrielService = inject(ModuleTrimestrielService);
  private readonly anneeService = inject(AnneeCatecheseService);
  private readonly sectionService = inject(SectionService);
  private readonly niveauService = inject(NiveauService);

  public readonly evaluation = input<EvaluationDto | null>(null);

  public readonly close = output<void>();
  public readonly saved = output<EvaluationDto>();

  public readonly classes = this.classeService.classes;
  public readonly modules = this.moduleTrimestrielService.modules;
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly activeAnnee = this.anneeService.activeAnnee;
  public readonly isSubmitting = signal(false);

  // Filtres en cascade du modal : aucun élément sélectionné par défaut en mode création
  public readonly modalSectionId = signal<string>('');
  public readonly modalNiveauId = signal<string>('');

  public readonly modalAvailableNiveaux = computed(() => {
    const secId = this.modalSectionId();
    const all = this.niveaux();
    if (!secId) return all;
    return all.filter(n => String(n.section_id) === String(secId) || String(n.section?.id) === String(secId));
  });

  public readonly modalAvailableClasses = computed(() => {
    const secId = this.modalSectionId();
    const nivId = this.modalNiveauId();
    let list = this.classes();

    if (secId) {
      list = list.filter(c => String(c.niveau?.section_id) === String(secId) || String(c.niveau?.section?.id) === String(secId));
    }
    if (nivId) {
      list = list.filter(c => String(c.niveau_id) === String(nivId) || String(c.niveau?.id) === String(nivId));
    }
    return list;
  });

  public readonly typesList: EvaluationType[] = [
    'Devoir',
    'Interrogation',
    'Composition',
    'Examen',
    'Oral'
  ];

  public readonly isEditMode = computed(() => !!this.evaluation()?.id);

  public readonly evalForm = new FormGroup({
    titre: new FormControl('', [Validators.required, Validators.minLength(3)]),
    type_eval: new FormControl<string>('Devoir', [Validators.required]),
    module_trimestriel_id: new FormControl(''),
    date_evaluation: new FormControl(new Date().toISOString().substring(0, 10), [Validators.required]),
    classe_id: new FormControl('', [Validators.required]),
    coefficient: new FormControl(1, [Validators.required, Validators.min(1), Validators.max(20)]),
    note_max: new FormControl(20, [Validators.required, Validators.min(1), Validators.max(100)]),
    description: new FormControl(''),
    statut: new FormControl<'actif' | 'inactif'>('actif', [Validators.required])
  });

  constructor() {
    effect(() => {
      const ev = this.evaluation();

      if (ev) {
        // Mode modification : synchroniser la classe et ses niveaux/sections
        const clsId = ev.classe_id || ev.classe?.id || '';
        const cls = this.classes().find(c => c.id === clsId);
        const nivId = cls?.niveau_id || cls?.niveau?.id || '';
        const secId = cls?.niveau?.section_id || cls?.niveau?.section?.id || '';

        this.modalSectionId.set(secId);
        this.modalNiveauId.set(nivId);

        this.evalForm.patchValue({
          titre: ev.titre || ev.nom || '',
          type_eval: (ev.type_eval || ev.type || 'Devoir'),
          module_trimestriel_id: ev.module_trimestriel_id || '',
          date_evaluation: ev.date_evaluation || ev.date ? (ev.date_evaluation || ev.date).substring(0, 10) : new Date().toISOString().substring(0, 10),
          classe_id: clsId,
          coefficient: ev.coefficient || 1,
          note_max: ev.note_max || ev.bareme || 20,
          description: ev.description || ev.observation || '',
          statut: (ev.statut_code || (ev.statut === 'Actif' ? 'actif' : 'inactif')) as 'actif' | 'inactif'
        });
      } else {
        // Mode création : aucun choix par défaut (section, niveau et classe vides)
        this.modalSectionId.set('');
        this.modalNiveauId.set('');

        this.evalForm.patchValue({
          titre: '',
          type_eval: 'Devoir',
          module_trimestriel_id: '',
          date_evaluation: new Date().toISOString().substring(0, 10),
          classe_id: '',
          coefficient: 1,
          note_max: 20,
          description: '',
          statut: 'actif'
        });
      }
    });
  }

  public ngOnInit(): void {
    if (this.classes().length === 0) this.classeService.getAll().subscribe();
    if (this.modules().length === 0) this.moduleTrimestrielService.getAll().subscribe();
    if (this.sections().length === 0) this.sectionService.getAll().subscribe();
    if (this.niveaux().length === 0) this.niveauService.getAll().subscribe();
  }

  public onModalSectionChange(secId: string): void {
    this.modalSectionId.set(secId);
    // Si le niveau sélectionné ne correspond plus à la session choisie, réinitialiser niveau et classe
    const currentNiv = this.niveaux().find(n => n.id === this.modalNiveauId());
    if (currentNiv && secId && String(currentNiv.section_id) !== String(secId) && String(currentNiv.section?.id) !== String(secId)) {
      this.modalNiveauId.set('');
      this.evalForm.controls.classe_id.setValue('');
    }
  }

  public onModalNiveauChange(nivId: string): void {
    this.modalNiveauId.set(nivId);
    if (nivId) {
      const foundNiv = this.niveaux().find(n => n.id === nivId);
      const secId = foundNiv?.section_id || foundNiv?.section?.id;
      if (secId && !this.modalSectionId()) {
        this.modalSectionId.set(secId);
      }
    }
    // Si la classe sélectionnée ne correspond plus au niveau choisi, réinitialiser la classe
    const currentCls = this.classes().find(c => c.id === this.evalForm.controls.classe_id.value);
    if (currentCls && nivId && String(currentCls.niveau_id) !== String(nivId) && String(currentCls.niveau?.id) !== String(nivId)) {
      this.evalForm.controls.classe_id.setValue('');
    }
  }

  public getContextLabel(): string {
    const cid = this.evalForm.controls.classe_id.value;
    if (!cid) return '';
    const cls = this.classes().find(c => c.id === cid);
    if (!cls) return '';
    const nivName = cls.niveau?.nom || '';
    const secName = cls.niveau?.section?.nom || '';
    if (secName && nivName) return `${secName} › ${nivName} › ${cls.nom}`;
    return cls.nom;
  }

  public onCancel(): void {
    this.close.emit();
  }

  public onSubmit(): void {
    if (this.evalForm.invalid) {
      this.evalForm.markAllAsTouched();
      return;
    }

    const val = this.evalForm.getRawValue();
    const active = this.activeAnnee();
    this.isSubmitting.set(true);

    let selectedModuleLibelle: string | undefined;
    if (val.module_trimestriel_id) {
      const match = this.modules().find(m => m.id === val.module_trimestriel_id);
      if (match) selectedModuleLibelle = match.libelle;
    }

    if (this.isEditMode() && this.evaluation()) {
      const id = this.evaluation()!.id;
      const updateDto: UpdateEvaluationDto = {
        titre: val.titre!,
        nom: val.titre!,
        type_eval: val.type_eval!,
        type: val.type_eval!,
        module_trimestriel_id: val.module_trimestriel_id || undefined,
        periode: selectedModuleLibelle,
        date_evaluation: val.date_evaluation!,
        date: val.date_evaluation!,
        classe_id: val.classe_id!,
        coefficient: Number(val.coefficient),
        note_max: Number(val.note_max),
        bareme: Number(val.note_max),
        annee_catechese_id: active?.id,
        anneePastorale: active?.libelle,
        description: val.description || undefined,
        statut: val.statut!
      };

      this.evaluationService.update(id, updateDto).subscribe({
        next: updated => {
          this.isSubmitting.set(false);
          this.saved.emit(updated);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
    } else {
      const createDto: CreateEvaluationDto = {
        titre: val.titre!,
        nom: val.titre!,
        type_eval: val.type_eval!,
        type: val.type_eval!,
        module_trimestriel_id: val.module_trimestriel_id || undefined,
        periode: selectedModuleLibelle,
        date_evaluation: val.date_evaluation!,
        date: val.date_evaluation!,
        classe_id: val.classe_id!,
        coefficient: Number(val.coefficient),
        note_max: Number(val.note_max),
        bareme: Number(val.note_max),
        annee_catechese_id: active?.id,
        anneePastorale: active?.libelle,
        description: val.description || undefined,
        statut: val.statut!
      };

      this.evaluationService.create(createDto).subscribe({
        next: created => {
          this.isSubmitting.set(false);
          this.saved.emit(created);
        },
        error: () => {
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
