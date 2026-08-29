import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OperationPaiementDto, CreateOperationDto, UpdateOperationDto } from '../../models/operation.model';
import { CatechumeneDto } from '../../../../Catechumenes/liste-catechumene/models/catechumene.model';
import { TarifDto } from '../../../tarification/models/tarif.model';
import { AnneeCatecheseService } from '../../../../../core/services/annee-catechese.service';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-operation-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './operation-form-modal.component.html',
  styleUrl: './operation-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationFormModalComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly operationToEdit = input<OperationPaiementDto | null>(null);
  public readonly catechumenes = input<CatechumeneDto[]>([]);
  public readonly tarifs = input<TarifDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateOperationDto | UpdateOperationDto>();

  protected readonly activeAnnee = this.anneeService.activeAnnee;

  protected readonly form = new FormGroup({
    catechumene_id: new FormControl<string | null>(null),
    tarif_id: new FormControl<string | null>(null),
    libelle: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    montant: new FormControl<number>(15000, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),
    echeance: new FormControl<string | null>(null)
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;

      const item = this.operationToEdit();

      if (this.isEditing() && item) {
        this.form.setValue({
          catechumene_id: item.catechumene_id || (item.catechumene as any)?.id || null,
          tarif_id: item.tarif_id || (item.tarif as any)?.id || null,
          libelle: item.libelle,
          montant: item.montant_total ?? item.montant ?? 15000,
          echeance: item.echeance ? item.echeance.substring(0, 10) : null
        });
      } else {
        this.form.reset({
          catechumene_id: null,
          tarif_id: null,
          libelle: '',
          montant: 15000,
          echeance: null
        });
      }
    }, { allowSignalWrites: true });
  }

  protected onTarifSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const tarifId = select.value;
    const found = this.tarifs().find(t => t.id === tarifId);
    if (found) {
      this.form.controls.libelle.setValue(found.intitule);
      this.form.controls.montant.setValue(found.montant);
    }
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const anneeId = this.activeAnnee()?.id || undefined;

      if (this.isEditing()) {
        const dto: UpdateOperationDto = {
          libelle: raw.libelle,
          montant_total: raw.montant,
          montant: raw.montant,
          echeance: raw.echeance || undefined
        };
        this.formSubmitted.emit(dto);
      } else {
        const dto: CreateOperationDto = {
          annee_catechese_id: anneeId,
          catechumene_id: raw.catechumene_id || undefined,
          tarif_id: raw.tarif_id || undefined,
          libelle: raw.libelle,
          montant_total: raw.montant,
          montant: raw.montant,
          echeance: raw.echeance || undefined
        };
        this.formSubmitted.emit(dto);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
