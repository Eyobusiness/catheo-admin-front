import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PreinscriptionDto } from '../../models/preinscription.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-preinscription-detail-modal',
  imports: [CommonModule, DatePipe, AppDialog, AppButton],
  templateUrl: './preinscription-detail-modal.component.html',
  styleUrl: './preinscription-detail-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreinscriptionDetailModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly preinscription = input<PreinscriptionDto | null>(null);

  public readonly modalClosed = output<void>();
  public readonly editRequested = output<PreinscriptionDto>();
  public readonly validerRequested = output<PreinscriptionDto>();
  public readonly rejeterRequested = output<PreinscriptionDto>();

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onEdit(): void {
    const item = this.preinscription();
    if (item) this.editRequested.emit(item);
  }

  protected onValider(): void {
    const item = this.preinscription();
    if (item) this.validerRequested.emit(item);
  }

  protected onRejeter(): void {
    const item = this.preinscription();
    if (item) this.rejeterRequested.emit(item);
  }
}
