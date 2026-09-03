import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { ListeCatechumenesResponseDto } from '../../models/impressions.model';

@Component({
  selector: 'app-doc-liste-catechumenes',
  imports: [CommonModule, DatePipe, UpperCasePipe],
  templateUrl: './liste-catechumenes.component.html',
  styleUrl: './liste-catechumenes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListeCatechumenesComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<ListeCatechumenesResponseDto | null>(null);

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

  public readonly catechumenesList = computed(() => {
    const list = this.data()?.catechumenes || [];
    return list.map((c, idx) => ({
      ...c,
      num: String(idx + 1).padStart(2, '0')
    }));
  });
}
