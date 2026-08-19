import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PreinscriptionDto, ValiderPreinscriptionDto } from '../../models/preinscription.model';
import { NiveauDto } from '../../../../Organisations/Niveaux/models/niveau.model';
import { ClasseDto } from '../../../../Organisations/Classe/models/classe.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-preinscription-valider-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './preinscription-valider-modal.component.html',
  styleUrl: './preinscription-valider-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreinscriptionValiderModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly preinscription = input<PreinscriptionDto | null>(null);
  public readonly niveaux = input<NiveauDto[]>([]);
  public readonly classes = input<ClasseDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly validated = output<ValiderPreinscriptionDto>();

  protected readonly form = new FormGroup({
    niveau_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    classe_id: new FormControl('', { nonNullable: true }),
    frais_payes: new FormControl<boolean>(true, { nonNullable: true }),
    notes_validation: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const item = this.preinscription();
      const nivs = this.niveaux();
      const defaultNiv = item?.niveau_souhaite_id || item?.niveau_souhaite?.id || (nivs.length > 0 ? nivs[0].id : '');

      if (item) {
        this.form.setValue({
          niveau_id: defaultNiv,
          classe_id: '',
          frais_payes: item.frais_payes ?? true,
          notes_validation: item.notes_validation || ''
        });
      }
    });
  }

  protected getFilteredClasses(): ClasseDto[] {
    const nivId = this.form.controls.niveau_id.value;
    if (!nivId) return this.classes();
    return this.classes().filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
  }

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      this.validated.emit({
        niveau_id: val.niveau_id,
        classe_id: val.classe_id || undefined,
        frais_payes: val.frais_payes,
        notes_validation: val.notes_validation || undefined
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
