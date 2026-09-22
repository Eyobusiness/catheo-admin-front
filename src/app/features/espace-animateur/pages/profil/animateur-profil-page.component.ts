import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnimateurAuthService } from '../../services/animateur-auth.service';
import { AnimateurClasseService } from '../../services/animateur-classe.service';

@Component({
  selector: 'app-animateur-profil-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './animateur-profil-page.component.html',
  styleUrl: './animateur-profil-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurProfilPageComponent implements OnInit {
  protected readonly authService = inject(AnimateurAuthService);
  protected readonly classeService = inject(AnimateurClasseService);
  private readonly fb = inject(FormBuilder);

  protected readonly profile = this.authService.profile;
  protected readonly displayName = this.authService.displayName;
  protected readonly classe = this.classeService.classe;
  protected readonly annee = this.classeService.anneePastorale;

  // État du modal d'édition
  protected readonly isEditModalOpen = signal(false);
  protected readonly isSaving = signal(false);

  // Formulaire de modification de coordonnées
  protected readonly editForm = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(255)]],
    prenoms: ['', [Validators.maxLength(255)]],
    numero: ['', [Validators.maxLength(50)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    telephone: ['', [Validators.maxLength(30)]]
  });

  protected readonly userInitials = computed(() => {
    const p = this.profile();
    if (p?.prenoms && p?.nom) {
      return `${p.nom.charAt(0)}${p.prenoms.charAt(0)}`.toUpperCase();
    }
    const name = this.displayName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  public ngOnInit(): void {
    this.authService.getMe().subscribe();
    this.classeService.getMaClasse().subscribe();
  }

  protected openEditModal(): void {
    const p = this.profile();
    this.editForm.reset({
      nom: p?.nom || '',
      prenoms: p?.prenoms || '',
      email: p?.email || '',
      telephone: p?.telephone || ''
    });
    this.isEditModalOpen.set(true);
  }

  protected closeEditModal(): void {
    this.isEditModalOpen.set(false);
  }

  protected onSaveProfile(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.editForm.getRawValue();

    this.authService.updateProfile({
      nom: formValue.nom?.trim() || '',
      prenoms: formValue.prenoms?.trim() || '',
      email: formValue.email?.trim() || '',
      telephone: formValue.telephone?.trim() || ''
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeEditModal();
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  protected onLogout(): void {
    this.authService.logout().subscribe();
  }
}
