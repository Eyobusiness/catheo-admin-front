import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AnimateurAuthService } from '../../services/animateur-auth.service';

@Component({
  selector: 'app-animateur-change-password-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './animateur-change-password-page.component.html',
  styleUrl: './animateur-change-password-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurChangePasswordPageComponent {
  private readonly authService = inject(AnimateurAuthService);
  private readonly router = inject(Router);

  protected readonly isLoading = this.authService.isLoading;
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showOldPass = signal<boolean>(false);
  protected readonly showNewPass = signal<boolean>(false);

  protected readonly passwordForm = new FormGroup({
    current_password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    password_confirmation: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  protected onSubmit(): void {
    this.errorMessage.set(null);

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { current_password, password, password_confirmation } = this.passwordForm.getRawValue();

    if (password !== password_confirmation) {
      this.errorMessage.set('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }

    this.authService.changePassword({
      current_password,
      password,
      password_confirmation
    }).subscribe({
      next: () => {
        this.router.navigate(['/animateur/profil']);
      },
      error: err => {
        this.errorMessage.set(
          err.error?.message ||
          (err.error?.errors ? Object.values(err.error.errors).flat().join(' ') : null) ||
          'Erreur lors du changement de mot de passe.'
        );
      }
    });
  }
}
