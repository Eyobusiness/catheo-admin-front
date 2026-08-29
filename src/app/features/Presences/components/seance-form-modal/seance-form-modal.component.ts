import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SeanceDto, CreateSeanceDto, UpdateSeanceDto } from '../../models/seance.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { AffectationAnimateurService } from '../../../Organisations/affectation-animateurs/services/affectation-animateur.service';
import { AppDialog } from '../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-seance-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './seance-form-modal.component.html',
  styleUrl: './seance-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeanceFormModalComponent {
  private readonly anneeService = inject(AnneeCatecheseService);
  private readonly affectationService = inject(AffectationAnimateurService);

  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly seanceToEdit = input<SeanceDto | null>(null);
  public readonly classes = input<ClasseDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: CreateSeanceDto | UpdateSeanceDto;
    classe?: ClasseDto;
  }>();

  protected readonly activeAnnee = this.anneeService.activeAnnee;
  protected readonly affectations = this.affectationService.affectations;

  protected readonly form = new FormGroup({
    annee_catechese_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    classe_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    titre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    date_seance: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    heure_debut: new FormControl('08:30', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    heure_fin: new FormControl('10:00', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    description: new FormControl<string | null>(null)
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        return;
      }

      const item = this.seanceToEdit();
      const availableClasses = this.classes();
      const defaultClasse = availableClasses.length > 0 ? availableClasses[0].id : '';
      const activeAnneeId = this.activeAnnee()?.id || (availableClasses.length > 0 ? availableClasses[0].annee_catechese_id : '') || '';

      if (this.isEditing() && item) {
        this.form.setValue({
          annee_catechese_id: item.annee_catechese_id || (item.annee_catechese as any)?.id || activeAnneeId || '',
          classe_id: item.classe_id || item.classe?.id || defaultClasse,
          titre: item.titre || item.titre_lecon || '',
          date_seance: item.date_seance ? item.date_seance.substring(0, 10) : '',
          heure_debut: item.heure_debut || '08:30',
          heure_fin: item.heure_fin || '10:00',
          description: item.description || null
        });
      } else {
        const today = new Date().toISOString().substring(0, 10);
        this.form.reset({
          annee_catechese_id: activeAnneeId || '',
          classe_id: defaultClasse,
          titre: '',
          date_seance: today,
          heure_debut: '14:30',
          heure_fin: '16:00',
          description: null
        });
      }
    }, { allowSignalWrites: true });
  }

  protected getAssignedAnimateurName(): string {
    const classeId = this.form.controls.classe_id.value;
    if (!classeId) return '';
    const selectedClasse = this.classes().find(c => c.id === classeId) as any;
    if (selectedClasse?.animateur) {
      return `${selectedClasse.animateur.nom} ${selectedClasse.animateur.prenoms}`;
    }
    if (selectedClasse?.animateur_nom) {
      return selectedClasse.animateur_nom;
    }
    const match = this.affectations().find(a => a.classe_id === classeId || a.classe?.id === classeId);
    if (match?.animateur) {
      return `${match.animateur.nom} ${match.animateur.prenoms}`;
    }
    return '';
  }

  protected getAssignedAnimateurId(): string | undefined {
    const classeId = this.form.controls.classe_id.value;
    if (!classeId) return undefined;
    const selectedClasse = this.classes().find(c => c.id === classeId) as any;
    if (selectedClasse?.animateur?.id) return selectedClasse.animateur.id;
    const match = this.affectations().find(a => a.classe_id === classeId || a.classe?.id === classeId);
    return match?.animateur_id || match?.animateur?.id;
  }

  protected onClasseChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const classeId = select.value;
    const foundClasse = this.classes().find(c => c.id === classeId);
    if (foundClasse?.annee_catechese_id) {
      this.form.controls.annee_catechese_id.setValue(foundClasse.annee_catechese_id);
    }
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const selectedClasse = this.classes().find(c => c.id === raw.classe_id);
      const anneeId = raw.annee_catechese_id || selectedClasse?.annee_catechese_id || this.activeAnnee()?.id || '';
      const animId = this.getAssignedAnimateurId();

      if (this.isEditing()) {
        const dto: UpdateSeanceDto = {
          annee_catechese_id: anneeId,
          classe_id: raw.classe_id,
          titre: raw.titre,
          description: raw.description || undefined,
          date_seance: raw.date_seance,
          heure_debut: raw.heure_debut,
          heure_fin: raw.heure_fin
        };
        this.formSubmitted.emit({ dto, classe: selectedClasse });
      } else {
        const dto: CreateSeanceDto = {
          annee_catechese_id: anneeId,
          classe_id: raw.classe_id,
          titre: raw.titre,
          description: raw.description || undefined,
          date_seance: raw.date_seance,
          heure_debut: raw.heure_debut,
          heure_fin: raw.heure_fin,
          statut: 'planifiee'
        };
        this.formSubmitted.emit({ dto, classe: selectedClasse });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
