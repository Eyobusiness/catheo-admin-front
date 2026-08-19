import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Calendrier, CreateCalendrierDto, UpdateCalendrierDto } from '../../models/calendrier.model';
import { AnneeCatechese } from '../../../AnneesPastorales/models/annee-catechese.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-calendrier-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './calendrier-form-modal.component.html',
  styleUrl: './calendrier-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendrierFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly eventToEdit = input<Calendrier | null>(null);
  public readonly defaultDate = input<string>('');
  public readonly annees = input<AnneeCatechese[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: CreateCalendrierDto | UpdateCalendrierDto;
    anneeLibelle?: string;
  }>();

  protected readonly form = new FormGroup({
    titre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    type: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    date: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    heure_debut: new FormControl('', { nonNullable: true }),
    heure_fin: new FormControl('', { nonNullable: true }),
    lieu: new FormControl('', { nonNullable: true }),
    cible_type: new FormControl('Tous', { nonNullable: true }),
    annee_catechese_id: new FormControl('', { nonNullable: true }),
    statut: new FormControl<'Planifié' | 'Réalisé' | 'Annulé'>('Planifié', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.eventToEdit();
      const isEdit = this.isEditing();
      const availableAnnees = this.annees();
      const activeAnnee = availableAnnees.find(a => a.est_active);
      const defaultAnneeId = activeAnnee ? activeAnnee.id : (availableAnnees[0]?.id || '');

      if (open) {
        if (isEdit && item) {
          this.form.setValue({
            titre: item.titre,
            type: item.type || '',
            date: item.date ? item.date.split('T')[0].split(' ')[0] : '',
            heure_debut: item.heure_debut || '',
            heure_fin: item.heure_fin || '',
            lieu: item.lieu || '',
            cible_type: item.cible_type || 'Tous',
            annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id || defaultAnneeId,
            statut: item.statut || 'Planifié',
            description: item.description || ''
          });
        } else {
          this.form.reset({
            titre: '',
            type: '',
            date: this.defaultDate() || new Date().toISOString().split('T')[0],
            heure_debut: '09:00',
            heure_fin: '12:00',
            lieu: 'Paroisse CIM',
            cible_type: 'Tous',
            annee_catechese_id: defaultAnneeId,
            statut: 'Planifié',
            description: ''
          });
        }
      }
    });
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const anneeObj = this.annees().find(a => a.id === val.annee_catechese_id);
      this.formSubmitted.emit({
        dto: {
          titre: val.titre,
          type: val.type,
          date: val.date,
          heure_debut: val.heure_debut || undefined,
          heure_fin: val.heure_fin || undefined,
          lieu: val.lieu || undefined,
          cible_type: val.cible_type,
          annee_catechese_id: val.annee_catechese_id || undefined,
          statut: val.statut,
          description: val.description || undefined
        },
        anneeLibelle: anneeObj?.libelle
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}

