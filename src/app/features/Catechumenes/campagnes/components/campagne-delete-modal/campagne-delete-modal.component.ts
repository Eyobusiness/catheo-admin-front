import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CampagnePreinscriptionDto } from '../../models/campagne.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-campagne-delete-modal',
  imports: [AppDialog, AppButton],
  templateUrl: './campagne-delete-modal.component.html',
  styleUrl: './campagne-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<CampagnePreinscriptionDto | null>(null);
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
