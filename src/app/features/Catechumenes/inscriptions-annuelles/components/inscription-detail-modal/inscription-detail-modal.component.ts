import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { InscriptionAnnuelleDto } from '../../models/inscription-annuelle.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-inscription-detail-modal',
  imports: [CommonModule, DatePipe, AppDialog, AppButton],
  templateUrl: './inscription-detail-modal.component.html',
  styleUrl: './inscription-detail-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InscriptionDetailModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly inscription = input<InscriptionAnnuelleDto | null>(null);

  public readonly modalClosed = output<void>();
  public readonly editRequested = output<InscriptionAnnuelleDto>();

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onEdit(): void {
    const item = this.inscription();
    if (item) this.editRequested.emit(item);
  }
}
