import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CatechumeneDto } from '../../models/catechumene.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-catechumene-delete-modal',
  imports: [AppDialog, AppButton],
  templateUrl: './catechumene-delete-modal.component.html',
  styleUrl: './catechumene-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatechumeneDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<CatechumeneDto | null>(null);
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
