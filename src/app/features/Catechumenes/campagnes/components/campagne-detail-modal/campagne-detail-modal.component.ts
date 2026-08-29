import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CampagnePreinscriptionDto } from '../../models/campagne.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-campagne-detail-modal',
  imports: [CommonModule, DatePipe, AppDialog, AppButton],
  templateUrl: './campagne-detail-modal.component.html',
  styleUrl: './campagne-detail-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneDetailModalComponent {
  private readonly toastService = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly campagne = input<CampagnePreinscriptionDto | null>(null);

  public readonly modalClosed = output<void>();
  public readonly editRequested = output<CampagnePreinscriptionDto>();

  public readonly isCopied = signal<boolean>(false);

  protected readonly publicUrl = computed(() => {
    const c = this.campagne();
    if (!c) return '';
    if (c.public_url) return c.public_url;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/preinscription-publique/${c.id}`;
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onEdit(): void {
    const item = this.campagne();
    if (item) this.editRequested.emit(item);
  }

  protected copyLink(): void {
    const url = this.publicUrl();
    if (navigator?.clipboard && url) {
      navigator.clipboard.writeText(url).then(() => {
        this.isCopied.set(true);
        this.toastService.success('Lien Copié !', 'Le lien public a été copié dans le presse-papier.');
        setTimeout(() => this.isCopied.set(false), 2000);
      }).catch(() => {
        this.toastService.info('Lien Public', url);
      });
    } else if (url) {
      this.toastService.info('Lien Public', url);
    }
  }
}
