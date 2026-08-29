import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateSectionDto, Section, UpdateSectionDto } from '../../models/section.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-section-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './section-form-modal.component.html',
  styleUrl: './section-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly sectionToEdit = input<Section | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateSectionDto | UpdateSectionDto>();

  protected readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    description: new FormControl('', {
      nonNullable: true
    }),
    ordre: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),
    statut: new FormControl<string>('actif', {
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.sectionToEdit();
      const isEdit = this.isEditing();

      if (open) {
        if (isEdit && item) {
          const currentStatut = String(item.statut || '').trim().toLowerCase();
          const statutVal = (currentStatut === 'inactif' || currentStatut === 'inactive' || currentStatut === '0' || currentStatut === 'false') ? 'inactif' : 'actif';

          this.form.patchValue({
            nom: item.nom || '',
            code: item.code || '',
            description: item.description || '',
            ordre: item.ordre ?? 1,
            statut: statutVal
          });
        } else {
          this.form.reset({
            nom: '',
            code: '',
            description: '',
            ordre: 1,
            statut: 'actif'
          });
        }
      }
    });
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      this.formSubmitted.emit({
        nom: val.nom.trim(),
        code: val.code.trim().toUpperCase(),
        description: val.description ? val.description.trim() : '',
        ordre: Number(val.ordre) || 1,
        statut: val.statut || 'actif'
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}

