import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { OperationPaiementDto } from '../../models/operation.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-operation-delete-modal',
  imports: [AppDialog, AppButton],
  templateUrl: './operation-delete-modal.component.html',
  styleUrl: './operation-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<OperationPaiementDto | null>(null);
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
