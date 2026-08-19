import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Animateur } from '../../models/animateur.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-animateur-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './animateur-delete-modal.component.html',
  styleUrl: './animateur-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimateurDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<Animateur | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.itemToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir supprimer cet animateur / catéchiste ?';
    return `Êtes-vous sûr de vouloir retirer "${target.nom} ${target.prenoms}" du corps des animateurs ? Cette action est irréversible.`;
  });

  protected readonly warningText = computed(() => {
    const target = this.itemToDelete();
    if (target?.statut === 'actif') {
      return 'Attention : Ce catéchiste est actuellement actif et peut être assigné à une ou plusieurs classes.';
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
