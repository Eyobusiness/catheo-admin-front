import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { AppDialog } from '../dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../buttons/app-button/app-button.component';
import { ConfigurationService } from '../../../../features/Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { FormatThermique, RecuPaiementData } from './models/recu-thermique.model';

@Component({
  selector: 'app-recu-thermique-modal',
  imports: [CommonModule, DatePipe, DecimalPipe, UpperCasePipe, AppDialog, AppButton],
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

  public readonly selectedFormat = signal<FormatThermique>('80mm');

  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly logoParoisse = computed(() => {
    const p = this.paroisseConfig();
    const raw = p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
    return this.configService.resolveAssetUrl(raw);
  });

  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || '';
  });

  public readonly diocese = computed(() => {
    const p = this.paroisseConfig();
    return p?.diocese || '';
  });

  public readonly localisation = computed(() => {
    const p = this.paroisseConfig();
    const parts = [p?.commune || p?.ville, p?.adresse].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : '';
  });

  public readonly telephone = computed(() => {
    const p = this.paroisseConfig();
    return p?.telephone || '';
  });

  public readonly displayAnnee = computed(() => {
    const recu = this.recuData();
    if (recu?.annee_pastorale) return recu.annee_pastorale;
    return this.anneeService.activeAnnee()?.libelle || '';
  });

  private readonly pdfService = inject(PdfService);

  public setFormat(format: FormatThermique): void {
    this.selectedFormat.set(format);
  }

  public onClose(): void {
    this.modalClosed.emit();
  }

  protected printReceipt(): void {
    window.print();
  }

  protected exportPdf(): void {
    const data = this.recuData();
    if (!data) return;
    const paymentId = (data as any).id || (data as any).uuid || (data as any).paiement_id || data.reference;
    const ref = data.numero_recu || data.reference || 'recu';
    const catName = data.catechumene_nom ? `Catéchumène : ${data.catechumene_nom}` : undefined;

    this.pdfService.previewPaiementPdf(data, {
      reference: ref,
      catechumene: catName,
      format: 'thermique',
      data
    });
  }

  protected getLibellePrestation(data?: RecuPaiementData | null): string {
    if (!data) return "Droit d'inscription";
    if (data.type_operation && data.type_operation.toLowerCase().includes('inscription')) {
      return "Droit d'inscription";
    }
    if (data.libelle) {
      const lower = data.libelle.toLowerCase();
      if (lower.includes('droit') && lower.includes('inscription')) {
        return "Droit d'inscription";
      }
      if (lower.includes('frais') && lower.includes('inscription')) {
        return "Droit d'inscription";
      }
      const parts = data.libelle.split(' - ');
      if (parts.length > 0 && parts[0].trim()) {
        return parts[0].trim();
      }
      return data.libelle;
    }
    return "Droit d'inscription";
  }

  protected getPrestationLigne(data?: RecuPaiementData | null): string {
    if (!data) return "Droit d'inscription";
    const libelle = this.getLibellePrestation(data);
    const catNom = data.catechumene_nom || '';
    const niv = data.niveau_nom ? ` (${data.niveau_nom})` : '';

    if (catNom) {
      return `${libelle} - ${catNom}${niv}`;
    }
    return libelle;
  }

  protected getModePaiementLabel(mode?: string): string {
    if (!mode) return 'Espèces';
    switch (mode.toLowerCase()) {
      case 'especes':
      case 'espece':
        return 'Espèces';
      case 'wave':
        return 'Wave Money';
      case 'orange_money':
      case 'orange':
        return 'Orange Money';
      case 'mtn_momo':
      case 'mtn':
        return 'MTN MoMo';
      case 'moov_money':
      case 'moov':
        return 'Moov Money';
      default:
        return mode;
    }
  }
}
