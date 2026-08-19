import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Section } from '../../models/section.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-section-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './section-delete-modal.component.html',
  styleUrl: './section-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<Section | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.itemToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir supprimer cette section ?';
    return `Êtes-vous sûr de vouloir supprimer la section "${target.nom}" ? Cette action supprimera les liaisons associées.`;
  });

  protected readonly warningText = computed(() => {
    const target = this.itemToDelete();
    if (target?.total_niveaux && target.total_niveaux > 0) {
      return `Attention : Cette section contient ${target.total_niveaux} niveau(x) de catéchèse !`;
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
