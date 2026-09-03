import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { User } from '../../../../core/models/auth.model';

export type ProfileTab = 'infos' | 'securite' | 'preferences';

@Component({
  selector: 'app-mon-profil-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppButton,
    AppCard
  ],
  templateUrl: './mon-profil-page.component.html',
  styleUrl: './mon-profil-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonProfilPageComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  public readonly activeTab = signal<ProfileTab>('infos');
  public readonly isSubmittingProfile = signal<boolean>(false);
  public readonly isSubmittingPassword = signal<boolean>(false);

  public readonly showCurrentPassword = signal<boolean>(false);
  public readonly showNewPassword = signal<boolean>(false);
  public readonly showConfirmPassword = signal<boolean>(false);

  // Authenticated user signal from database
  public readonly user = this.authService.currentUser;

  public readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (u.nom && u.prenoms) return `${u.nom} ${u.prenoms}`;
    if (u.name) return u.name;
    if (u.nom) return u.nom;
    return u.email || '';
  });

  public readonly userInitials = computed(() => {
    const u = this.user();
    if (u?.nom && u?.prenoms) {
      return `${u.nom.charAt(0)}${u.prenoms.charAt(0)}`.toUpperCase();
    }
    const name = this.displayName();
    if (!name) return 'CP';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  public readonly userRole = computed(() => {
    const u = this.user();
    if (!u) return '';
    return u.role_nom || u.role || u.profil?.nom || u.profil?.libelle || u.profil_nom || '';
  });

  public readonly userParoisse = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (typeof u.paroisse === 'object' && u.paroisse?.nom) return u.paroisse.nom;
    if (typeof u.paroisse === 'string') return u.paroisse;
    return u.paroisse_nom || '';
  });

  public readonly userStatus = computed(() => {
    const u = this.user();
    if (!u) return '';
    return u.statut || (u.is_active ? 'Actif' : '');
  });

  public readonly createdAt = computed(() => this.user()?.created_at || null);
  public readonly lastLogin = computed(() => this.user()?.dernier_login_at || null);

  public profileForm!: FormGroup;
  public passwordForm!: FormGroup;

  constructor() {
    // Remplir le formulaire dès que les données de l'utilisateur sont disponibles
    // (fonctionne aussi quand le signal se met à jour après l'appel API getMe)
    effect(() => {
      const u = this.user();
      if (u && this.profileForm) {
        const nom = u.nom || (u.name ? u.name.split(' ')[0] : '');
        const prenoms = u.prenoms || (u.name ? u.name.split(' ').slice(1).join(' ') : '');
        this.profileForm.patchValue({
          nom,
          prenoms,
          email: u.email || '',
          telephone: u.telephone || ''
        });
      }
    });
  }

  public ngOnInit(): void {
    // Initialiser les formulaires (valeurs par défaut depuis le signal — seront écrasées par l'effect si user est déjà chargé)
    const u = this.user();
    this.profileForm = this.fb.group({
      nom: [u?.nom || (u?.name ? u.name.split(' ')[0] : ''), [Validators.required, Validators.minLength(2)]],
      prenoms: [u?.prenoms || (u?.name ? u.name.split(' ').slice(1).join(' ') : ''), [Validators.required, Validators.minLength(2)]],
      email: [u?.email || '', [Validators.required, Validators.email]],
      telephone: [u?.telephone || '', []]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]]
    }, {
      validators: [this.passwordsMatchValidator]
    });

    // Rafraîchir depuis l'API pour avoir les données les plus récentes
    this.authService.getMe().subscribe();
  }

  public setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  public togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    if (field === 'current') this.showCurrentPassword.update(v => !v);
    if (field === 'new') this.showNewPassword.update(v => !v);
    if (field === 'confirm') this.showConfirmPassword.update(v => !v);
  }

  public onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.warning('Formulaire invalide', 'Veuillez vérifier les champs obligatoires.');
      return;
    }

    this.isSubmittingProfile.set(true);
    const formValues = this.profileForm.getRawValue();
    const fullName = `${formValues.nom.trim()} ${formValues.prenoms.trim()}`.trim();

    this.authService.updateProfile({
      nom: formValues.nom.trim(),
      prenoms: formValues.prenoms.trim(),
      name: fullName,
      email: formValues.email.trim(),
      telephone: formValues.telephone ? formValues.telephone.trim() : ''
    }).subscribe({
      next: () => {
        this.isSubmittingProfile.set(false);
      },
      error: () => {
        this.isSubmittingProfile.set(false);
      }
    });
  }

  public onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      if (this.passwordForm.hasError('passwordsMismatch')) {
        this.toastService.error('Mots de passe non identiques', 'La confirmation du mot de passe ne correspond pas.');
      } else {
        this.toastService.warning('Formulaire invalide', 'Veuillez remplir tous les champs requis correctement.');
      }
      return;
    }

    this.isSubmittingPassword.set(true);
    const payload = this.passwordForm.value;

    this.authService.changePassword(payload).subscribe({
      next: () => {
        this.isSubmittingPassword.set(false);
        this.passwordForm.reset();
      },
      error: () => {
        this.isSubmittingPassword.set(false);
      }
    });
  }

  public onLogout(): void {
    this.authService.logout().subscribe();
  }

  private passwordsMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm = form.get('password_confirmation')?.value;
    return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
  }
}
