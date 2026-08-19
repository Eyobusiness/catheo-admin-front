import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = this.authService.isLoading;
  protected readonly generalError = signal<string | null>(null);
  protected readonly showPassword = signal<boolean>(false);

  protected readonly resetForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)]
    }),
    password_confirmation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  public ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.resetForm.controls.email.setValue(emailParam);
    }
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  protected onSubmit(): void {
    this.generalError.set(null);

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { email, code, password, password_confirmation } = this.resetForm.getRawValue();

    if (password !== password_confirmation) {
      this.generalError.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    this.authService.resetPassword({
      email,
      code,
      password,
      password_confirmation,
      device_name: 'Angular_App'
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        const msg = err.error?.message || 'Code de réinitialisation invalide ou expiré.';
        this.generalError.set(msg);
      }
    });
  }
}
