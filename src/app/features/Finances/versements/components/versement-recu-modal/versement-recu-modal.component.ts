import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { VersementDto } from '../../models/versement.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { ConfigurationService } from '../../../../Parametes/Configuration/services/configuration.service';

@Component({
  selector: 'app-versement-recu-modal',
  imports: [CommonModule, DecimalPipe, DatePipe, AppDialog, AppButton],
  templateUrl: './versement-recu-modal.component.html',
  styleUrl: './versement-recu-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersementRecuModalComponent {
  private readonly configService = inject(ConfigurationService);

  public readonly isOpen = input<boolean>(false);
  public readonly versement = input<VersementDto | null>(null);

  public readonly modalClosed = output<void>();

  // Configuration Paroisse
  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly logoParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
  });

  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || 'ÉGLISE CATHOLIQUE';
  });

  public readonly diocese = computed(() => {
    const p = this.paroisseConfig();
    return p?.diocese || '';
  });

  public readonly localisation = computed(() => {
    const p = this.paroisseConfig();
    const parts = [p?.commune || p?.ville, p?.adresse].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : '';
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected printReceipt(): void {
    window.print();
  }

  protected getModeLabel(mode?: string): string {
    switch (mode) {
      case 'cheque':
        return 'Chèque Paroissial';
      case 'virement':
        return 'Virement Bancaire';
      default:
        return 'Espèces (Remise en mains propres)';
    }
  }
}
