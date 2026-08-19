import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AnneeCatechese } from '../../models/annee-catechese.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-annee-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './annee-delete-modal.component.html',
  styleUrl: './annee-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnneeDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<AnneeCatechese | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.itemToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir supprimer cette année pastorale ?';
    return `Êtes-vous sûr de vouloir supprimer l'année pastorale ${target.libelle} ? Cette action est irréversible.`;
  });

  protected readonly warningText = computed(() => {
    const target = this.itemToDelete();
    if (target?.est_active) {
      return 'Attention : Il s\'agit de l\'année pastorale actuellement active pour la paroisse !';
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
