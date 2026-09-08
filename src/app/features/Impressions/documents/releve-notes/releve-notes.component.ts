import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnteteCatecheseComponent } from '../../../../shared/ui/components/entete-catechese/entete-catechese.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';
import { ClasseMoyennesResponse, EleveMoyenneItemDto } from '../../../Evaluations/evaluation/models/evaluation.model';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

@Component({
  selector: 'app-doc-releve-notes',
  imports: [CommonModule, EnteteCatecheseComponent, FooterParoissePrintComponent],
  templateUrl: './releve-notes.component.html',
  styleUrl: './releve-notes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReleveNotesComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<ClasseMoyennesResponse | null>(null);
  public readonly activeAnnee = this.anneeService.activeAnnee;

  public readonly classeNom = computed(() => {
    return this.data()?.classe?.nom || '';
  });

  public readonly sectionNom = computed(() => {
    return this.data()?.classe?.section || this.data()?.classe?.session || '—';
  });

  public readonly niveauNom = computed(() => {
    return this.data()?.classe?.niveau || '—';
  });

  public readonly anneeLibelle = computed(() => {
    return this.activeAnnee()?.libelle || this.data()?.classe?.annee || 'En cours';
  });

  public getEleveNoteForEval(eleve: EleveMoyenneItemDto, evalId: string): string {
    if (!eleve.details_notes || eleve.details_notes.length === 0) return '—';
    const n = eleve.details_notes.find(item => item.evaluation_id === evalId);
    if (!n || n.note_obtenue === null || n.note_obtenue === undefined) return '—';
    return `${n.note_obtenue}`;
  }
}
