import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Classe } from '../../models/classe.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-classe-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './classe-delete-modal.component.html',
  styleUrl: './classe-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClasseDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<Classe | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.itemToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir supprimer cette classe de catéchèse ?';
    return `Êtes-vous sûr de vouloir supprimer la classe "${target.nom}" ? Cette action est irréversible.`;
  });

  protected readonly warningText = computed(() => {
    const target = this.itemToDelete();
    if (target && target.effectif_actuel && target.effectif_actuel > 0) {
      return `Attention : Cette classe contient actuellement ${target.effectif_actuel} catéchumène(s) inscrit(s).`;
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
