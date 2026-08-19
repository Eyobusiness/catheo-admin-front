import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Niveau } from '../../models/niveau.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-niveau-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './niveau-delete-modal.component.html',
  styleUrl: './niveau-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NiveauDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<Niveau | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.itemToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir supprimer ce niveau de catéchèse ?';
    return `Êtes-vous sûr de vouloir supprimer le niveau "${target.nom}" ? Cette action est irréversible.`;
  });

  protected readonly warningText = computed(() => {
    const target = this.itemToDelete();
    if (target?.statut === 'actif') {
      return 'Attention : Ce niveau est actuellement actif dans la paroisse.';
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
