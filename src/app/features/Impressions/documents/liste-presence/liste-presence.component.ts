import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { ListePresenceResponseDto } from '../../models/impressions.model';

@Component({
  selector: 'app-doc-liste-presence',
  imports: [CommonModule, UpperCasePipe],
  templateUrl: './liste-presence.component.html',
  styleUrl: './liste-presence.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListePresenceComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<ListePresenceResponseDto | null>(null);

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

  public readonly seancesDates = computed(() => {
    const dates = this.data()?.seances_dates;
    if (dates && dates.length > 0) return dates;
    return [
      { id: 's1', numero: 1, date: '', label: 'Séance 1' },
      { id: 's2', numero: 2, date: '', label: 'Séance 2' },
      { id: 's3', numero: 3, date: '', label: 'Séance 3' },
      { id: 's4', numero: 4, date: '', label: 'Séance 4' },
      { id: 's5', numero: 5, date: '', label: 'Séance 5' },
      { id: 's6', numero: 6, date: '', label: 'Séance 6' },
      { id: 's7', numero: 7, date: '', label: 'Séance 7' },
      { id: 's8', numero: 8, date: '', label: 'Séance 8' }
    ];
  });

  public readonly studentsList = computed(() => {
    const list = this.data()?.catechumenes || [];
    return list.map((st, idx) => ({
      ...st,
      num: String(idx + 1).padStart(2, '0')
    }));
  });

  public readonly animateursLabel = computed(() => {
    const anims = this.data()?.animateurs;
    if (anims && anims.length > 0) return anims.join(', ');
    return 'Catéchistes de la classe';
  });

  public getPresence(st: any, dateId: string): string {
    if (!st.presences) return '';
    const val = st.presences[dateId];
    if (!val) return '';
    return val; // 'P' | 'A' | 'E'
  }
}
