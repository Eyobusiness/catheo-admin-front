import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CampagnePreinscriptionDto } from '../../models/campagne.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-campagne-detail-modal',
  imports: [CommonModule, DatePipe, AppDialog, AppButton],
  templateUrl: './campagne-detail-modal.component.html',
  styleUrl: './campagne-detail-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneDetailModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly campagne = input<CampagnePreinscriptionDto | null>(null);

  public readonly modalClosed = output<void>();
  public readonly editRequested = output<CampagnePreinscriptionDto>();

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onEdit(): void {
    const item = this.campagne();
    if (item) this.editRequested.emit(item);
  }
}
