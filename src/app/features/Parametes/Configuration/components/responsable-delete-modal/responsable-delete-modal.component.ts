import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ResponsableParoisse } from '../../models/configuration.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-responsable-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './responsable-delete-modal.component.html',
  styleUrl: './responsable-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsableDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly responsable = input<ResponsableParoisse | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly closed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.responsable();
    if (!target) return 'Êtes-vous sûr de vouloir retirer ce responsable de la paroisse ?';
    return `Êtes-vous sûr de vouloir retirer "${target.nom_prenoms}" (${target.titre_fonction}) de la liste des responsables ?`;
  });

  protected readonly warningText = computed(() => {
    return 'Cette action retirera ce responsable de la liste active de la paroisse.';
  });

  protected onClose(): void {
    this.closed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
