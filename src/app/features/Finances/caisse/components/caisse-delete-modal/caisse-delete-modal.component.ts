import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CaisseMouvementDto } from '../../models/caisse.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-caisse-delete-modal',
  imports: [AppDialog, AppButton],
  templateUrl: './caisse-delete-modal.component.html',
  styleUrl: './caisse-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaisseDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<CaisseMouvementDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
