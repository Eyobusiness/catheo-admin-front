import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EvaluationService } from '../../../Evaluations/evaluation/services/evaluation.service';
import { EvaluationDto, NotesGridItemDto } from '../../../Evaluations/evaluation/models/evaluation.model';
import { AnimateurClasseService } from '../../services/animateur-classe.service';
import { ToastService } from '../../../../core/services/toast.service';

interface SaisieNoteRow {
  catechumene_id: string;
  matricule?: string;
  nom: string;
  prenoms: string;
  sexe?: string;
  note: number | null;
  appreciation?: string;
  error?: string | null;
}

@Component({
  selector: 'app-animateur-evaluation-notes-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './animateur-evaluation-notes-page.component.html',
  styleUrl: './animateur-evaluation-notes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurEvaluationNotesPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly evaluationService = inject(EvaluationService);
  private readonly classeService = inject(AnimateurClasseService);
  private readonly toastService = inject(ToastService);

  protected readonly evaluationId = signal<string>('');
  protected readonly evaluation = signal<EvaluationDto | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly isSaving = signal<boolean>(false);
  protected readonly rows = signal<SaisieNoteRow[]>([]);

  protected readonly bareme = computed(() => this.evaluation()?.bareme || 20);

  protected readonly statsSaisie = computed(() => {
    const list = this.rows();
    const total = list.length;
    const notesEvaluees = list.filter(r => r.note !== null && !isNaN(r.note));
    return {
      total,
      evalues: notesEvaluees.length,
      nonEvalues: total - notesEvaluees.length
    };
  });

  public ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('uuid') || '';
    this.evaluationId.set(id);

    if (id) {
      this.loadNotesGrid(id);
    }
  }

  protected loadNotesGrid(uuid: string): void {
    this.isLoading.set(true);

    this.evaluationService.getNotesGrid(uuid).subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.evaluation) {
          this.evaluation.set(res.evaluation);
        }

        const items: NotesGridItemDto[] = res.data || (res as any).notes || [];
        const cats = this.classeService.catechumenes();

        if (items.length > 0) {
          this.rows.set(
            items.map((item: NotesGridItemDto) => ({
              catechumene_id: String(item.catechumene_id || item.catechumeneId),
              matricule: item.matricule || item.code_catechumene,
              nom: item.nom || item.nom_prenoms || '',
              prenoms: item.prenoms || '',
              sexe: 'M',
              note: item.note_obtenue ?? item.note ?? null,
              appreciation: item.appreciation || '',
              error: null
            }))
          );
        } else {
          // Si aucune note n'a encore été créée, mapper sur les catéchumènes de la classe
          this.rows.set(
            cats.map(c => ({
              catechumene_id: String(c.id),
              matricule: c.matricule,
              nom: c.nom,
              prenoms: c.prenoms,
              sexe: c.sexe,
              note: null,
              appreciation: '',
              error: null
            }))
          );
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  protected onNoteInput(row: SaisieNoteRow, valStr: string): void {
    const trimmed = valStr.trim();
    if (trimmed === '') {
      row.note = null;
      row.error = null;
      this.rows.update(list => [...list]);
      return;
    }

    const val = Number(trimmed);
    const max = this.bareme();

    if (isNaN(val)) {
      row.error = 'Nombre invalide';
    } else if (val < 0) {
      row.error = 'Ne peut être négatif';
    } else if (val > max) {
      row.error = `Max ${max}`;
    } else {
      row.note = val;
      row.error = null;
    }

    this.rows.update(list => [...list]);
  }

  protected saveNotes(): void {
    const uuid = this.evaluationId();
    if (!uuid) return;

    // Vérifier les erreurs de saisie
    const hasErrors = this.rows().some(r => !!r.error);
    if (hasErrors) {
      this.toastService.error('Erreur de saisie', 'Veuillez corriger les notes invalides avant d\'enregistrer.');
      return;
    }

    const payload = {
      notes: this.rows().map(r => ({
        catechumene_id: r.catechumene_id,
        note: r.note,
        appreciation: r.appreciation || undefined
      }))
    };

    this.isSaving.set(true);
    this.evaluationService.saveNotes(uuid, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }
}
