import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampagnePreinscriptionDto } from '../../models/campagne.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-campagne-qr-modal',
  imports: [CommonModule, AppDialog, AppButton],
  templateUrl: './campagne-qr-modal.component.html',
  styleUrl: './campagne-qr-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneQrModalComponent {
  private readonly toastService = inject(ToastService);

  public readonly isOpen = input<boolean>(false);
  public readonly campagne = input<CampagnePreinscriptionDto | null>(null);

  public readonly modalClosed = output<void>();

  protected readonly publicUrl = computed(() => {
    const c = this.campagne();
    if (!c) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (c.public_url && !c.public_url.startsWith('http://localhost/') && !c.public_url.startsWith('http://localhost:80/')) {
      return c.public_url;
    }
    return `${origin}/preinscriptions/campagne/${c.id}`;
  });

  protected readonly qrCodeUrl = computed(() => {
    const c = this.campagne();
    if (c?.qr_code_url) return c.qr_code_url;
    const url = encodeURIComponent(this.publicUrl());
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${url}&color=0284c7`;
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected copyLink(): void {
    const url = this.publicUrl();
    if (navigator?.clipboard && url) {
      navigator.clipboard.writeText(url).then(() => {
        this.toastService.success('Lien Copié', 'Le lien public de préinscription a été copié dans le presse-papier.');
      }).catch(() => {
        this.toastService.info('Lien Public', url);
      });
    } else if (url) {
      this.toastService.info('Lien Public', url);
    }
  }

  protected downloadQrCode(): void {
    const imgUrl = this.qrCodeUrl();
    const link = document.createElement('a');
    link.href = imgUrl;
    link.download = `QR_Campagne_${this.campagne()?.titre || 'Preinscription'}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success('Téléchargement', 'Le QR Code de la campagne est en cours de téléchargement.');
  }
}
