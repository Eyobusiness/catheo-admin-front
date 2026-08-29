import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  CampagnePreinscriptionDto,
  CreateCampagnePreinscriptionDto,
  UpdateCampagnePreinscriptionDto,
  StatutCampagne
} from '../../models/campagne.model';
import { AnneeCatecheseDto } from '../../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { Section } from '../../../../Organisations/Sections/models/section.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-campagne-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './campagne-form-modal.component.html',
  styleUrl: './campagne-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly campagneToEdit = input<CampagnePreinscriptionDto | null>(null);
  public readonly annees = input<AnneeCatecheseDto[]>([]);
  public readonly sections = input<Section[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: CreateCampagnePreinscriptionDto | UpdateCampagnePreinscriptionDto;
    annee?: AnneeCatecheseDto;
  }>();

  protected readonly selectedSections = signal<string[]>([]);

  protected readonly form = new FormGroup({
    annee_catechese_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    titre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    date_debut: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    date_fin: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    statut: new FormControl<StatutCampagne>('ouverte', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    description: new FormControl('', {
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        return;
      }
      const item = this.campagneToEdit();
      const currentAnnee = this.annees().find(a => a.est_active) || (this.annees().length > 0 ? this.annees()[0] : null);

      if (this.isEditing() && item) {
        this.form.setValue({
          annee_catechese_id: item.annee_catechese?.id || (currentAnnee?.id || ''),
          titre: item.titre,
          date_debut: item.date_debut ? item.date_debut.substring(0, 10) : '',
          date_fin: item.date_fin ? item.date_fin.substring(0, 10) : '',
          statut: item.statut || (item.est_ouverte ? 'ouverte' : 'fermee'),
          description: item.description || ''
        });
        this.selectedSections.set(item.sections_autorisees || []);
      } else {
        const today = new Date().toISOString().substring(0, 10);
        const nextMonth = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
        this.form.reset({
          annee_catechese_id: currentAnnee ? currentAnnee.id : '',
          titre: '',
          date_debut: today,
          date_fin: nextMonth,
          statut: 'ouverte',
          description: ''
        });
        this.selectedSections.set([]);
      }
    }, { allowSignalWrites: true });
  }

  protected toggleSection(sectionNom: string): void {
    const current = this.selectedSections();
    if (current.includes(sectionNom)) {
      this.selectedSections.set(current.filter(s => s !== sectionNom));
    } else {
      this.selectedSections.set([...current, sectionNom]);
    }
  }

  protected isSectionSelected(sectionNom: string): boolean {
    return this.selectedSections().includes(sectionNom);
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const selectedAnnee = this.annees().find(a => a.id === raw.annee_catechese_id);

      if (this.isEditing()) {
        const dto: UpdateCampagnePreinscriptionDto = {
          titre: raw.titre,
          date_debut: raw.date_debut,
          date_fin: raw.date_fin,
          statut: raw.statut,
          description: raw.description || undefined,
          sections_autorisees: this.selectedSections()
        };
        this.formSubmitted.emit({ dto, annee: selectedAnnee });
      } else {
        const dto: CreateCampagnePreinscriptionDto = {
          annee_catechese_id: raw.annee_catechese_id,
          titre: raw.titre,
          date_debut: raw.date_debut,
          date_fin: raw.date_fin,
          statut: raw.statut,
          description: raw.description || undefined,
          sections_autorisees: this.selectedSections()
        };
        this.formSubmitted.emit({ dto, annee: selectedAnnee });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
