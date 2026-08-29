import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CreateModuleTrimestrielDto,
  ModuleTrimestriel,
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
    }),
    statut: new FormControl<string>('en cours', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.moduleToEdit();
      const isEdit = this.isEditing();

      if (open) {
        if (isEdit && item) {
          const rawStatut = String(item.statut || '').trim().toLowerCase();
          const statutVal = (rawStatut === 'termine' || rawStatut === 'terminé' || rawStatut === 'completed' || rawStatut === 'past')
            ? 'termine'
            : 'en cours';

          this.form.patchValue({
            libelle: item.libelle || '',
            date_debut: item.date_debut || '',
            date_fin: item.date_fin || '',
            statut: statutVal
          });
        } else {
          this.form.reset({
            libelle: '',
            date_debut: '',
            date_fin: '',
            statut: 'en cours'
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
      const activeAnnee = this.annees().find(a => a.est_active);
      const activeAnneeId = activeAnnee ? activeAnnee.id : (this.annees()[0]?.id || '');
      
      const anneeId = this.isEditing() && this.moduleToEdit()?.annee_catechese_id
        ? this.moduleToEdit()!.annee_catechese_id!
        : activeAnneeId;

      this.formSubmitted.emit({
        annee_catechese_id: anneeId,
        libelle: val.libelle.trim(),
        date_debut: val.date_debut,
        date_fin: val.date_fin,
        statut: val.statut
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}


