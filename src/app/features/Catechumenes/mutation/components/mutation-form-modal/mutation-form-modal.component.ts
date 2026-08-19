import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  CreateMutationCatechumeneDto,
  MutationCatechumeneDto
} from '../../models/mutation.model';
import { CatechumeneDto } from '../../../liste-catechumene/models/catechumene.model';
import { AnneeCatecheseDto } from '../../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-mutation-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './mutation-form-modal.component.html',
  styleUrl: './mutation-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MutationFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly catechumenes = input<CatechumeneDto[]>([]);
  public readonly annees = input<AnneeCatecheseDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: CreateMutationCatechumeneDto;
    catechumene?: CatechumeneDto;
    annee?: AnneeCatecheseDto;
  }>();

  protected readonly form = new FormGroup({
    catechumene_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    annee_catechese_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    paroisse_origine_nom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    paroisse_destination_nom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    date_mutation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    motif: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] })
  });

  constructor() {
    effect(() => {
      const currentAnnee = this.annees().find(a => a.est_active) || (this.annees().length > 0 ? this.annees()[0] : null);
      if (this.isOpen()) {
        this.form.reset({
          catechumene_id: '',
          annee_catechese_id: currentAnnee ? currentAnnee.id : '',
          paroisse_origine_nom: 'Paroisse Actuelle',
          paroisse_destination_nom: '',
          date_mutation: new Date().toISOString().substring(0, 10),
          motif: ''
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
      const selectedCat = this.catechumenes().find(c => c.id === val.catechumene_id);
      const selectedAnnee = this.annees().find(a => a.id === val.annee_catechese_id);

      const dto: CreateMutationCatechumeneDto = {
        catechumene_id: val.catechumene_id,
        annee_catechese_id: val.annee_catechese_id,
        paroisse_origine_nom: val.paroisse_origine_nom,
        paroisse_destination_nom: val.paroisse_destination_nom,
        date_mutation: val.date_mutation,
        motif: val.motif || undefined
      };

      this.formSubmitted.emit({
        dto,
        catechumene: selectedCat,
        annee: selectedAnnee
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
