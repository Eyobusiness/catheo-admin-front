import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Classe, ClasseStatut, CreateClasseDto, UpdateClasseDto } from '../../models/classe.model';
import { Niveau } from '../../../Niveaux/models/niveau.model';
import { Section } from '../../../Sections/models/section.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-classe-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './classe-form-modal.component.html',
  styleUrl: './classe-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClasseFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly classeToEdit = input<Classe | null>(null);
  public readonly sections = input<Section[]>([]);
  public readonly niveaux = input<Niveau[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateClasseDto | UpdateClasseDto>();

  protected readonly selectedSectionId = signal<string>('');

  protected readonly filteredNiveaux = computed(() => {
    const secId = this.selectedSectionId();
    const list = this.niveaux();
    if (!secId) return list;
    return list.filter(n => n.section_id === secId || n.section?.id === secId);
  });

  protected readonly form = new FormGroup({
    section_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    niveau_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    capacite_max: new FormControl<number>(30, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(200)]
    }),
    statut: new FormControl<ClasseStatut>('active', {
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.classeToEdit();
      const isEdit = this.isEditing();
      const allNiveaux = this.niveaux();
      const allSections = this.sections();

      if (open) {
        if (isEdit && item) {
          const itemNiveauId = item.niveau_id || item.niveau?.id || '';
          const foundNiveau = allNiveaux.find(n => n.id === itemNiveauId);
          const secId = foundNiveau?.section_id || foundNiveau?.section?.id || item.niveau?.section_id || item.niveau?.section?.id || (allSections.length > 0 ? allSections[0].id : '');

          this.selectedSectionId.set(secId);

          const currentStatut = String(item.statut || '').trim().toLowerCase();
          const statutVal: ClasseStatut = (currentStatut === 'inactive' || currentStatut === 'inactif' || currentStatut === '0' || currentStatut === 'false') ? 'inactive' : 'active';

          this.form.patchValue({
            section_id: secId,
            niveau_id: itemNiveauId,
            nom: item.nom || '',
            capacite_max: item.capacite_max || 30,
            statut: statutVal
          });
        } else {
          const defaultSectionId = allSections.length > 0 ? allSections[0].id : '';
          this.selectedSectionId.set(defaultSectionId);

          this.form.reset({
            section_id: defaultSectionId,
            niveau_id: '',
            nom: '',
            capacite_max: 30,
            statut: 'active'
          });
        }
      }
    });
  }

  protected onSectionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSectionId = select.value;
    this.selectedSectionId.set(newSectionId);

    const currentNiveauId = this.form.controls.niveau_id.value;
    const currentNiveau = this.niveaux().find(n => n.id === currentNiveauId);
    const matches = currentNiveau && (currentNiveau.section_id === newSectionId || currentNiveau.section?.id === newSectionId);
    if (!matches) {
      this.form.controls.niveau_id.setValue('');
    }
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      this.formSubmitted.emit({
        niveau_id: val.niveau_id,
        nom: val.nom.trim(),
        capacite_max: Number(val.capacite_max) || 30,
        statut: val.statut
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}

