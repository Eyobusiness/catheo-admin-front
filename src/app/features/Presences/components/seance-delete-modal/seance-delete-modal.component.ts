import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SeanceDto } from '../../models/seance.model';
import { AppDialog } from '../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-seance-delete-modal',
  imports: [AppDialog, AppButton],
  templateUrl: './seance-delete-modal.component.html',
  styleUrl: './seance-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeanceDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<SeanceDto | null>(null);
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
