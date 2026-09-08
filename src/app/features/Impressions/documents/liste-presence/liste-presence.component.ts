import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { ListePresenceResponseDto } from '../../models/impressions.model';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';

@Component({
  selector: 'app-doc-liste-presence',
  imports: [CommonModule, UpperCasePipe, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './liste-presence.component.html',
  styleUrl: './liste-presence.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListePresenceComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<ListePresenceResponseDto | null>(null);

  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly anneePastorale = computed(() => {
    return this.data()?.annee_libelle || this.anneeService.activeAnnee()?.libelle || '';
  });

  public readonly displayClasseTitle = computed(() => {
    const d = this.data();
    if (d?.classe_nom) return d.classe_nom.toUpperCase();
    if (d?.niveau_nom) return `NIVEAU : ${d.niveau_nom.toUpperCase()}`;
    if (d?.section_nom) return `SECTION : ${d.section_nom.toUpperCase()}`;
    return 'TOUTES LES CLASSES';
  });

  public readonly jourRencontre = computed(() => {
    return (this.data()?.jour_rencontre || 'Samedi').toUpperCase();
  });

  public readonly seancesDates = computed(() => {
    const dates = this.data()?.seances_dates;
    if (dates && dates.length > 0) {
      return dates.map((d: any, idx: number) => ({
        id: d.id || `s${idx + 1}`,
        shortDate: d.shortDate || d.label || d.date || `S${idx + 1}`
      }));
    }

    // Par défaut, générer les 12 dates exactes du samedi (04/10 au 20/12)
    const count = (this.data() as any)?.nb_seances || 12;
    const base = new Date('2025-10-04');
    const result: { id: string; shortDate: string }[] = [];
    for (let i = 0; i < count; i++) {
      const current = new Date(base);
      current.setDate(base.getDate() + (i * 7));
      const day = String(current.getDate()).padStart(2, '0');
      const month = String(current.getMonth() + 1).padStart(2, '0');
      result.push({
        id: `s${i + 1}`,
        shortDate: `${day}/${month}`
      });
    }
    return result;
  });

  public readonly studentsList = computed(() => {
    const list = this.data()?.catechumenes || (this.data() as any)?.lignes || [];
    const sorted = [...list].sort((a: any, b: any) => {
      const nomA = (a.nom_complet || a.nomPrenoms || `${a.nom || ''} ${a.prenoms || a.prenom || ''}`).trim();
      const nomB = (b.nom_complet || b.nomPrenoms || `${b.nom || ''} ${b.prenoms || b.prenom || ''}`).trim();
      return nomA.localeCompare(nomB, 'fr', { sensitivity: 'base' });
    });
    return sorted.map((st, idx) => ({
      ...st,
      num: String(idx + 1).padStart(2, '0')
    }));
  });

  public readonly animateursLabel = computed(() => {
    const anims = this.data()?.animateurs;
    if (Array.isArray(anims) && anims.length > 0) return anims.filter(Boolean).join(', ');
    if (typeof anims === 'string' && anims) return anims;
    return '';
  });
}
