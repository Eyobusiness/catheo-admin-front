import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Animateur, AnimateurSexe, AnimateurStatut, CreateAnimateurDto, UpdateAnimateurDto } from '../../models/animateur.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-animateur-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './animateur-form-modal.component.html',
  styleUrl: './animateur-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimateurFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly animateurToEdit = input<Animateur | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateAnimateurDto | UpdateAnimateurDto>();

  protected readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    prenoms: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    sexe: new FormControl<AnimateurSexe>('M', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    telephone: new FormControl('', {
      nonNullable: true
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email]
    }),
    profession: new FormControl('', {
      nonNullable: true
    }),
    create_user_account: new FormControl<boolean>(false, {
      nonNullable: true
    }),
    statut: new FormControl<AnimateurStatut>('actif', {
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      const item = this.animateurToEdit();
      if (this.isEditing() && item) {
        this.form.setValue({
          nom: item.nom,
          prenoms: item.prenoms,
          sexe: item.sexe || 'M',
          telephone: item.telephone || '',
          email: item.email || '',
          profession: item.profession || '',
          create_user_account: !!item.user,
          statut: item.statut || 'actif'
        });
      } else {
        this.form.reset({
          nom: '',
          prenoms: '',
          sexe: 'M',
          telephone: '',
          email: '',
          profession: '',
          create_user_account: false,
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
      if (this.isEditing()) {
        this.formSubmitted.emit({
          nom: val.nom,
          prenoms: val.prenoms,
          sexe: val.sexe,
          telephone: val.telephone || undefined,
          email: val.email || undefined,
          profession: val.profession || undefined,
          statut: val.statut
        });
      } else {
        this.formSubmitted.emit({
          nom: val.nom,
          prenoms: val.prenoms,
          sexe: val.sexe,
          telephone: val.telephone || undefined,
          email: val.email || undefined,
          profession: val.profession || undefined,
          create_user_account: val.create_user_account
        });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
