import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MutationCatechumeneDto } from '../../models/mutation.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-mutation-detail-modal',
  imports: [CommonModule, DatePipe, AppDialog, AppButton],
  templateUrl: './mutation-detail-modal.component.html',
  styleUrl: './mutation-detail-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MutationDetailModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly mutation = input<MutationCatechumeneDto | null>(null);

  public readonly modalClosed = output<void>();

  protected onClose(): void {
    this.modalClosed.emit();
  }
}
