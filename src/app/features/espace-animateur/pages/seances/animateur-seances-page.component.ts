import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnimateurClasseService } from '../../services/animateur-classe.service';
import { SeanceService } from '../../../Presences/services/seance.service';
import { SeanceDto } from '../../../Presences/models/seance.model';
import { ToastService } from '../../../../core/services/toast.service';
import { CloturePeriodeService } from '../../../../core/services/cloture-periode.service';

@Component({
  selector: 'app-animateur-seances-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './animateur-seances-page.component.html',
  styleUrl: './animateur-seances-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurSeancesPageComponent implements OnInit {
  protected readonly classeService = inject(AnimateurClasseService);
  protected readonly seanceService = inject(SeanceService);
  protected readonly toastService = inject(ToastService);
  protected readonly clotureService = inject(CloturePeriodeService);

  protected readonly isLoading = this.seanceService.isLoading;
  protected readonly allSeances = this.seanceService.seances;
  protected readonly classe = this.classeService.classe;
  protected readonly anneePastorale = this.classeService.anneePastorale;

  protected readonly showCreateModal = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  // Filtrer strictement pour ne conserver QUE les séances de la classe de l'animateur
  protected readonly classeSeances = computed(() => {
    const cls = this.classe();
    if (!cls) return [];
    const idStr = String(cls.id || '');
    const uuidStr = String(cls.uuid || '');
    const nomStr = (cls.nom || '').toLowerCase().trim();

    return this.allSeances().filter(s => {
      const sClsId = String(s.classe_id || s.classe?.id || '');
      const sClsUuid = String((s.classe as any)?.uuid || '');
      const sClsNom = (s.classe?.nom || '').toLowerCase().trim();
      return (idStr && (sClsId === idStr || sClsUuid === idStr)) ||
             (uuidStr && (sClsId === uuidStr || sClsUuid === uuidStr)) ||
             (nomStr && sClsNom === nomStr);
    });
  });

  protected readonly seanceForm = new FormGroup({
    titre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    date_seance: new FormControl(new Date().toISOString().substring(0, 10), { nonNullable: true, validators: [Validators.required] }),
    heure_debut: new FormControl('14:30', { nonNullable: true, validators: [Validators.required] }),
    heure_fin: new FormControl('16:00', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('')
  });

  public ngOnInit(): void {
    this.classeService.getMaClasse().subscribe({
      next: () => this.loadSeances(),
      error: () => this.loadSeances()
    });
  }

  protected loadSeances(): void {
    const cls = this.classe();
    const clsId = cls?.uuid || (cls?.id ? String(cls.id) : undefined);
    this.seanceService.getAll(clsId).subscribe();
  }

  protected openCreateModal(): void {
    this.seanceForm.reset({
      titre: '',
      date_seance: new Date().toISOString().substring(0, 10),
      heure_debut: '14:30',
      heure_fin: '16:00',
      description: ''
    });
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  protected submitCreate(): void {
    if (this.seanceForm.invalid) {
      this.seanceForm.markAllAsTouched();
      return;
    }

    const cls = this.classe();
    const annee = this.anneePastorale();
    const raw = this.seanceForm.getRawValue();

    if (this.clotureService.isLocked({ date: raw.date_seance, classeId: cls?.id ? Number(cls.id) : undefined })) {
      this.toastService.warning('Période clôturée', CloturePeriodeService.LOCK_MESSAGE);
      return;
    }

    this.isSubmitting.set(true);
    this.seanceService.create({
      titre: raw.titre.trim(),
      date_seance: raw.date_seance,
      heure_debut: raw.heure_debut,
      heure_fin: raw.heure_fin,
      description: raw.description || undefined,
      classe_id: cls?.id ? String(cls.id) : '',
      annee_catechese_id: annee?.id ? String(annee.id) : ''
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.toastService.success('Séance planifiée', 'La séance a été ajoutée au calendrier.');
        this.loadSeances();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err?.status === 403) {
          const msg = err?.error?.message || CloturePeriodeService.LOCK_MESSAGE;
          this.toastService.error('Action non autorisée', msg);
        }
      }
    });
  }
}
