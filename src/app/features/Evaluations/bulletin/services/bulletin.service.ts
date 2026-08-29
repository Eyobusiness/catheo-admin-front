import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BilanAnnuelService } from '../../bilan-annuel/services/bilan-annuel.service';
import { EvaluationService } from '../../evaluation/services/evaluation.service';
import { NotesService } from '../../notes/services/notes.service';

@Injectable({
  providedIn: 'root'
})
export class BulletinService {
  private readonly http = inject(HttpClient);
  public readonly bilanService = inject(BilanAnnuelService);
  public readonly evalService = inject(EvaluationService);
  public readonly notesService = inject(NotesService);

  private readonly baseUrl = `${environment.apiUrl}/bulletins-trimestriels`;
}
