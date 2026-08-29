import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ConfigurationService } from '../../services/configuration.service';
import { ThemeService } from '../../../../../core/services/theme.service';
import { AppCard } from '../../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';
import { PoliceCaracteres, UpdateApparenceConfigurationDto } from '../../models/configuration.model';

@Component({
  selector: 'app-tab-apparence-config',
  imports: [ReactiveFormsModule, AppCard, AppButton, AppConfirmDialog],
  templateUrl: './tab-apparence-config.component.html',
  styleUrl: './tab-apparence-config.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabApparenceConfigComponent implements OnDestroy {
  protected readonly configService = inject(ConfigurationService);
  protected readonly themeService = inject(ThemeService);
  protected readonly apparence = this.configService.apparenceConfig;
  protected readonly isSaving = this.configService.isSaving;
  protected readonly isResetConfirmOpen = signal<boolean>(false);
  private formSub?: Subscription;
  private isSaved = false;

  protected readonly fontOptions: { id: PoliceCaracteres; label: string; description: string; sample: string }[] = [
    { id: 'Outfit', label: 'Outfit', description: 'Moderne, géométrique et élégante', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'Inter', label: 'Inter', description: 'Clarté maximale et lisibilité optimale', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'Roboto', label: 'Roboto', description: 'Classique, universelle et équilibrée', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'Poppins', label: 'Poppins', description: 'Harmonieuse, ronde et contemporaine', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'Nunito', label: 'Nunito', description: 'Douce, conviviale et chaleureuse', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'DM Sans', label: 'DM Sans', description: 'Précise, sobre et professionnelle', sample: 'Catéchèse Paroissiale 2026' }
  ];

  protected readonly primaryColorPresets = [
    '#4F46E5', // Indigo (Default)
    '#0284c7', // Sky Blue
    '#2563eb', // Royal Blue
    '#059669', // Emerald Green
    '#7c3aed', // Purple
    '#dc2626', // Crimson Red
    '#0f766e'  // Deep Teal
  ];

  protected readonly secondaryColorPresets = [
    '#D97706', // Amber Gold (Default)
    '#ea580c', // Tangerine
    '#e11d48', // Rose
    '#10b981', // Mint
    '#0284c7', // Sky
    '#8b5cf6'  // Violet
  ];

  protected readonly form = new FormGroup({
    couleur_principale: new FormControl('#4F46E5', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    couleur_secondaire: new FormControl('#D97706', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    police_caracteres: new FormControl<PoliceCaracteres>('Inter', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    entete_document: new FormControl('', { nonNullable: true }),
    pied_page_document: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const app = this.apparence();
      if (app) {
        this.form.patchValue({
          couleur_principale: app.couleur_principale || '#4F46E5',
          couleur_secondaire: app.couleur_secondaire || '#D97706',
          police_caracteres: app.police_caracteres || 'Inter',
          entete_document: app.entete_document || '',
          pied_page_document: app.pied_page_document || ''
        }, { emitEvent: false });
      }
    });

    // Listen to form value changes for immediate live preview across the platform
    this.formSub = this.form.valueChanges.subscribe(val => {
      if (val.couleur_principale || val.couleur_secondaire || val.police_caracteres) {
        this.themeService.previewTheme(
          val.couleur_principale,
          val.couleur_secondaire,
          val.police_caracteres
        );
      }
    });
  }

  public ngOnDestroy(): void {
    this.formSub?.unsubscribe();
    if (!this.isSaved) {
      this.themeService.restoreSavedTheme();
    }
  }

  protected selectPrimaryColor(color: string): void {
    this.form.controls.couleur_principale.setValue(color);
  }

  protected selectSecondaryColor(color: string): void {
    this.form.controls.couleur_secondaire.setValue(color);
  }

  protected selectFont(font: PoliceCaracteres): void {
    this.form.controls.police_caracteres.setValue(font);
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const dto: UpdateApparenceConfigurationDto = {
        couleur_principale: val.couleur_principale,
        couleur_secondaire: val.couleur_secondaire,
        police_caracteres: val.police_caracteres,
        entete_document: val.entete_document || undefined,
        pied_page_document: val.pied_page_document || undefined
      };
      this.isSaved = true;
      this.themeService.applyTheme(val.couleur_principale, val.couleur_secondaire, val.police_caracteres, true);
      this.configService.updateApparenceConfig(dto).subscribe({
        error: () => {
          this.isSaved = false;
        }
      });
    }
  }

  protected onResetDefaults(): void {
    this.isResetConfirmOpen.set(true);
  }

  protected handleConfirmReset(): void {
    this.isResetConfirmOpen.set(false);
    this.isSaved = true;
    this.configService.resetApparenceConfig().subscribe();
  }
}
