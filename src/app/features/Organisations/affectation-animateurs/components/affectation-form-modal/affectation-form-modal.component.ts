import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AffectationAnimateur,
  CreateAffectationAnimateurDto,
  RoleAnimateur,
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
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: CreateAffectationAnimateurDto | UpdateAffectationAnimateurDto;
    animateurLabel: string;
    classeLabel: string;
  }>();

  protected readonly form = new FormGroup({
    animateur_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    classe_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    role: new FormControl<RoleAnimateur>('principal', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor() {
    effect(() => {
      const item = this.affectationToEdit();
      const availableAnimateurs = this.animateurs();
      const availableClasses = this.classes();
      const defaultAnimateurId = availableAnimateurs.length > 0 ? availableAnimateurs[0].id : '';
      const defaultClasseId = availableClasses.length > 0 ? availableClasses[0].id : '';

      if (this.isEditing() && item) {
        this.form.setValue({
          animateur_id: item.animateur_id || item.animateur?.id || defaultAnimateurId,
          classe_id: item.classe_id || item.classe?.id || defaultClasseId,
          role: item.role || 'principal'
        });
      } else {
        this.form.reset({
          animateur_id: defaultAnimateurId,
          classe_id: defaultClasseId,
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
