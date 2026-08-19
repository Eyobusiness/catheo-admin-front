import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateModuleTrimestrielDto,
  ModuleTrimestriel,
  TrimestreCode,
  UpdateModuleTrimestrielDto
} from '../../models/module-trimestriel.model';
import { AnneeCatechese } from '../../../AnneesPastorales/models/annee-catechese.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-module-trimestriel-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './module-trimestriel-form-modal.component.html',
  styleUrl: './module-trimestriel-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleTrimestrielFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly moduleToEdit = input<ModuleTrimestriel | null>(null);
  public readonly annees = input<AnneeCatechese[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateModuleTrimestrielDto | UpdateModuleTrimestrielDto>();

  protected readonly form = new FormGroup({
    annee_catechese_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    trimestre: new FormControl<TrimestreCode>('T1', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    libelle: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    date_debut: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    date_fin: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.moduleToEdit();
      const isEdit = this.isEditing();
      const availableAnnees = this.annees();
      const activeAnnee = availableAnnees.find(a => a.est_active);
      const defaultAnneeId = activeAnnee ? activeAnnee.id : (availableAnnees[0]?.id || '');

      if (open) {
        if (isEdit && item) {
          this.form.setValue({
            annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id || defaultAnneeId,
            trimestre: item.trimestre || 'T1',
            libelle: item.libelle || '',
            date_debut: item.date_debut || '',
            date_fin: item.date_fin || ''
          });
        } else {
          this.form.reset({
            annee_catechese_id: defaultAnneeId,
            trimestre: 'T1',
            libelle: '',
            date_debut: '',
            date_fin: ''
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
        annee_catechese_id: val.annee_catechese_id,
        trimestre: val.trimestre,
        libelle: val.libelle,
        date_debut: val.date_debut,
        date_fin: val.date_fin
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}

