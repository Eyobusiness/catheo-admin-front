import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardService } from '../../core/services/dashboard.service';
import { ToastService, ToastType } from '../../core/services/toast.service';
import { AppStatCard } from '../../shared/ui/components/data-display/app-stat-card/app-stat-card.component';
import { AppStatusBadge } from '../../shared/ui/components/data-display/app-status-badge/app-status-badge.component';
import { AppCard } from '../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../shared/ui/components/buttons/app-button/app-button.component';
import { AppDialog } from '../../shared/ui/components/dialogs/app-dialog/app-dialog.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    ReactiveFormsModule,
    AppStatCard,
    AppStatusBadge,
    AppCard,
    AppButton,
    AppDialog
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly dashboardService = inject(DashboardService);
  protected readonly toastService = inject(ToastService);

  // Data signals
  protected readonly stats = this.dashboardService.stats;
  protected readonly roadmaps = this.dashboardService.roadmapModules;
  protected readonly sampleCatechumenes = this.dashboardService.sampleCatechumenes;

  // Modal & Form signals
  protected readonly isTestModalOpen = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);

  protected readonly testForm = new FormGroup({
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    prenoms: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    section: new FormControl('1ère Année', { nonNullable: true, validators: [Validators.required] }),
    telephoneParent: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    remarque: new FormControl('', { nonNullable: true })
  });

  protected triggerToast(type: ToastType): void {
    switch (type) {
      case 'success':
        this.toastService.success('Opération Réussie', 'Le dossier a été synchronisé avec la base paroissiale CIM.');
        break;
      case 'error':
        this.toastService.error('Erreur Détectée', 'Impossible de joindre le serveur. Veuillez vérifier la connexion.');
        break;
      case 'warning':
        this.toastService.warning('Attention Requise', 'Certains certificats de baptême sont manquants.');
        break;
      case 'info':
        this.toastService.info('Information', 'La prochaine séance de catéchèse aura lieu ce samedi à 15h00.');
        break;
    }
  }

  protected openTestModal(): void {
    this.testForm.reset({
      nom: '',
      prenoms: '',
      section: '1ère Année',
      telephoneParent: '',
      remarque: ''
    });
    this.isTestModalOpen.set(true);
  }

  protected closeTestModal(): void {
    this.isTestModalOpen.set(false);
  }

  protected submitTestForm(): void {
    if (this.testForm.invalid) {
      this.toastService.error('Champs Incomplets', 'Veuillez renseigner le nom, les prénoms et le téléphone du parent.');
      return;
    }

    this.isSubmitting.set(true);

    setTimeout(() => {
      const val = this.testForm.getRawValue();
      this.isSubmitting.set(false);
      this.isTestModalOpen.set(false);
      this.toastService.success('Préinscription Enregistrée', `Le dossier de ${val.prenoms} ${val.nom} a été soumis avec succès.`);
    }, 500);
  }
}
