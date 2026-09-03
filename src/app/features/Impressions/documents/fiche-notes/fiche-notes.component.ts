import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { FicheNotesResponseDto } from '../../models/impressions.model';

@Component({
  selector: 'app-doc-fiche-notes',
  imports: [CommonModule, UpperCasePipe],
  templateUrl: './fiche-notes.component.html',
  styleUrl: './fiche-notes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FicheNotesComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<FicheNotesResponseDto | null>(null);

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

  // Logos paroissiaux intacts et préservés
  public readonly logoParoisse = computed(() => {
    return this.data()?.entete?.logo_paroisse_url || this.data()?.entete?.logo_url || this.paroisseConfig()?.logo_paroisse_url || this.paroisseConfig()?.logo_paroisse || '';
  });

  public readonly logoCatechese = computed(() => {
    return this.data()?.entete?.logo_catechese_url || this.paroisseConfig()?.logo_catechese_url || this.paroisseConfig()?.logo_catechese || '';
  });

  // Section, Niveau, Classe et Année Pastorale réelles
  public readonly sectionNom = computed(() => {
    const d = this.data() as any;
    return d?.document?.section_nom || d?.section_nom || '';
  });

  public readonly niveauNom = computed(() => {
    const d = this.data() as any;
    return d?.document?.niveau_nom || d?.niveau_nom || '';
  });

  public readonly classeNom = computed(() => {
    const d = this.data() as any;
    return d?.document?.classe_nom || d?.classe_nom || '';
  });

  public readonly anneePastorale = computed(() => {
    const d = this.data() as any;
    return d?.document?.annee_pastorale || d?.annee_libelle || this.anneeService.activeAnnee()?.libelle || '';
  });

  public readonly evalCols = computed(() => {
    const cols = this.data()?.evaluations_colonnes;
    if (cols && cols.length > 0) return cols;
    return [
      { id: 'eval1', titre: 'ÉVAL 1', type: 'devoir' },
      { id: 'eval2', titre: 'ÉVAL 2', type: 'devoir' },
      { id: 'eval3', titre: 'ÉVAL 3', type: 'examen' }
    ];
  });

  // Liste des catéchumènes réels mappés
  public readonly studentsList = computed(() => {
    const d = this.data() as any;
    const raw: any[] = d?.lignes || d?.catechumenes || [];
    return raw.map((st: any, idx: number) => {
      const nom = st.nom || '';
      const prenom = st.prenom || st.prenoms || '';
      const nomComplet = st.nom_complet || st.nomPrenoms || `${nom} ${prenom}`.trim() || `Catéchumène #${idx + 1}`;
      const mat = st.matricule || st.code_catechumene || `CAT-${String(idx + 1).padStart(3, '0')}`;
      const sexe = st.sexe || '-';
      const phone = st.telephone || st.contact || '-';

      const n1 = st.note_1 !== undefined && st.note_1 !== null && st.note_1 !== '' ? String(st.note_1) : '';
      const n2 = st.note_2 !== undefined && st.note_2 !== null && st.note_2 !== '' ? String(st.note_2) : '';
      const n3 = st.note_3 !== undefined && st.note_3 !== null && st.note_3 !== '' ? String(st.note_3) : '';
      const moy = st.moyenne !== undefined && st.moyenne !== null && st.moyenne !== '' ? String(st.moyenne) : '-';
      const decision = st.decision || st.observation || '';

      return {
        ...st,
        num: st.numero || String(idx + 1).padStart(2, '0'),
        matricule: mat,
        nom_complet: nomComplet,
        sexe,
        telephone: phone,
        note_1: n1,
        note_2: n2,
        note_3: n3,
        moyenne: moy,
        decision
      };
    });
  });

  public getNote(st: any, colId: string, colIndex: number): string {
    if (colIndex === 0 && st.note_1) return st.note_1;
    if (colIndex === 1 && st.note_2) return st.note_2;
    if (colIndex === 2 && st.note_3) return st.note_3;

    if (st.evaluations && st.evaluations[colId] !== undefined && st.evaluations[colId] !== null) {
      const val = st.evaluations[colId];
      return typeof val === 'number' ? val.toFixed(1).replace('.0', '') : String(val);
    }
    return '';
  }
}
