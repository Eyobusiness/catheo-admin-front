import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
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
export class TabApparenceConfigComponent {
  protected readonly configService = inject(ConfigurationService);
  protected readonly apparence = this.configService.apparenceConfig;
  protected readonly isSaving = this.configService.isSaving;
  protected readonly isResetConfirmOpen = signal<boolean>(false);

  protected readonly fontOptions: { id: PoliceCaracteres; label: string; description: string; sample: string }[] = [
    { id: 'Outfit', label: 'Outfit', description: 'Moderne, géométrique et élégante', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'Inter', label: 'Inter', description: 'Clarté maximale et lisibilité optimale', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'Roboto', label: 'Roboto', description: 'Classique, universelle et équilibrée', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'Poppins', label: 'Poppins', description: 'Harmonieuse, ronde et contemporaine', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'Nunito', label: 'Nunito', description: 'Douce, conviviale et chaleureuse', sample: 'Catéchèse Paroissiale 2026' },
    { id: 'DM Sans', label: 'DM Sans', description: 'Précise, sobre et professionnelle', sample: 'Catéchèse Paroissiale 2026' }
  ];

  protected readonly primaryColorPresets = [
    '#0284c7', // Sky Blue (Default)
    '#4f46e5', // Indigo
    '#2563eb', // Royal Blue
    '#059669', // Emerald Green
    '#7c3aed', // Purple
    '#dc2626', // Crimson Red
    '#0f766e'  // Deep Teal
  ];

  protected readonly secondaryColorPresets = [
    '#d97706', // Amber Gold (Default)
    '#ea580c', // Tangerine
    '#e11d48', // Rose
    '#10b981', // Mint
    '#0284c7', // Sky
    '#8b5cf6'  // Violet
  ];

  protected readonly form = new FormGroup({
    couleur_principale: new FormControl('#0284c7', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    couleur_secondaire: new FormControl('#d97706', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    police_caracteres: new FormControl<PoliceCaracteres>('Outfit', {
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
          couleur_principale: app.couleur_principale || '#0284c7',
          couleur_secondaire: app.couleur_secondaire || '#d97706',
          police_caracteres: app.police_caracteres || 'Outfit',
          entete_document: app.entete_document || '',
          pied_page_document: app.pied_page_document || ''
        }, { emitEvent: false });
      }
    });
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
      this.configService.updateApparenceConfig(dto).subscribe();
    }
  }

  protected onResetDefaults(): void {
    this.isResetConfirmOpen.set(true);
  }

  protected handleConfirmReset(): void {
    this.isResetConfirmOpen.set(false);
    this.configService.resetApparenceConfig().subscribe();
  }
}
