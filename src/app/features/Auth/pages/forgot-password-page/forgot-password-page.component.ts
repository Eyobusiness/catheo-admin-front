import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isLoading = this.authService.isLoading;
  protected readonly brandLogoUrl = 'logo/catheo.png';
  protected readonly generalError = signal<string | null>(null);

  protected readonly forgotForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    })
  });

  protected onSubmit(): void {
    this.generalError.set(null);

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const { email } = this.forgotForm.getRawValue();

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.router.navigate(['/auth/reset-password'], {
          queryParams: { email }
        });
      },
      error: err => {
        const msg = err.error?.errors?.email?.[0] || err.error?.message || 'Erreur lors de l\'envoi du code.';
        this.generalError.set(msg);
      }
    });
  }
}