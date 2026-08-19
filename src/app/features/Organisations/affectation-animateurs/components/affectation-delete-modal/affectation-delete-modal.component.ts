import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AffectationAnimateur } from '../../models/affectation-animateur.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-affectation-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './affectation-delete-modal.component.html',
  styleUrl: './affectation-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffectationDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<AffectationAnimateur | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.itemToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir annuler cette affectation ?';
    return `Êtes-vous sûr de vouloir retirer l'affectation de "${target.animateur?.nom} ${target.animateur?.prenoms}" à la classe "${target.classe?.nom}" ?`;
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
