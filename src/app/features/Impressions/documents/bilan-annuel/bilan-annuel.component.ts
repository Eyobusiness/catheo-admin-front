import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DecimalPipe, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { FicheBilanAnnuelResponseDto } from '../../models/impressions.model';

@Component({
  selector: 'app-doc-bilan-annuel',
  imports: [CommonModule, DecimalPipe, UpperCasePipe],
  templateUrl: './bilan-annuel.component.html',
  styleUrl: './bilan-annuel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BilanAnnuelComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<FicheBilanAnnuelResponseDto | null>(null);

  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly nomParoisse = computed(() => {
    const fromDto = this.data()?.entete?.nom_paroisse || this.data()?.entete?.nom;
    if (fromDto) return fromDto;
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || 'PAROISSE';
  });

  public readonly diocese = computed(() => {
    return this.data()?.entete?.diocese || this.paroisseConfig()?.diocese || '';
  });

  public readonly logoParoisse = computed(() => {
    return this.data()?.entete?.logo_paroisse_url || this.data()?.entete?.logo_url || this.paroisseConfig()?.logo_paroisse_url || this.paroisseConfig()?.logo_paroisse || '';
  });

  public readonly logoCatechese = computed(() => {
    return this.data()?.entete?.logo_catechese_url || this.paroisseConfig()?.logo_catechese_url || this.paroisseConfig()?.logo_catechese || '';
  });

  public readonly anneePastorale = computed(() => {
    return this.data()?.annee_libelle || this.anneeService.activeAnnee()?.libelle || '';
  });

  public readonly deliberationsList = computed(() => {
    const list = this.data()?.deliberations || [];
    return list.map((st, idx) => ({
      ...st,
      num: String(idx + 1).padStart(2, '0')
    }));
  });

  public getDecisionLabel(decision: string): string {
    const d = decision?.toLowerCase() || '';
    if (d === 'admis') return 'Admis(e) au niveau sup.';
    if (d === 'redoublant' || d === 'ajourne') return 'Redoublement';
    if (d.includes('reserve')) return 'Admis sous réserve';
    return decision || 'En délibération';
  }
}
