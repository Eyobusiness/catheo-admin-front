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
import { FormsModule } from '@angular/forms';
import { ClasseMoyennesResponse, EleveMoyenneItemDto } from '../../models/evaluation.model';
import { EvaluationService } from '../../services/evaluation.service';

@Component({
  selector: 'app-classe-moyennes-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './classe-moyennes-view.component.html',
  styleUrl: './classe-moyennes-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClasseMoyennesViewComponent implements OnInit {
  private readonly evaluationService = inject(EvaluationService);

  public readonly classeId = input.required<string>();
  public readonly classeName = input<string>('');
  public readonly anneeCatecheseId = input<string>('');

  public readonly viewCatechumeneSynthese = output<string>(); // emits catechumene_id

  public readonly isLoading = signal<boolean>(true);
  public readonly moyennesData = signal<ClasseMoyennesResponse | null>(null);
  public readonly searchQuery = signal<string>('');

  public readonly statistiques = computed(() => {
    return this.moyennesData()?.statistiques;
  });

  public readonly eleves = computed(() => {
    return this.moyennesData()?.eleves || [];
  });

  public readonly evaluationsList = computed(() => {
    return this.moyennesData()?.evaluations || [];
  });

  public readonly filteredEleves = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.eleves();
    if (!q) return list;
    return list.filter(e =>
      e.nom_prenoms.toLowerCase().includes(q) ||
      (e.matricule && e.matricule.toLowerCase().includes(q))
    );
  });

  public ngOnInit(): void {
    this.loadMoyennes();
  }

  public loadMoyennes(): void {
    const cid = this.classeId();
    if (!cid) return;

    this.isLoading.set(true);
    this.evaluationService.getClassAverages(cid, this.anneeCatecheseId()).subscribe({
      next: res => {
        this.moyennesData.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public onSelectEleve(eleve: EleveMoyenneItemDto): void {
    this.viewCatechumeneSynthese.emit(eleve.catechumene_id);
  }
}
