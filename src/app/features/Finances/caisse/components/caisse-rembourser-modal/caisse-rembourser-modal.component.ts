import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CaisseMouvementDto, RemboursementCaisseDto } from '../../models/caisse.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-caisse-rembourser-modal',
  imports: [CommonModule, DecimalPipe, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './caisse-rembourser-modal.component.html',
  styleUrl: './caisse-rembourser-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaisseRembourserModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly mouvement = input<CaisseMouvementDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly remboursementSubmitted = output<{
    mouvementId: string;
    dto: RemboursementCaisseDto;
  }>();

  protected readonly form = new FormGroup({
    montant_rembourse: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),
    motif: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)]
    })
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;

      const item = this.mouvement();
      if (item) {
        this.form.reset({
          montant_rembourse: item.montant,
          motif: ''
        });
      }
    }, { allowSignalWrites: true });
  }

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid && this.mouvement()) {
      const raw = this.form.getRawValue();
      const current = this.mouvement()!;

      this.remboursementSubmitted.emit({
        mouvementId: current.id,
        dto: {
          montant_rembourse: raw.montant_rembourse,
          motif: raw.motif
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
