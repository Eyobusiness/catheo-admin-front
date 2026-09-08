import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { SuiviSacramentalResponseDto } from '../../models/impressions.model';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';

@Component({
  selector: 'app-doc-suivi-sacramental',
  imports: [CommonModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './suivi-sacramental.component.html',
  styleUrl: './suivi-sacramental.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuiviSacramentalComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<SuiviSacramentalResponseDto | null>(null);

  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly anneePastorale = computed(() => {
    return this.data()?.annee_libelle || this.anneeService.activeAnnee()?.libelle || '';
  });

  public readonly documentTitle = computed(() => {
    const d = this.data() as any;
    if (d?.custom_title) return d.custom_title;
    const s = (d?.sacrement || '').toLowerCase();
    if (s.includes('bap')) return 'FICHE DE SUIVI DES CANDIDATS AU BAPTÊME';
    if (s.includes('com')) return 'FICHE DE SUIVI DES CANDIDATS À LA PREMIÈRE COMMUNION';
    if (s.includes('conf')) return 'FICHE DE SUIVI DES CANDIDATS À LA CONFIRMATION';
    return 'FICHE DE SUIVI SACRAMENTEL';
  });

  public readonly displaySubTitle = computed(() => {
    const d = this.data() as any;
    if (d?.custom_subtitle) return d.custom_subtitle;

    const parts: string[] = [];
    const secNom = d?.section_nom || d?.section?.nom;
    const nivNom = d?.niveau_nom || d?.niveau?.nom;
    const clNom = d?.classe_nom || d?.classe?.nom;

    if (clNom && clNom !== 'tous' && clNom !== 'Toutes les classes') {
      if (secNom && secNom !== 'tous' && secNom !== 'Toutes les sections') {
        parts.push(`SECTION : ${secNom.toUpperCase()}`);
      }
      if (nivNom && nivNom !== 'tous' && nivNom !== 'Tous les niveaux') {
        parts.push(`NIVEAU : ${nivNom.toUpperCase()}`);
      }
      parts.push(`CLASSE : ${clNom.toUpperCase()}`);
      return parts.join('   •   ');
    }

    if (nivNom && nivNom !== 'tous' && nivNom !== 'Tous les niveaux') {
      if (secNom && secNom !== 'tous' && secNom !== 'Toutes les sections') {
        parts.push(`SECTION : ${secNom.toUpperCase()}`);
      }
      parts.push(`NIVEAU : ${nivNom.toUpperCase()}`);
      parts.push('TOUTES LES CLASSES');
      return parts.join('   •   ');
    }

    if (secNom && secNom !== 'tous' && secNom !== 'Toutes les sections') {
      return `SECTION : ${secNom.toUpperCase()}   •   TOUTES LES CLASSES`;
    }

    return 'TOUTES LES CLASSES';
  });

  public readonly studentsList = computed(() => {
    const list = this.data()?.candidats || (this.data() as any)?.catechumenes || (this.data() as any)?.lignes || [];
    const sorted = [...list].sort((a: any, b: any) => {
      const nomA = (a.nom_complet || a.nomPrenoms || `${a.nom || ''} ${a.prenoms || a.prenom || ''}`).trim();
      const nomB = (b.nom_complet || b.nomPrenoms || `${b.nom || ''} ${b.prenoms || b.prenom || ''}`).trim();
      return nomA.localeCompare(nomB, 'fr', { sensitivity: 'base' });
    });
    return sorted.map((c, idx) => ({
      ...c,
      num: String(idx + 1).padStart(2, '0'),
      nomPrenoms: (c.nom_complet || c.nomPrenoms || `${c.nom || ''} ${c.prenoms || c.prenom || ''}`).trim(),
      telephone: c.telephone || c.contact || '-'
    }));
  });

  public readonly emptyPaddingRows = computed(() => {
    const currentCount = this.studentsList().length;
    const minRows = 12;
    if (currentCount >= minRows) return [];
    const needed = minRows - currentCount;
    const rows = [];
    for (let i = 0; i < needed; i++) {
      rows.push({
        num: String(currentCount + i + 1).padStart(2, '0')
      });
    }
    return rows;
  });
}
