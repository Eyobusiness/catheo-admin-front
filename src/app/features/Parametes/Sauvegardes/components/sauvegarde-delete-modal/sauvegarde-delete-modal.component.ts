import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SauvegardeDto } from '../../models/sauvegarde.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-sauvegarde-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './sauvegarde-delete-modal.component.html',
  styleUrl: './sauvegarde-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SauvegardeDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly sauvegarde = input<SauvegardeDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly closed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const s = this.sauvegarde();
    if (!s) return 'Êtes-vous sûr de vouloir supprimer ce fichier de sauvegarde ?';
    return `Êtes-vous sûr de vouloir supprimer définitivement l'archive "${s.nom_fichier}" (${s.taille}) créée le ${s.date} ?`;
  });

  protected readonly warningText = computed(() => {
    return 'Attention : Ce fichier sera définitivement supprimé du disque dur et ne pourra plus être utilisé pour une restauration.';
  });

  protected onClose(): void {
    this.closed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
