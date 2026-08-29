import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateUserDto, UpdateUserDto, UserItem } from '../../models/user.model';
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
  public readonly userToEdit = input<UserItem | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateUserDto | UpdateUserDto>();

  protected readonly profils = this.profilService.profilsList;

  protected readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    prenoms: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    telephone: new FormControl('', { nonNullable: true }),
    profil_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    password: new FormControl('', { nonNullable: true }),
    statut: new FormControl<'actif' | 'inactif'>('actif', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const u = this.userToEdit();
      const isEdit = this.isEditing();

      if (open) {
        if (isEdit && u) {
          const splitName = u.name ? u.name.split(' ') : [];
          this.form.setValue({
            nom: u.nom || (splitName.length > 0 ? splitName[0] : ''),
            prenoms: u.prenoms || (splitName.length > 1 ? splitName.slice(1).join(' ') : ''),
            email: u.email || '',
            telephone: u.telephone || u.phone || '',
            profil_id: u.profil?.uuid || u.profil?.id ? String(u.profil?.uuid || u.profil?.id) : '',
            password: '',
            statut: u.statut === 'inactif' ? 'inactif' : 'actif'
          });
          this.form.controls.password.clearValidators();
        } else {
          this.form.reset({
            nom: '',
            prenoms: '',
            email: '',
            telephone: '',
            profil_id: this.profils().length > 0 ? (this.profils()[0].uuid || this.profils()[0].id) : '',
            password: '',
            statut: 'actif'
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
      const fullName = `${val.nom.trim()} ${val.prenoms.trim()}`.trim();

      if (this.isEditing()) {
        const updatePayload: UpdateUserDto = {
          nom: val.nom.trim(),
          prenoms: val.prenoms.trim(),
          name: fullName,
          email: val.email.trim(),
          telephone: val.telephone ? val.telephone.trim() : undefined,
          profil_id: val.profil_id,
          statut: val.statut
        };
        if (val.password && val.password.trim().length > 0) {
          updatePayload.password = val.password.trim();
        }
        this.formSubmitted.emit(updatePayload);
      } else {
        const createPayload: CreateUserDto = {
          nom: val.nom.trim(),
          prenoms: val.prenoms.trim(),
          name: fullName,
          email: val.email.trim(),
          password: val.password.trim(),
          telephone: val.telephone ? val.telephone.trim() : undefined,
          profil_id: val.profil_id,
          statut: val.statut
        };
        this.formSubmitted.emit(createPayload);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
