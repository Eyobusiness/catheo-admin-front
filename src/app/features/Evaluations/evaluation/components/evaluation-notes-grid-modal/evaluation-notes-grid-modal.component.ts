import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
  viewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationDto, NotesGridItemDto } from '../../models/evaluation.model';
import { EvaluationService } from '../../services/evaluation.service';
import { ToastService } from '../../../../../core/services/toast.service';

interface LocalGridRow {
  catechumene_id: string;
  matricule: string;
  nom_prenoms: string;
  rawInput: string;
  note_obtenue: number | null;
  appreciation: string;
  isInvalid: boolean;
  errorMessage?: string;
}

@Component({
  selector: 'app-evaluation-notes-grid-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluation-notes-grid-modal.component.html',
  styleUrl: './evaluation-notes-grid-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluationNotesGridModalComponent implements OnInit {
  private readonly evaluationService = inject(EvaluationService);
  private readonly toastService = inject(ToastService);

  public readonly evaluation = input.required<EvaluationDto>();
  public readonly close = output<void>();
  public readonly notesSaved = output<void>();

  public readonly isLoading = signal<boolean>(true);
  public readonly isSubmitting = signal<boolean>(false);
  public readonly searchQuery = signal<string>('');
  public readonly rows = signal<LocalGridRow[]>([]);

  public readonly noteInputs = viewChildren<ElementRef<HTMLInputElement>>('noteInput');

  public readonly bareme = computed(() => {
    const ev = this.evaluation();
    return Number(ev.note_max || ev.bareme || 20);
  });

  public readonly coefficient = computed(() => {
    const ev = this.evaluation();
    return Number(ev.coefficient || 1);
  });

  public readonly totalEleves = computed(() => this.rows().length);

  public readonly saisiesCount = computed(() => {
    return this.rows().filter(r => r.note_obtenue !== null && !r.isInvalid).length;
  });

  public readonly nonEvaluesCount = computed(() => {
    return this.rows().filter(r => r.note_obtenue === null).length;
  });

  public readonly hasValidationErrors = computed(() => {
    return this.rows().some(r => r.isInvalid);
  });

  public readonly filteredRows = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.rows();
    if (!q) return list;
    return list.filter(r =>
      r.nom_prenoms.toLowerCase().includes(q) ||
      (r.matricule && r.matricule.toLowerCase().includes(q))
    );
  });

  public ngOnInit(): void {
    this.loadNotesGrid();
  }

  public loadNotesGrid(): void {
    const ev = this.evaluation();
    if (!ev?.id) return;

    this.isLoading.set(true);
    this.evaluationService.getNotesGrid(ev.id).subscribe({
      next: res => {
        const mapped: LocalGridRow[] = (res.data || []).map(item => {
          const noteVal = item.note_obtenue !== null && item.note_obtenue !== undefined
            ? Number(item.note_obtenue)
            : (item.note !== null && item.note !== undefined ? Number(item.note) : null);

          return {
            catechumene_id: item.catechumene_id,
            matricule: item.matricule || item.code_catechumene || '—',
            nom_prenoms: item.nom_prenoms || `${item.nom || ''} ${item.prenoms || ''}`.trim() || 'Catéchumène',
            rawInput: noteVal !== null ? String(noteVal) : '',
            note_obtenue: noteVal,
            appreciation: item.appreciation || '',
            isInvalid: false
          };
        });

        this.rows.set(mapped);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public onNoteChange(row: LocalGridRow, val: string): void {
    const max = this.bareme();
    const trimmed = val.trim();

    if (trimmed === '') {
      // NOTE VIDE = NON ÉVALUÉ (null), JAMAIS ZÉRO
      row.rawInput = '';
      row.note_obtenue = null;
      row.isInvalid = false;
      row.errorMessage = undefined;
      this.rows.update(list => [...list]);
      return;
    }

    const parsed = Number(trimmed.replace(',', '.'));

    if (isNaN(parsed)) {
      row.rawInput = trimmed;
      row.isInvalid = true;
      row.errorMessage = 'Format invalide';
    } else if (parsed < 0) {
      row.rawInput = trimmed;
      row.isInvalid = true;
      row.errorMessage = 'Note négative impossible';
    } else if (parsed > max) {
      row.rawInput = trimmed;
      row.isInvalid = true;
      row.errorMessage = `Ne peut dépasser ${max}`;
    } else {
      row.rawInput = trimmed;
      row.note_obtenue = parsed;
      row.isInvalid = false;
      row.errorMessage = undefined;
    }

    this.rows.update(list => [...list]);
  }

  public onNoteKeyDown(event: KeyboardEvent, index: number): void {
    const inputs = this.noteInputs();
    if (!inputs || inputs.length === 0) return;

    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = index + 1;
      if (next < inputs.length) {
        inputs[next].nativeElement.focus();
        inputs[next].nativeElement.select();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = index - 1;
      if (prev >= 0) {
        inputs[prev].nativeElement.focus();
        inputs[prev].nativeElement.select();
      }
    }
  }

  public clearNote(row: LocalGridRow): void {
    row.rawInput = '';
    row.note_obtenue = null;
    row.isInvalid = false;
    row.errorMessage = undefined;
    this.rows.update(list => [...list]);
  }

  public submitNotes(): void {
    if (this.hasValidationErrors()) {
      this.toastService.warning('Validation', 'Veuillez corriger les notes invalides avant d\'enregistrer.');
      return;
    }

    const ev = this.evaluation();
    if (!ev?.id) return;

    this.isSubmitting.set(true);

    const payloadNotes = this.rows().map(r => ({
      catechumene_id: r.catechumene_id,
      note_obtenue: r.note_obtenue !== null ? r.note_obtenue : null,
      appreciation: r.appreciation.trim() || null
    }));

    this.evaluationService.saveNotes(ev.id, { notes: payloadNotes }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notesSaved.emit();
        this.close.emit();
      },
      error: err => {
        this.isSubmitting.set(false);
        if (err?.status === 422 && err?.error?.errors) {
          const errList = Object.values(err.error.errors).flat().join(' ');
          this.toastService.error('Erreur de validation (422)', errList);
        } else if (err?.status === 403) {
          this.toastService.error('Accès refusé (403)', 'Vous n\'êtes pas autorisé à modifier les notes de cette classe.');
        }
      }
    });
  }

  public onCancel(): void {
    this.close.emit();
  }
}
