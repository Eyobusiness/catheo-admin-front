import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

@Component({
  selector: 'app-header-paroisse-print',
  imports: [CommonModule, UpperCasePipe],
  templateUrl: './header-paroisse-print.component.html',
  styleUrl: './header-paroisse-print.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderParoissePrintComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly anneePastorale = input<string>('');
  public readonly customTitle = input<string>('');
  public readonly classe = input<string>('');
  public readonly photoProfil = input<string | null | undefined>(null);
  public readonly isFicheIndividuelle = input<boolean>(false);

  public readonly logoParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
  });

  public readonly logoCatechese = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_catechese_url || p?.logo_catechese || '';
  });

  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || '';
  });

  public readonly diocese = computed(() => {
    const p = this.paroisseConfig();
    return p?.diocese || '';
  });

  public readonly doyenne = computed(() => {
    const p = this.paroisseConfig();
    return p?.doyenne || '';
  });

  public readonly adresse = computed(() => {
    const p = this.paroisseConfig();
    return p?.adresse || '';
  });

  public readonly email = computed(() => {
    const p = this.paroisseConfig();
    return p?.email || '';
  });

  public readonly telephone = computed(() => {
    const p = this.paroisseConfig();
    return p?.telephone || '';
  });

  public readonly anneeDisplay = computed(() => {
    if (this.anneePastorale()) return this.anneePastorale();
    return this.anneeService.activeAnnee()?.libelle || '';
  });
}
