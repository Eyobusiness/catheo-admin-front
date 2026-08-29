import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateResponsableParoisseDto, ResponsableParoisse, UpdateResponsableParoisseDto } from '../../models/configuration.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-responsable-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './responsable-form-modal.component.html',
  styleUrl: './responsable-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsableFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly responsableToEdit = input<ResponsableParoisse | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateResponsableParoisseDto | UpdateResponsableParoisseDto>();

  protected readonly form = new FormGroup({
    nom_prenoms: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    fonction: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    telephone: new FormControl('', { nonNullable: true }),
    statut: new FormControl<'actif' | 'inactif'>('actif', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.responsableToEdit();
      const isEdit = this.isEditing();

      if (open) {
        if (isEdit && item) {
          this.form.setValue({
            nom_prenoms: item.nom_prenoms || '',
            fonction: item.fonction || item.titre_fonction || '',
            telephone: item.telephone || '',
            statut: item.statut || 'actif'
          });
        } else {
          this.form.reset({
            nom_prenoms: '',
            fonction: '',
            telephone: '',
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
        nom_prenoms: val.nom_prenoms,
        fonction: val.fonction,
        titre_fonction: val.fonction,
        telephone: val.telephone || undefined,
        statut: val.statut
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
