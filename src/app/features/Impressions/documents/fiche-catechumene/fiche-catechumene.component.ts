import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { CatechumeneDto } from '../../../Catechumenes/liste-catechumene/models/catechumene.model';

@Component({
  selector: 'app-doc-fiche-catechumene',
  imports: [CommonModule, DatePipe, UpperCasePipe],
  templateUrl: './fiche-catechumene.component.html',
  styleUrl: './fiche-catechumene.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FicheCatechumeneComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<CatechumeneDto | null>(null);

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

  public readonly doyenne = computed(() => {
    const p = this.paroisseConfig();
    return p?.doyenne || '';
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

  public readonly logoCatechese = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_catechese_url || p?.logo_catechese || '';
  });

  public readonly anneePastorale = computed(() => {
    return this.anneeService.activeAnnee()?.libelle || '';
  });

  public readonly derniereInscription = computed(() => {
    const d = this.data();
    if (!d?.inscriptions_annuelles || d.inscriptions_annuelles.length === 0) return null;
    return d.inscriptions_annuelles[0];
  });

  public readonly classeNom = computed(() => {
    const insc = this.derniereInscription();
    return insc?.classe?.nom || (this.data() as any)?.classe_nom || '-';
  });

  public readonly niveauNom = computed(() => {
    const insc = this.derniereInscription();
    return insc?.niveau?.nom || (this.data() as any)?.niveau_nom || '-';
  });

  public readonly sectionNom = computed(() => {
    const insc = this.derniereInscription();
    return insc?.section?.nom || (this.data() as any)?.section_nom || '-';
  });

  public readonly sessionNom = computed(() => {
    const insc = this.derniereInscription();
    return insc?.session?.nom || insc?.session_nom || (this.data() as any)?.session_nom || '-';
  });

  public readonly cebNom = computed(() => {
    const d = this.data();
    return d?.ceb?.nom || (d as any)?.ceb_nom || '-';
  });

  public readonly parrainNom = computed(() => {
    const d = this.data();
    if (d?.nom_parrain) return d.nom_parrain;
    if (d?.parrains_marraines && d.parrains_marraines.length > 0) {
      return d.parrains_marraines.map(p => p.nom_prenoms || (p as any).nom || '').filter(Boolean).join(', ');
    }
    return '-';
  });
}
