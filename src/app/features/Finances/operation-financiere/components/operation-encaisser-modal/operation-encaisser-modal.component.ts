import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { OperationPaiementDto, StorePaiementDto, ModePaiement } from '../../models/operation.model';
import { AnneeCatecheseService } from '../../../../../core/services/annee-catechese.service';
import { CatechumeneService } from '../../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { TarifService } from '../../../tarification/services/tarif.service';
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
  private readonly catechumeneService = inject(CatechumeneService);
  private readonly tarifService = inject(TarifService);

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

  public readonly annees = this.anneeService.annees;
  public readonly activeAnnee = this.anneeService.activeAnnee;
  public readonly catechumenes = this.catechumeneService.catechumenes;
  public readonly tarifs = this.tarifService.tarifs;

  protected readonly form = new FormGroup({
    annee_catechese_id: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
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

      if (this.annees().length === 0) {
        this.anneeService.getAll().subscribe();
      }
      if (this.tarifs().length === 0) {
        this.tarifService.getAll().subscribe();
      }
      if (this.catechumenes().length === 0) {
        this.catechumeneService.getAll().subscribe();
      }

      const item = this.operation();
      const today = new Date().toISOString().substring(0, 10);

      if (item) {
        const remaining = typeof item.montant_restant === 'number'
          ? item.montant_restant
          : (item.montant_total || item.montant || 0) - (item.montant_paye || 0);

        const initialAnneeId = item.annee_catechese_id ||
          (item.annee_catechese as any)?.id ||
          this.activeAnnee()?.id ||
          (this.annees().length > 0 ? this.annees()[0].id : '');

        this.form.reset({
          annee_catechese_id: initialAnneeId,
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

      // 1. Année Catéchèse ID
      let anneeId = raw.annee_catechese_id ||
        currentOp.annee_catechese_id ||
        (currentOp.annee_catechese as any)?.id ||
        this.activeAnnee()?.id;

      if (!anneeId && this.annees().length > 0) {
        anneeId = this.annees()[0].id;
      }

      // 2. Catéchumène ID
      let catId = currentOp.catechumene_id ||
        (currentOp.catechumene as any)?.id ||
        (currentOp as any).inscription_annuelle?.catechumene_id ||
        (currentOp as any).inscription_annuelle?.catechumene?.id;

      if (!catId && currentOp.catechumene) {
        const mat = (currentOp.catechumene as any).matricule || (currentOp.catechumene as any).code_catechumene;
        const nom = (currentOp.catechumene.nom || '').toLowerCase().trim();
        const prenoms = ((currentOp.catechumene as any).prenom || (currentOp.catechumene as any).prenoms || '').toLowerCase().trim();
        const found = this.catechumenes().find(c =>
          (mat && (c.matricule === mat || c.code_catechumene === mat)) ||
          (nom && c.nom.toLowerCase().trim() === nom && (!prenoms || c.prenoms.toLowerCase().trim().includes(prenoms)))
        );
        if (found) {
          catId = found.id;
        }
      }

      // 3. Tarif ID
      let tarifId = currentOp.tarif_id ||
        (currentOp.tarif as any)?.id ||
        (currentOp.lignes_paiements && currentOp.lignes_paiements.length > 0 ? currentOp.lignes_paiements[0].tarif_id : undefined);

      if (!tarifId && this.tarifs().length > 0) {
        const foundTarif = this.tarifs().find(t =>
          (currentOp.type_tarif && t.type_tarif === currentOp.type_tarif) ||
          (t.intitule && currentOp.libelle && t.intitule.toLowerCase().trim() === currentOp.libelle.toLowerCase().trim()) ||
          t.montant === (currentOp.montant_total || currentOp.montant)
        );
        if (foundTarif) {
          tarifId = foundTarif.id;
        } else if (this.tarifs().length > 0) {
          tarifId = this.tarifs()[0].id;
        }
      }

      const recu = raw.montant_recu || raw.montant;
      const rendu = recu > raw.montant ? recu - raw.montant : 0;

      const ligne: any = {
        designation: currentOp.libelle,
        montant: raw.montant,
        quantite: 1
      };

      if (tarifId) {
        ligne.tarif_id = tarifId;
      }
      if (currentOp.id) {
        ligne.operation_paiement_id = currentOp.id;
      }

      const dto: StorePaiementDto = {
        annee_catechese_id: anneeId,
        catechumene_id: catId,
        inscription_annuelle_id: currentOp.inscription_annuelle_id || (currentOp as any).inscription_annuelle?.id || undefined,
        mode_paiement: raw.mode_paiement,
        reference_transaction: raw.reference_transaction || undefined,
        date_paiement: raw.date_paiement,
        notes: raw.notes || undefined,
        lignes: [ligne]
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
