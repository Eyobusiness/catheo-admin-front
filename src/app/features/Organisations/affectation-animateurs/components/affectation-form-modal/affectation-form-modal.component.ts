import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AffectationAnimateur,
  CreateAffectationAnimateurDto,
  UpdateAffectationAnimateurDto
} from '../../models/affectation-animateur.model';
import { Animateur } from '../../../Animateurs/models/animateur.model';
import { Classe } from '../../../Classe/models/classe.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-affectation-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './affectation-form-modal.component.html',
  styleUrl: './affectation-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffectationFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly affectationToEdit = input<AffectationAnimateur | null>(null);
  public readonly animateurs = input<Animateur[]>([]);
  public readonly classes = input<Classe[]>([]);
  public readonly existingAffectations = input<AffectationAnimateur[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: CreateAffectationAnimateurDto | UpdateAffectationAnimateurDto;
    animateurLabel: string;
    classeLabel: string;
  }>();

  protected readonly availableAnimateurs = computed(() => {
    const allAnim = this.animateurs();
    const existing = this.existingAffectations();
    const isEdit = this.isEditing();
    const currentEdit = this.affectationToEdit();
    const currentEditAnimId = currentEdit?.animateur_id || currentEdit?.animateur?.id;

    const assignedIds = new Set(
      existing
        .map(a => a.animateur_id || a.animateur?.id)
        .filter((id): id is string => !!id && (!isEdit || id !== currentEditAnimId))
    );

    return allAnim.filter(anim => !assignedIds.has(anim.id));
  });

  protected readonly form = new FormGroup({
    animateur_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    classe_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    role: new FormControl<string>('principal', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.affectationToEdit();
      const isEdit = this.isEditing();
      const freeAnimateurs = this.availableAnimateurs();
      const availableClasses = this.classes();

      if (!open) {
        return;
      }

      if (isEdit && item) {
        const animId =
          item.animateur_id ||
          item.animateur?.id ||
          (typeof item.animateur === 'string' ? item.animateur : '') ||
          (freeAnimateurs.length > 0 ? freeAnimateurs[0].id : '');

        const clsId =
          item.classe_id ||
          item.classe?.id ||
          (typeof item.classe === 'string' ? item.classe : '') ||
          (availableClasses.length > 0 ? availableClasses[0].id : '');

        const roleVal = String(item.role || 'principal').toLowerCase().trim();
        const finalRole = roleVal.includes('assist')
          ? 'assistant'
          : roleVal.includes('adj')
          ? 'adjoint'
          : 'principal';

        this.form.setValue({
          animateur_id: animId,
          classe_id: clsId,
          role: finalRole
        });
      } else {
        this.form.reset({
          animateur_id: freeAnimateurs.length > 0 ? freeAnimateurs[0].id : '',
          classe_id: availableClasses.length > 0 ? availableClasses[0].id : '',
          role: 'principal'
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
      const anim = this.animateurs().find(a => a.id === val.animateur_id);
      const cls = this.classes().find(c => c.id === val.classe_id);
      const animateurLabel = anim ? `${anim.nom} ${anim.prenoms}` : 'Catéchiste';
      const classeLabel = cls ? cls.nom : 'Classe';

      this.formSubmitted.emit({
        dto: {
          animateur_id: val.animateur_id,
          classe_id: val.classe_id,
          role: val.role
        },
        animateurLabel,
        classeLabel
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
