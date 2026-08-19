import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Classe, ClasseStatut, CreateClasseDto, UpdateClasseDto } from '../../models/classe.model';
import { Niveau } from '../../../Niveaux/models/niveau.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-classe-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './classe-form-modal.component.html',
  styleUrl: './classe-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClasseFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly classeToEdit = input<Classe | null>(null);
  public readonly niveaux = input<Niveau[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateClasseDto | UpdateClasseDto>();

  protected readonly form = new FormGroup({
    niveau_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    capacite_max: new FormControl<number>(30, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(200)]
    }),
    statut: new FormControl<ClasseStatut>('active', {
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      const item = this.classeToEdit();
      const availableNiveaux = this.niveaux();
      const defaultNiveauId = availableNiveaux.length > 0 ? availableNiveaux[0].id : '';

      if (this.isEditing() && item) {
        this.form.setValue({
          niveau_id: item.niveau_id || item.niveau?.id || defaultNiveauId,
          nom: item.nom,
          capacite_max: item.capacite_max || 30,
          statut: item.statut || 'active'
        });
      } else {
        this.form.reset({
          niveau_id: defaultNiveauId,
          nom: '',
          capacite_max: 30,
          statut: 'active'
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
        niveau_id: val.niveau_id,
        nom: val.nom,
        capacite_max: val.capacite_max,
        statut: val.statut
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
