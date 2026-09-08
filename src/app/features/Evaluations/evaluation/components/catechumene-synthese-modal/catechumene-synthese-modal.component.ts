import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatechumeneSyntheseResponse } from '../../models/evaluation.model';
import { EvaluationService } from '../../services/evaluation.service';

@Component({
  selector: 'app-catechumene-synthese-modal',
  imports: [CommonModule],
  templateUrl: './catechumene-synthese-modal.component.html',
  styleUrl: './catechumene-synthese-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatechumeneSyntheseModalComponent implements OnInit {
  private readonly evaluationService = inject(EvaluationService);

  public readonly catechumeneId = input.required<string>();
  public readonly anneeCatecheseId = input<string>('');
  public readonly close = output<void>();

  public readonly isLoading = signal<boolean>(true);
  public readonly synthese = signal<CatechumeneSyntheseResponse | null>(null);

  public ngOnInit(): void {
    const cid = this.catechumeneId();
    if (!cid) return;

    this.isLoading.set(true);
    this.evaluationService.getCatechumeneSynthesis(cid, this.anneeCatecheseId()).subscribe({
      next: res => {
        this.synthese.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public onCancel(): void {
    this.close.emit();
  }
}
