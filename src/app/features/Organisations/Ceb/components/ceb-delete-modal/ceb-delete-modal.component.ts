import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Ceb } from '../../models/ceb.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-ceb-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './ceb-delete-modal.component.html',
  styleUrl: './ceb-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CebDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<Ceb | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.itemToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir supprimer cette CEB ?';
    return `Êtes-vous sûr de vouloir supprimer la communauté "${target.nom}" ? Cette action est irréversible.`;
  });

  protected readonly warningText = computed(() => {
    const target = this.itemToDelete();
    if (target?.total_inscriptions && target.total_inscriptions > 0) {
      return `Attention : ${target.total_inscriptions} catéchumène(s) sont actuellement rattaché(s) à cette CEB.`;
    }
    return '';
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
