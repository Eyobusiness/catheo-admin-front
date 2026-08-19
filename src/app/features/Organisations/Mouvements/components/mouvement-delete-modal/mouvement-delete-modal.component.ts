import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Mouvement } from '../../models/mouvement.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-mouvement-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './mouvement-delete-modal.component.html',
  styleUrl: './mouvement-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MouvementDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<Mouvement | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.itemToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir supprimer ce mouvement ?';
    return `Êtes-vous sûr de vouloir supprimer le mouvement "${target.nom}" ? Cette action est irréversible.`;
  });

  protected readonly warningText = computed(() => {
    const target = this.itemToDelete();
    if (target?.total_inscriptions && target.total_inscriptions > 0) {
      return `Attention : ${target.total_inscriptions} catéchumène(s) / adhérent(s) sont actuellement affilié(s) à ce mouvement.`;
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
