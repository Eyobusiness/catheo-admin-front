import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateMouvementDto, Mouvement, MouvementStatut, UpdateMouvementDto } from '../../models/mouvement.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-mouvement-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './mouvement-form-modal.component.html',
  styleUrl: './mouvement-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MouvementFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly mouvementToEdit = input<Mouvement | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateMouvementDto | UpdateMouvementDto>();

  protected readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    responsable: new FormControl('', {
      nonNullable: true
    }),
    telephone: new FormControl('', {
      nonNullable: true
    }),
    description: new FormControl('', {
      nonNullable: true
    }),
    statut: new FormControl<MouvementStatut>('Active', {
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      const item = this.mouvementToEdit();
      if (this.isEditing() && item) {
        this.form.setValue({
          nom: item.nom,
          responsable: item.responsable || '',
          telephone: item.telephone || '',
          description: item.description || '',
          statut: item.statut || 'Active'
        });
      } else {
        this.form.reset({
          nom: '',
          responsable: '',
          telephone: '',
          description: '',
          statut: 'Active'
        });
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
        nom: val.nom,
        responsable: val.responsable || undefined,
        telephone: val.telephone || undefined,
        description: val.description || undefined,
        statut: val.statut
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
