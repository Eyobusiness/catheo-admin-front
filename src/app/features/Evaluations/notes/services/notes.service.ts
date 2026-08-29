import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { CatechumeneNote } from '../models/notes.model';
import { environment } from '../../../../environments/environment';
import { EvaluationService } from '../../evaluation/services/evaluation.service';
import { InscriptionAnnuelleService } from '../../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { ToastService } from '../../../../core/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private readonly http = inject(HttpClient);
  public readonly evalService = inject(EvaluationService);
  public readonly inscriptionService = inject(InscriptionAnnuelleService);
  public readonly classeService = inject(ClasseService);
  public readonly anneeService = inject(AnneeCatecheseService);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/evaluations`;

  public readonly notes = signal<CatechumeneNote[]>([]);
  public readonly isSaving = signal<boolean>(false);

  public saveNotes(
    evaluationId: string,
    updatedNotes: { catechumeneId?: string; catechumene_id?: string; note?: number | null; note_obtenue?: number | null; appreciation?: string }[]
  ): Observable<any> {
    this.isSaving.set(true);

    const payloadNotes = updatedNotes.map(n => ({
      catechumene_id: n.catechumene_id || n.catechumeneId || '',
      note_obtenue: n.note_obtenue !== undefined ? n.note_obtenue : n.note,
      note: n.note !== undefined ? n.note : n.note_obtenue,
      appreciation: n.appreciation || ''
    }));

    return this.http.post<any>(`${this.baseUrl}/${evaluationId}/notes`, { notes: payloadNotes }).pipe(
      tap(() => {
        this.isSaving.set(false);
        this.toastService.success('Succès', 'Les notes ont été enregistrées avec succès.');
      }),
      catchError(err => {
        this.isSaving.set(false);
        this.toastService.error('Erreur', 'Impossible d\'enregistrer les notes sur le serveur.');
        return throwError(() => err);
      })
    );
  }

  public getEvaluationDetails(evaluationId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${evaluationId}`).pipe(
      catchError(err => {
        return throwError(() => err);
      })
    );
  }
}
