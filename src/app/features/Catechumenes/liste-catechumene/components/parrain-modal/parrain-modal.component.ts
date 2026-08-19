import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CreateParrainMarraineDto, TypeParrain } from '../../models/catechumene.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-parrain-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './parrain-modal.component.html',
  styleUrl: './parrain-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParrainModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly catechumeneId = input<string>('');
  public readonly catechumeneName = input<string>('');
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly parrainSubmitted = output<CreateParrainMarraineDto>();

  protected readonly form = new FormGroup({
    type: new FormControl<TypeParrain>('parrain', { nonNullable: true, validators: [Validators.required] }),
    nom_prenoms: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    telephone: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    domicile: new FormControl('', { nonNullable: true }),
    paroisse_origine: new FormControl('', { nonNullable: true }),
    representant_nom: new FormControl('', { nonNullable: true }),
    representant_contact: new FormControl('', { nonNullable: true }),
    sacrement_confirmation: new FormControl<boolean>(true, { nonNullable: true })
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.form.reset({
          type: 'parrain',
          nom_prenoms: '',
          telephone: '',
          email: '',
          domicile: '',
          paroisse_origine: '',
          representant_nom: '',
          representant_contact: '',
          sacrement_confirmation: true
        });
      }
    });
  }

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid && this.catechumeneId()) {
      const val = this.form.getRawValue();
      const payload: CreateParrainMarraineDto = {
        catechumene_id: this.catechumeneId(),
        type: val.type,
        nom_prenoms: val.nom_prenoms,
        telephone: val.telephone || undefined,
        email: val.email || undefined,
        domicile: val.domicile || undefined,
        paroisse_origine: val.paroisse_origine || undefined,
        representant_nom: val.representant_nom || undefined,
        representant_contact: val.representant_contact || undefined,
        sacrement_confirmation: val.sacrement_confirmation
      };
      this.parrainSubmitted.emit(payload);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
