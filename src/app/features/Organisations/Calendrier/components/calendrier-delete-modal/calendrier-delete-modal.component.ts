import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Calendrier } from '../../models/calendrier.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-calendrier-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './calendrier-delete-modal.component.html',
  styleUrl: './calendrier-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendrierDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly eventToDelete = input<Calendrier | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.eventToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir supprimer cet événement ?';
    return `Êtes-vous sûr de vouloir supprimer l'événement "${target.titre}" prévu le ${target.date} ?`;
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
