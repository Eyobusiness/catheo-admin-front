import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateUserDto, UpdateUserDto, UserDto } from '../../models/user.model';
import { ProfilService } from '../../Profil/services/profil.service';
import { AppDialog } from '../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-user-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './user-form-modal.component.html',
  styleUrl: './user-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserFormModalComponent {
  private readonly profilService = inject(ProfilService);

  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly userToEdit = input<UserDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateUserDto | UpdateUserDto>();

  protected readonly profils = this.profilService.profils;

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', { nonNullable: true }),
    telephone: new FormControl('', { nonNullable: true }),
    profil_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const u = this.userToEdit();
      const isEdit = this.isEditing();

      if (open) {
        if (isEdit && u) {
          this.form.setValue({
            name: u.name || '',
            email: u.email || '',
            password: '',
            telephone: u.telephone || '',
            profil_id: u.profil?.id || ''
          });
          this.form.controls.password.clearValidators();
        } else {
          this.form.reset({
            name: '',
            email: '',
            password: '',
            telephone: '',
            profil_id: this.profils().length > 0 ? this.profils()[0].id : ''
          });
          this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
        }
        this.form.controls.password.updateValueAndValidity();
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
        const updatePayload: UpdateUserDto = {
          name: val.name,
          email: val.email,
          telephone: val.telephone || undefined,
          profil_id: val.profil_id
        };
        if (val.password && val.password.trim().length > 0) {
          updatePayload.password = val.password;
        }
        this.formSubmitted.emit(updatePayload);
      } else {
        const createPayload: CreateUserDto = {
          name: val.name,
          email: val.email,
          password: val.password,
          telephone: val.telephone || undefined,
          profil_id: val.profil_id
        };
        this.formSubmitted.emit(createPayload);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
