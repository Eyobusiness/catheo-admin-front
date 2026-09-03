import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DecimalPipe, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

export interface RapportAnnuelData {
  annee_libelle?: string;
  total_inscrits?: number;
  total_garcons?: number;
  total_filles?: number;
  total_preinscriptions?: number;
  total_animateurs?: number;
  total_classes?: number;
  total_niveaux?: number;
  total_sections?: number;
  taux_assiduite?: number;
  taux_recouvrement?: number;
  taux_reussite?: number;
  candidats_bapteme?: number;
  candidats_communion?: number;
  candidats_confirmation?: number;
  sections?: { nom: string; effectif: number; garcons: number; filles: number }[];
  repartition_sacrements?: { nom: string; total: number; admis: number }[];
}

@Component({
  selector: 'app-doc-rapport-annuel',
  imports: [CommonModule, DecimalPipe, UpperCasePipe],
  templateUrl: './rapport-annuel.component.html',
  styleUrl: './rapport-annuel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RapportAnnuelComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<RapportAnnuelData | null>(null);

  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || 'PAROISSE';
  });

  public readonly diocese = computed(() => {
    const p = this.paroisseConfig();
    return p?.diocese || '';
  });

  public readonly doyenne = computed(() => {
    const p = this.paroisseConfig();
    return p?.doyenne || '';
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
