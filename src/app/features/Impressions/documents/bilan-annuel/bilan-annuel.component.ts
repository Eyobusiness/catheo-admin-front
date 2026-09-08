import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { FicheBilanAnnuelResponseDto } from '../../models/impressions.model';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';

@Component({
  selector: 'app-doc-bilan-annuel',
  imports: [CommonModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './bilan-annuel.component.html',
  styleUrl: './bilan-annuel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BilanAnnuelComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<FicheBilanAnnuelResponseDto | null>(null);

  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly anneePastorale = computed(() => {
    return this.data()?.annee_libelle || this.anneeService.activeAnnee()?.libelle || '';
  });

  public readonly displaySubTitle = computed(() => {
    const d = this.data() as any;
    if (d?.custom_subtitle) return d.custom_subtitle;

    const parts: string[] = [];
    const secNom = d?.section_nom || d?.section?.nom;
    const nivNom = d?.niveau_nom || d?.niveau?.nom;
    const clNom = d?.classe_nom || d?.classe?.nom;
    const anim = d?.animateurs_nom || (Array.isArray(d?.animateurs) && d.animateurs.length > 0 ? d.animateurs.filter(Boolean).join(', ') : '');

    if (clNom && clNom !== 'tous' && clNom !== 'Toutes les classes') {
      if (secNom && secNom !== 'tous' && secNom !== 'Toutes les sections') {
        parts.push(`SECTION : ${secNom.toUpperCase()}`);
      }
      if (nivNom && nivNom !== 'tous' && nivNom !== 'Tous les niveaux') {
        parts.push(`NIVEAU : ${nivNom.toUpperCase()}`);
      }
      parts.push(`CLASSE : ${clNom.toUpperCase()}`);
      if (anim) {
        parts.push(`ANIMATEUR(S) : ${anim.toUpperCase()}`);
      }
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
    const list = this.data()?.deliberations || (this.data() as any)?.lignes || (this.data() as any)?.catechumenes || [];
    const sorted = [...list].sort((a: any, b: any) => {
      const nomA = (a.nom_complet || a.nomPrenoms || `${a.nom || ''} ${a.prenoms || a.prenom || ''}`).trim();
      const nomB = (b.nom_complet || b.nomPrenoms || `${b.nom || ''} ${b.prenoms || b.prenom || ''}`).trim();
      return nomA.localeCompare(nomB, 'fr', { sensitivity: 'base' });
    });
    return sorted.map((st: any, idx: number) => {
      let moy = st.moyenne;
      if (moy === undefined || moy === null || moy === '' || moy === '-') {
        if (st.moyenneGenerale !== undefined && st.moyenneGenerale !== null) {
          moy = `${st.moyenneGenerale} / 20`;
        } else if (st.moyenne_generale !== undefined && st.moyenne_generale !== null) {
          moy = `${st.moyenne_generale} / 20`;
        } else if (st.moyenne_annuelle !== undefined && st.moyenne_annuelle !== null) {
          moy = `${st.moyenne_annuelle} / 20`;
        } else {
          moy = '-';
        }
      } else if (typeof moy === 'number') {
        moy = `${moy} / 20`;
      }

      const pCours = st.presences_cours ?? st.presenceCoursNb ?? st.cours ?? st.presence_cours ?? '-';
      const pMesse = st.presences_messe ?? st.presenceMesse ?? st.messe ?? st.presence_messe ?? '-';
      const pMouv = st.presences_mouvement ?? st.presenceMouvement ?? st.mouvement ?? st.mouvt ?? st.presence_mouvement ?? '-';
      const pCeb = st.presences_ceb ?? st.presenceCEB ?? st.ceb ?? st.presence_ceb ?? '-';
      const dec = st.decision || st.decision_pastorale || '-';

      return {
        ...st,
        num: String(idx + 1).padStart(2, '0'),
        nomPrenoms: (st.nom_complet || st.nomPrenoms || `${st.nom || ''} ${st.prenoms || st.prenom || ''}`).trim(),
        telephone: st.telephone || st.contact || '-',
        moyenne: moy,
        presences_cours: pCours,
        presences_messe: pMesse,
        presences_mouvement: pMouv,
        presences_ceb: pCeb,
        decision: dec
      };
    });
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
