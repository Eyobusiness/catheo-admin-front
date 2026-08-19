import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnneeCatechese, CreateAnneeCatecheseDto, UpdateAnneeCatecheseDto } from '../../models/annee-catechese.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-annee-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './annee-form-modal.component.html',
  styleUrl: './annee-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnneeFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly anneeToEdit = input<AnneeCatechese | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateAnneeCatecheseDto | UpdateAnneeCatecheseDto>();

  protected readonly form = new FormGroup({
    libelle: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{4}$/)]
    }),
    date_debut: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    date_fin: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    est_active: new FormControl<boolean>(false, {
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      const item = this.anneeToEdit();
      if (this.isEditing() && item) {
        this.form.setValue({
          libelle: item.libelle,
          date_debut: item.date_debut,
          date_fin: item.date_fin,
          est_active: item.est_active
        });
      } else {
        this.form.reset({
          libelle: '2026-2027',
          date_debut: '2026-09-15',
          date_fin: '2027-06-30',
          est_active: false
        });
      }
    });
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      this.formSubmitted.emit(this.form.getRawValue());
    } else {
      this.form.markAllAsTouched();
    }
  }
}
