import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { SuiviSacramentalResponseDto } from '../../models/impressions.model';

@Component({
  selector: 'app-doc-suivi-sacramental',
  imports: [CommonModule, UpperCasePipe],
  templateUrl: './suivi-sacramental.component.html',
  styleUrl: './suivi-sacramental.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuiviSacramentalComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<SuiviSacramentalResponseDto | null>(null);

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

  public readonly sacrementTitle = computed(() => {
    const s = this.data()?.sacrement?.toLowerCase() || '';
    if (s.includes('bap')) return 'BAPTÊME';
    if (s.includes('com')) return 'PREMIÈRE COMMUNION';
    if (s.includes('conf')) return 'CONFIRMATION';
    return (this.data()?.sacrement || 'SACREMENT').toUpperCase();
  });

  public readonly candidatsList = computed(() => {
    const list = this.data()?.candidats || [];
    return list.map((c, idx) => ({
      ...c,
      num: String(idx + 1).padStart(2, '0')
    }));
  });
}
