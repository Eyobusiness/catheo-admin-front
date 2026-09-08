import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluationDto, DetailNoteItemDto } from '../../models/evaluation.model';
import { EvaluationService } from '../../services/evaluation.service';

@Component({
  selector: 'app-evaluation-detail-modal',
  imports: [CommonModule],
  templateUrl: './evaluation-detail-modal.component.html',
  styleUrl: './evaluation-detail-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluationDetailModalComponent implements OnInit {
  private readonly evaluationService = inject(EvaluationService);

  public readonly evaluation = input.required<EvaluationDto>();
  public readonly close = output<void>();
  public readonly openNotesGrid = output<EvaluationDto>();

  public readonly isLoading = signal<boolean>(true);
  public readonly fullEvaluation = signal<EvaluationDto | null>(null);
  public readonly notesList = signal<DetailNoteItemDto[]>([]);

  public readonly currentEval = computed(() => {
    return this.fullEvaluation() || this.evaluation();
  });

  public readonly bareme = computed(() => {
    return Number(this.currentEval()?.note_max || this.currentEval()?.bareme || 20);
  });

  public ngOnInit(): void {
    const ev = this.evaluation();
    if (!ev?.id) return;

    this.isLoading.set(true);

    // Charge à la fois les détails complets et la liste des notes
    this.evaluationService.getById(ev.id).subscribe({
      next: detailed => {
        this.fullEvaluation.set(detailed);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });

    this.evaluationService.getNotes(ev.id).subscribe({
      next: notes => {
        this.notesList.set(notes);
      },
      error: () => {}
    });
  }

  public onGoToNotes(): void {
    this.openNotesGrid.emit(this.currentEval());
  }

  public onCancel(): void {
    this.close.emit();
  }
}
