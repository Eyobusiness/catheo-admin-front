import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MutationCatechumeneDto } from '../../models/mutation.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-mutation-delete-modal',
  imports: [AppDialog, AppButton],
  templateUrl: './mutation-delete-modal.component.html',
  styleUrl: './mutation-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MutationDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<MutationCatechumeneDto | null>(null);
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
