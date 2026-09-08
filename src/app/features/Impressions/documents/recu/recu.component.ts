import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { RecuPaiementData } from '../../../../shared/ui/components/recu-thermique-modal/models/recu-thermique.model';

@Component({
  selector: 'app-doc-recu',
  imports: [CommonModule, DatePipe, DecimalPipe, UpperCasePipe],
  templateUrl: './recu.component.html',
  styleUrl: './recu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecuComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<RecuPaiementData | null>(null);

  // Configuration dynamique de la paroisse
  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly logoParoisse = computed(() => {
    const p = this.paroisseConfig();
    const raw = p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
    return this.configService.resolveAssetUrl(raw);
  });

  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || 'SAINTE MONIQUE';
  });

  public readonly diocese = computed(() => {
    const p = this.paroisseConfig();
    return p?.diocese || "ARCHIDIOCÈSE D'ABIDJAN";
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
    const d = this.data();
    if (d?.annee_pastorale) return d.annee_pastorale;
    return this.anneeService.activeAnnee()?.libelle || '';
  });

  public getLibellePrestation(data?: RecuPaiementData | null): string {
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

  public getPrestationLigne(data?: RecuPaiementData | null): string {
    if (!data) return "Droit d'inscription";
    const libelle = this.getLibellePrestation(data);
    const catNom = data.catechumene_nom || '';
    const niv = data.niveau_nom ? ` (${data.niveau_nom})` : '';

    if (catNom) {
      return `${libelle} - ${catNom}${niv}`;
    }
    return libelle;
  }

  public getModePaiementLabel(mode?: string): string {
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
