import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { OperationPaiementDto, StorePaiementDto, ModePaiement } from '../../models/operation.model';
import { AnneeCatecheseService } from '../../../../../core/services/annee-catechese.service';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-operation-encaisser-modal',
  imports: [CommonModule, DecimalPipe, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './operation-encaisser-modal.component.html',
  styleUrl: './operation-encaisser-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationEncaisserModalComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly isOpen = input<boolean>(false);
  public readonly operation = input<OperationPaiementDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly encaissementSubmitted = output<{
    operationId: string;
    dto: StorePaiementDto;
    montantRecu?: number;
    montantRendu?: number;
  }>();

  protected readonly activeAnnee = this.anneeService.activeAnnee;

  protected readonly form = new FormGroup({
    mode_paiement: new FormControl<ModePaiement>('especes', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    reference_transaction: new FormControl<string | null>(null),
    date_paiement: new FormControl(new Date().toISOString().substring(0, 10), {
      nonNullable: true,
      validators: [Validators.required]
    }),
    montant: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),
    montant_recu: new FormControl<number | null>(null),
    notes: new FormControl<string | null>(null)
  });

  protected readonly liveMontantRecu = signal<number>(0);

  protected readonly monnaieRendue = computed(() => {
    const du = this.form.controls.montant.value || 0;
    const recu = this.liveMontantRecu();
    if (recu > du) {
      return recu - du;
    }
    return 0;
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;

      const item = this.operation();
      const today = new Date().toISOString().substring(0, 10);

      if (item) {
        const remaining = typeof item.montant_restant === 'number'
          ? item.montant_restant
          : (item.montant_total || item.montant || 0) - (item.montant_paye || 0);

        this.form.reset({
          mode_paiement: 'especes',
          reference_transaction: null,
          date_paiement: today,
          montant: remaining,
          montant_recu: remaining,
          notes: null
        });
        this.liveMontantRecu.set(remaining);
      }
    }, { allowSignalWrites: true });
  }

  protected onMontantRecuInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = parseFloat(input.value) || 0;
    this.liveMontantRecu.set(val);
  }

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid && this.operation()) {
      const raw = this.form.getRawValue();
      const currentOp = this.operation()!;
      const anneeId = currentOp.annee_catechese_id || this.activeAnnee()?.id || '';

      const recu = raw.montant_recu || raw.montant;
      const rendu = recu > raw.montant ? recu - raw.montant : 0;

      const dto: StorePaiementDto = {
        annee_catechese_id: anneeId,
        catechumene_id: currentOp.catechumene_id || (currentOp.catechumene as any)?.id,
        mode_paiement: raw.mode_paiement,
        reference_transaction: raw.reference_transaction || undefined,
        date_paiement: raw.date_paiement,
        notes: raw.notes || undefined,
        lignes: [
          {
            designation: currentOp.libelle,
            montant: raw.montant,
            quantite: 1,
            tarif_id: currentOp.tarif_id || (currentOp.tarif as any)?.id
          }
        ]
      };

      this.encaissementSubmitted.emit({
        operationId: currentOp.id,
        dto,
        montantRecu: recu,
        montantRendu: rendu
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
