import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { FicheRenseignementBaptemeDto } from '../../models/impressions.model';

@Component({
  selector: 'app-doc-renseignement-bapteme',
  imports: [CommonModule, DatePipe, UpperCasePipe],
  templateUrl: './renseignement-bapteme.component.html',
  styleUrl: './renseignement-bapteme.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenseignementBaptemeComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<FicheRenseignementBaptemeDto | null>(null);

  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || 'PAROISSE';
  });

  public readonly diocese = computed(() => {
    return this.paroisseConfig()?.diocese || '';
  });

  public readonly doyenne = computed(() => {
    return this.paroisseConfig()?.doyenne || '';
  });

  public readonly logoParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
  });

  public readonly logoCatechese = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_catechese_url || p?.logo_catechese || '';
  });

  public readonly anneePastorale = computed(() => {
    return this.data()?.annee_libelle || this.anneeService.activeAnnee()?.libelle || '';
  });
}
