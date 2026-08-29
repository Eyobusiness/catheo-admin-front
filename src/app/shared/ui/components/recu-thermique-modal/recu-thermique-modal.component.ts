import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { AppDialog } from '../dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../buttons/app-button/app-button.component';
import { ConfigurationService } from '../../../../features/Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { FormatThermique, RecuPaiementData } from './models/recu-thermique.model';

@Component({
  selector: 'app-recu-thermique-modal',
  imports: [CommonModule, DecimalPipe, DatePipe, AppDialog, AppButton],
  templateUrl: './recu-thermique-modal.component.html',
  styleUrl: './recu-thermique-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuThermiqueModalComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly isOpen = input<boolean>(false);
  public readonly recuData = input<RecuPaiementData | null>(null);

  public readonly modalClosed = output<void>();

  // Format thermique : 58mm ou 80mm
  public readonly selectedFormat = signal<FormatThermique>('80mm');

  // Configuration Paroisse
  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly logoParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
  });

  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return (p?.nom_paroisse || p?.nom || 'ÉGLISE CATHOLIQUE').toUpperCase();
  });

  public readonly diocese = computed(() => {
    const p = this.paroisseConfig();
    return p?.diocese ? `DIOCÈSE DE ${p.diocese.toUpperCase()}` : '';
  });

  public readonly telephone = computed(() => {
    const p = this.paroisseConfig();
    return p?.telephone || '';
  });

  public readonly localisation = computed(() => {
    const p = this.paroisseConfig();
    const parts = [p?.commune || p?.ville, p?.adresse].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : '';
  });

  public readonly displayAnnee = computed(() => {
    const r = this.recuData();
    if (r?.annee_pastorale) return r.annee_pastorale;
    return this.anneeService.activeAnnee()?.libelle || '2025-2026';
  });

  protected setFormat(format: FormatThermique): void {
    this.selectedFormat.set(format);
  }

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected printReceipt(): void {
    window.print();
  }

  protected getModePaiementLabel(mode?: string): string {
    if (!mode) return 'Espèces (Comptant)';
    const m = mode.toLowerCase();
    if (m.includes('cheque')) return 'Chèque';
    if (m.includes('vir')) return 'Virement';
    if (m.includes('mob') || m.includes('wave') || m.includes('orange') || m.includes('mtn')) return 'Mobile Money';
    return 'Espèces (Comptant)';
  }
}
