import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TarifDto } from '../../models/tarif.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-tarif-delete-modal',
  imports: [AppDialog, AppButton],
  templateUrl: './tarif-delete-modal.component.html',
  styleUrl: './tarif-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarifDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<TarifDto | null>(null);
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
