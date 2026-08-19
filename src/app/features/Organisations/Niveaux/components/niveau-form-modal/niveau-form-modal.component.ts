import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateNiveauDto, Niveau, UpdateNiveauDto } from '../../models/niveau.model';
import { Section } from '../../../Sections/models/section.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-niveau-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './niveau-form-modal.component.html',
  styleUrl: './niveau-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NiveauFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly niveauToEdit = input<Niveau | null>(null);
  public readonly sections = input<Section[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateNiveauDto | UpdateNiveauDto>();

  protected readonly form = new FormGroup({
    section_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    description: new FormControl('', {
      nonNullable: true
    }),
    ordre_affichage: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.min(1)]
    }),
    statut: new FormControl<'actif' | 'inactif'>('actif', {
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      const item = this.niveauToEdit();
      const availableSections = this.sections();
      const defaultSectionId = availableSections.length > 0 ? availableSections[0].id : '';

      if (this.isEditing() && item) {
        this.form.setValue({
          section_id: item.section_id || item.section?.id || defaultSectionId,
          nom: item.nom,
          description: item.description || '',
          ordre_affichage: item.ordre_affichage ?? item.ordre ?? 1,
          statut: (item.statut_code || (String(item.statut).toLowerCase() === 'inactif' ? 'inactif' : 'actif')) as 'actif' | 'inactif'
        });
      } else {
        this.form.reset({
          section_id: defaultSectionId,
          nom: '',
          description: '',
          ordre_affichage: 1,
          statut: 'actif'
        });
      }
    });
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      this.formSubmitted.emit({
        section_id: val.section_id,
        nom: val.nom,
        description: val.description || undefined,
        ordre_affichage: val.ordre_affichage,
        statut: val.statut
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
