import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

export interface RegistreSacrementData {
  title?: string;
  customTitle?: string;
  sacrement: 'bapteme' | 'communion' | 'confirmation' | 'derogation';
  anneePastorale?: string;
  candidats?: any[];
  exceptions?: any[];
}

@Component({
  selector: 'app-doc-registre-sacrement',
  imports: [
    CommonModule,
    DatePipe,
    HeaderParoissePrintComponent,
    FooterParoissePrintComponent
  ],
  templateUrl: './registre-sacrement.component.html',
  styleUrl: './registre-sacrement.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistreSacrementComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<RegistreSacrementData | null>(null);
  public readonly currentDate = new Date();

  public readonly customTitle = computed(() => {
    const d = this.data();
    if (d?.customTitle) return d.customTitle;
    if (d?.sacrement === 'derogation') return 'REGISTRE PASTORAL DES EXCEPTIONS & DÉROGATIONS';
    if (d?.sacrement === 'communion') return 'REGISTRE PASTORAL DES CANDIDATS À LA PREMIÈRE COMMUNION';
    if (d?.sacrement === 'confirmation') return 'REGISTRE PASTORAL DES CANDIDATS AU SACREMENT DE CONFIRMATION';
    return 'REGISTRE PASTORAL DES CANDIDATS AU SACREMENT DU BAPTÊME';
  });

  public readonly exceptionsList = computed(() => {
    const raw = this.data()?.exceptions || this.data()?.candidats || [];
    return raw.map((exc: any, idx: number) => ({
      ...exc,
      num: idx + 1,
      dateAjout: exc.dateAjout || exc.date_ajout || exc.created_at || '-',
      catechumeneNomComplet: exc.catechumeneNomComplet || exc.nom_complet || `${exc.nom || ''} ${exc.prenoms || exc.prenom || ''}`.trim(),
      section: exc.section || exc.section_nom || '-',
      classe: exc.classe || exc.classe_nom || '-',
      sacrementType: exc.sacrementType || exc.sacrement_type || exc.sacrement || '-',
      motif: exc.motif || 'Décision pastorale',
      autorisePar: exc.autorisePar || exc.autorise_par || 'Le Curé',
      observation: exc.observation || exc.observations || '—'
    }));
  });

  public readonly anneePastorale = computed(() => {
    return this.data()?.anneePastorale || this.anneeService.activeAnnee()?.libelle || '';
  });

  public readonly extraColumnHeader = computed(() => {
    const s = this.data()?.sacrement;
    if (s === 'communion') return 'Paroisse de Baptême';
    if (s === 'confirmation') return 'Parrain / Marraine de Confirmation';
    return 'Parrain / Marraine';
  });

  public readonly candidatsList = computed(() => {
    const raw = this.data()?.candidats || [];
    return raw.map((c: any, idx: number) => {
      const s = this.data()?.sacrement;
      let extra = '';
      if (s === 'communion') {
        extra = c.baptemeRecord?.lieu || c.paroisse_bapteme || 'Paroisse C.I.M.';
      } else if (s === 'confirmation') {
        extra = c.confirmationRecord?.parrain || c.parrain || 'À renseigner';
      } else {
        extra = c.baptemeRecord?.parrain || c.parrain || 'À renseigner';
      }

      let statutLabel = 'En attente';
      if (s === 'communion') {
        statutLabel = (c.isPremiereCommunion || c.est_premiere_communion) ? 'Reçue ✓' : 'En attente';
      } else if (s === 'confirmation') {
        statutLabel = (c.isConfirme || c.est_confirme) ? 'Confirmé ✓' : 'En attente';
      } else {
        statutLabel = (c.isBaptise || c.est_baptise) ? 'Baptisé ✓' : 'En attente';
      }

      return {
        ...c,
        num: idx + 1,
        matricule: c.matricule || '-',
        nomPrenoms: (c.nom_complet || `${c.nom || ''} ${c.prenoms || c.prenom || ''}`).trim(),
        telephone: c.telephone || c.contact || '-',
        section: c.section || c.section_nom || '-',
        classe: c.classe || c.classe_nom || '-',
        extraField: extra,
        statutLabel
      };
    });
  });
}
