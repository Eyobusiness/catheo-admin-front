import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AnimateurAuthService } from '../../services/animateur-auth.service';

type ForgotStep = 'email' | 'otp' | 'reset';

@Component({
  selector: 'app-animateur-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './animateur-forgot-password-page.component.html',
  styleUrl: './animateur-forgot-password-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurForgotPasswordPageComponent {
  private readonly authService = inject(AnimateurAuthService);
  private readonly router = inject(Router);

  protected readonly isLoading = this.authService.isLoading;
  protected readonly brandLogoUrl = 'logo/catheo.png';
  protected readonly currentStep = signal<ForgotStep>('email');
  protected readonly savedEmail = signal<string>('');
  protected readonly savedCode = signal<string>('');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly showPassword = signal<boolean>(false);

  // Étape 1 : Email
  protected readonly emailForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    })
  });

  // Étape 2 : Code OTP (6 chiffres)
  protected readonly otpForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4), Validators.maxLength(8)]
    })
  });

  // Étape 3 : Nouveau mot de passe
  protected readonly resetForm = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    password_confirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  protected togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  protected submitEmail(): void {
    this.errorMessage.set(null);
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.getRawValue().email.trim();
    this.savedEmail.set(email);

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.currentStep.set('otp');
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Adresse email introuvable ou erreur de distribution.');
      }
    });
  }

  protected submitOtp(): void {
    this.errorMessage.set(null);
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const code = this.otpForm.getRawValue().code.trim();
    this.savedCode.set(code);

    this.authService.verifyCode({ email: this.savedEmail(), code }).subscribe({
      next: () => {
        this.currentStep.set('reset');
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Le code saisi est invalide ou a expiré.');
      }
    });
  }

  protected submitReset(): void {
    this.errorMessage.set(null);
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { password, password_confirmation } = this.resetForm.getRawValue();

    if (password !== password_confirmation) {
      this.errorMessage.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    this.authService.resetPassword({
      email: this.savedEmail(),
      code: this.savedCode(),
      password,
      password_confirmation
    }).subscribe({
      next: () => {
        if (this.authService.isAuthenticated()) {
          this.router.navigate(['/animateur/dashboard']);
        } else {
          this.router.navigate(['/animateur/login']);
        }
      },
      error: err => {
        this.errorMessage.set(err.error?.message || 'Impossible de réinitialiser votre mot de passe.');
      }
    });
  }
}
