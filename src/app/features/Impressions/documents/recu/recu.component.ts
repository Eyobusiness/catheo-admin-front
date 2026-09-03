import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { RecuPaiementData } from '../../../../shared/ui/components/recu-thermique-modal/models/recu-thermique.model';

@Component({
  selector: 'app-doc-recu',
  imports: [CommonModule, DatePipe, DecimalPipe],
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

  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || 'PAROISSE';
  });

  public readonly diocese = computed(() => {
    const p = this.paroisseConfig();
    return p?.diocese || '';
  });

  public readonly contactsParoisse = computed(() => {
    const p = this.paroisseConfig();
    const parts: string[] = [];
    if (p?.telephone) parts.push(`Tél : ${p.telephone}`);
    if (p?.email) parts.push(`Email : ${p.email}`);
    if (p?.adresse || p?.commune) parts.push(p.adresse || p.commune || '');
    return parts.join(' • ');
  });

  public readonly logoParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
  });

  public readonly anneePastorale = computed(() => {
    const fromData = this.data()?.annee_pastorale;
    if (fromData) return fromData;
    return this.anneeService.activeAnnee()?.libelle || '';
  });

  public getAffectation(d: RecuPaiementData): string {
    return [d.section_nom, d.niveau_nom, d.classe_nom].filter(val => !!val).join(' • ');
  }

  public getModePaiementLabel(mode?: string): string {
    if (!mode) return 'Espèces';
    const m = mode.toLowerCase();
    if (m.includes('mobile') || m.includes('momo') || m.includes('wave') || m.includes('orange')) return 'Mobile Money';
    if (m.includes('cheque') || m.includes('chèque')) return 'Chèque Bancaire';
    if (m.includes('virement')) return 'Virement Bancaire';
    if (m.includes('carte')) return 'Carte Bancaire';
    return 'Espèces (Caisse)';
  }
}
