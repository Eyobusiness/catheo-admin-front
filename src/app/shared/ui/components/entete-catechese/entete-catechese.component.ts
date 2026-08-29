import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../../features/Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

@Component({
  selector: 'app-entete-catechese',
  imports: [CommonModule, UpperCasePipe],
  templateUrl: './entete-catechese.component.html',
  styleUrl: './entete-catechese.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnteteCatecheseComponent implements OnInit {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  // Configuration signal from backend
  public readonly paroisseConfig = this.configService.paroisseConfig;

  // Optional custom inputs for any document / print sheet
  public readonly titreDocument = input<string>('');
  public readonly sousTitre = input<string>('');
  public readonly anneePastorale = input<string>('');
  public readonly classeNom = input<string>('');
  public readonly showBorder = input<boolean>(true);

  public ngOnInit(): void {
    if (!this.paroisseConfig()?.nom_paroisse && !this.paroisseConfig()?.nom) {
      this.configService.getParoisseConfig().subscribe();
    }
  }

  // Logo Paroisse (Haut à gauche)
  public readonly logoParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
  });

  // Logo Catéchèse (Haut à droite)
  public readonly logoCatechese = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_catechese_url || p?.logo_catechese || '';
  });

  // Nom de la Paroisse
  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || 'PAROISSE COEUR IMMACULÉ DE MARIE';
  });

  // Diocèse
  public readonly diocese = computed(() => {
    const p = this.paroisseConfig();
    return p?.diocese || 'ARCHIDIOCÈSE D\'ABIDJAN';
  });

  // Doyenné
  public readonly doyenne = computed(() => {
    const p = this.paroisseConfig();
    return p?.doyenne || 'VICARIAT ÉPISCOPAL';
  });

  // Localisation : Commune ou Quartier - Adresse
  public readonly localisation = computed(() => {
    const p = this.paroisseConfig();
    const parts: string[] = [];

    const zone = p?.commune || p?.ville || '';
    const adresse = p?.adresse || '';

    if (zone && adresse) {
      parts.push(`${zone} - ${adresse}`);
    } else if (zone) {
      parts.push(zone);
    } else if (adresse) {
      parts.push(adresse);
    } else {
      parts.push('Abidjan - Côte d\'Ivoire');
    }

    return parts.join(' • ');
  });

  // Téléphone / Contact
  public readonly telephone = computed(() => {
    const p = this.paroisseConfig();
    return p?.telephone || '';
  });

  // Année pastorale active par défaut
  public readonly displayAnnee = computed(() => {
    if (this.anneePastorale()) return this.anneePastorale();
    const active = this.anneeService.activeAnnee();
    return active?.libelle || '2026-2027';
  });
}
