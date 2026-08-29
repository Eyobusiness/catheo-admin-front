import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
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

  protected readonly showPassword = signal<boolean>(false);

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
    create_user_account: new FormControl<boolean>(true, {
      nonNullable: true
    }),
    statut: new FormControl<AnimateurStatut>('actif', {
      nonNullable: true
    }),
    password: new FormControl('', {
      nonNullable: true
    })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.animateurToEdit();
      const isEdit = this.isEditing();

      if (open) {
        this.showPassword.set(false);
        if (isEdit && item) {
          this.form.controls.password.clearValidators();
          this.form.controls.password.setValidators([Validators.minLength(6)]);
          this.form.controls.password.updateValueAndValidity();

          this.form.patchValue({
            nom: item.nom,
            prenoms: item.prenoms,
            sexe: item.sexe || 'M',
            telephone: item.telephone || '',
            email: item.email || '',
            profession: item.profession || '',
            create_user_account: !!item.user,
            statut: item.statut || 'actif',
            password: ''
          });
        } else {
          this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
          this.form.controls.password.updateValueAndValidity();

          this.form.reset({
            nom: '',
            prenoms: '',
            sexe: 'M',
            telephone: '',
            email: '',
            profession: '',
            create_user_account: true,
            statut: 'actif',
            password: ''
          });
        }
      }
    });
  }

  protected toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      if (this.isEditing()) {
        const payload: UpdateAnimateurDto = {
          nom: val.nom.trim(),
          prenoms: val.prenoms.trim(),
          sexe: val.sexe,
          telephone: val.telephone?.trim() || undefined,
          email: val.email?.trim() || undefined,
          profession: val.profession?.trim() || undefined,
          statut: val.statut
        };
        if (val.password && val.password.trim().length > 0) {
          payload.password = val.password;
        }
        this.formSubmitted.emit(payload);
      } else {
        this.formSubmitted.emit({
          nom: val.nom.trim(),
          prenoms: val.prenoms.trim(),
          sexe: val.sexe,
          telephone: val.telephone?.trim() || undefined,
          email: val.email?.trim() || undefined,
          profession: val.profession?.trim() || undefined,
          create_user_account: val.create_user_account,
          password: val.password || undefined
        });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
