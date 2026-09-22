import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AnimateurAuthService } from '../../services/animateur-auth.service';

@Component({
  selector: 'app-animateur-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './animateur-login-page.component.html',
  styleUrl: './animateur-login-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurLoginPageComponent {
  private readonly authService = inject(AnimateurAuthService);
  private readonly router = inject(Router);

  protected readonly isLoading = this.authService.isLoading;
  protected readonly brandLogoUrl = 'logo/catheo.png';
  protected readonly showPassword = signal<boolean>(false);
  protected readonly serverErrors = signal<Record<string, string[]> | null>(null);
  protected readonly generalErrorMessage = signal<string | null>(null);

  protected readonly loginForm = new FormGroup({
    telephone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  protected togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  protected onSubmit(): void {
    this.serverErrors.set(null);
    this.generalErrorMessage.set(null);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { telephone, password } = this.loginForm.getRawValue();

    this.authService.login({ telephone, password }).subscribe({
      next: () => {
        this.router.navigate(['/animateur/dashboard']);
      },
      error: err => {
        if (err.error?.errors) {
          this.serverErrors.set(err.error.errors);
        }
        if (err.error?.message) {
          this.generalErrorMessage.set(err.error.message);
        }
      }
    });
  }
}
