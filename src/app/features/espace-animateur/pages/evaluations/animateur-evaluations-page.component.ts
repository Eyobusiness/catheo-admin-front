import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnimateurClasseService } from '../../services/animateur-classe.service';
import { EvaluationService } from '../../../Evaluations/evaluation/services/evaluation.service';
import { EvaluationDto, EvaluationType } from '../../../Evaluations/evaluation/models/evaluation.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-animateur-evaluations-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './animateur-evaluations-page.component.html',
  styleUrl: './animateur-evaluations-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurEvaluationsPageComponent implements OnInit {
  protected readonly classeService = inject(AnimateurClasseService);
  protected readonly evaluationService = inject(EvaluationService);
  protected readonly toastService = inject(ToastService);

  protected readonly isLoading = this.evaluationService.isLoading;
  protected readonly evaluations = this.evaluationService.evaluations;
  protected readonly classe = this.classeService.classe;
  protected readonly showCreateModal = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  protected readonly typesList: EvaluationType[] = ['Devoir', 'Interrogation', 'Composition', 'Examen', 'Oral'];

  // Formulaire rapide de création d'évaluation (pré-rempli avec la classe de l'animateur)
  protected readonly evalForm = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<EvaluationType>('Devoir', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl(new Date().toISOString().substring(0, 10), { nonNullable: true, validators: [Validators.required] }),
    coefficient: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    bareme: new FormControl<number>(20, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    description: new FormControl('')
  });

  public ngOnInit(): void {
    if (!this.classeService.classeData()) {
      this.classeService.getMaClasse().subscribe(() => {
        this.loadEvaluations();
      });
    } else {
      this.loadEvaluations();
    }
  }

  protected loadEvaluations(): void {
    const clsId = this.classe()?.id ? String(this.classe()!.id) : undefined;
    this.evaluationService.getAll({ classe_id: clsId }).subscribe();
  }

  protected openCreateModal(): void {
    this.evalForm.reset({
      nom: '',
      type: 'Devoir',
      date: new Date().toISOString().substring(0, 10),
      coefficient: 1,
      bareme: 20,
      description: ''
    });
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  protected submitCreate(): void {
    if (this.evalForm.invalid) {
      this.evalForm.markAllAsTouched();
      return;
    }

    const cls = this.classe();
    const raw = this.evalForm.getRawValue();

    this.isSubmitting.set(true);
    this.evaluationService.create({
      nom: raw.nom.trim(),
      titre: raw.nom.trim(),
      type: raw.type,
      date_evaluation: raw.date,
      coefficient: raw.coefficient,
      note_max: raw.bareme,
      classe_id: cls?.id ? String(cls.id) : undefined,
      description: raw.description || undefined
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.toastService.success('Évaluation créée', `L'évaluation "${raw.nom}" a été enregistrée avec succès.`);
        this.loadEvaluations();
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}
