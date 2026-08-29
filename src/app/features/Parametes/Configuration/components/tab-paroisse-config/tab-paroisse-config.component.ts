import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
import { AppCard } from '../../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { UpdateParoisseConfigurationDto } from '../../models/configuration.model';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-tab-paroisse-config',
  imports: [ReactiveFormsModule, AppCard, AppButton, TitleCasePipe],
  templateUrl: './tab-paroisse-config.component.html',
  styleUrl: './tab-paroisse-config.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabParoisseConfigComponent {
  protected readonly configService = inject(ConfigurationService);
  protected readonly toastService = inject(ToastService);
  protected readonly paroisse = this.configService.paroisseConfig;
  protected readonly isSaving = this.configService.isSaving;

  // Signals for Dual Logo previews, raw files & removal flags
  public readonly logoParoissePreview = signal<string | null>(null);
  public readonly logoCatechesePreview = signal<string | null>(null);
  public readonly logoParoisseFile = signal<File | null>(null);
  public readonly logoCatecheseFile = signal<File | null>(null);
  public readonly removeLogoParoisseFlag = signal<boolean>(false);
  public readonly removeLogoCatecheseFlag = signal<boolean>(false);

  protected readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    diocese: new FormControl('', { nonNullable: true }),
    doyenne: new FormControl('', { nonNullable: true }),
    ville: new FormControl('', { nonNullable: true }),
    commune: new FormControl('', { nonNullable: true }),
    telephone: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email]
    }),
    site_web: new FormControl('', { nonNullable: true }),
    adresse: new FormControl('', { nonNullable: true }),
    logo_paroisse: new FormControl('', { nonNullable: true }),
    logo_catechese: new FormControl('', { nonNullable: true }),
    logo_url: new FormControl('', { nonNullable: true }),
    cure_nom: new FormControl('', { nonNullable: true }),
    coordination_nom: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const p = this.paroisse();
      if (p) {
        const logoP = p.logo_paroisse_url || p.logo_paroisse || p.logo_url || '';
        const logoC = p.logo_catechese_url || p.logo_catechese || '';

        this.form.patchValue({
          nom: p.nom_paroisse || p.nom || '',
          diocese: p.diocese || '',
          doyenne: p.doyenne || '',
          ville: p.ville || '',
          commune: p.commune || '',
          telephone: p.telephone || '',
          email: p.email || '',
          site_web: p.site_web || '',
          adresse: p.adresse || '',
          logo_paroisse: logoP,
          logo_catechese: logoC,
          logo_url: logoP,
          cure_nom: p.cure_nom || '',
          coordination_nom: p.coordination_nom || ''
        }, { emitEvent: false });

        this.logoParoissePreview.set(logoP || null);
        this.logoCatechesePreview.set(logoC || null);
        this.removeLogoParoisseFlag.set(false);
        this.removeLogoCatecheseFlag.set(false);
      }
    });
  }

  public onLogoSelected(event: Event, type: 'paroisse' | 'catechese'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.warning(
          'Fichier trop volumineux',
          'Veuillez sélectionner une image de taille inférieure à 2 Mo.'
        );
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.warning(
          'Format non supporté',
          'Veuillez choisir un fichier image valide (PNG, JPG, SVG, WEBP).'
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === 'paroisse') {
          this.removeLogoParoisseFlag.set(false);
          this.logoParoisseFile.set(file);
          this.logoParoissePreview.set(result);
          this.form.patchValue({ logo_paroisse: result, logo_url: result });
          this.toastService.info('Logo de la paroisse chargé', 'Cliquez sur Enregistrer pour valider.');
        } else {
          this.removeLogoCatecheseFlag.set(false);
          this.logoCatecheseFile.set(file);
          this.logoCatechesePreview.set(result);
          this.form.patchValue({ logo_catechese: result });
          this.toastService.info('Logo de la catéchèse chargé', 'Cliquez sur Enregistrer pour valider.');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  public removeLogo(type: 'paroisse' | 'catechese'): void {
    if (type === 'paroisse') {
      this.removeLogoParoisseFlag.set(true);
      this.logoParoisseFile.set(null);
      this.logoParoissePreview.set(null);
      this.form.patchValue({ logo_paroisse: '', logo_url: '' });
      this.toastService.info('Logo paroisse retiré', 'Cliquez sur Enregistrer pour confirmer la suppression.');
    } else {
      this.removeLogoCatecheseFlag.set(true);
      this.logoCatecheseFile.set(null);
      this.logoCatechesePreview.set(null);
      this.form.patchValue({ logo_catechese: '' });
      this.toastService.info('Logo catéchèse retiré', 'Cliquez sur Enregistrer pour confirmer la suppression.');
    }
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const logoP = this.removeLogoParoisseFlag() ? null : (this.logoParoisseFile() || val.logo_paroisse || (this.logoParoissePreview() ?? undefined));
      const logoC = this.removeLogoCatecheseFlag() ? null : (this.logoCatecheseFile() || val.logo_catechese || (this.logoCatechesePreview() ?? undefined));

      const dto: UpdateParoisseConfigurationDto = {
        nom: val.nom,
        nom_paroisse: val.nom,
        diocese: val.diocese || undefined,
        doyenne: val.doyenne || undefined,
        ville: val.ville || undefined,
        commune: val.commune || undefined,
        telephone: val.telephone || undefined,
        email: val.email || undefined,
        site_web: val.site_web || undefined,
        adresse: val.adresse || undefined,
        logo_paroisse: logoP,
        remove_logo_paroisse: this.removeLogoParoisseFlag(),
        logo_catechese: logoC,
        remove_logo_catechese: this.removeLogoCatecheseFlag(),
        logo_url: typeof logoP === 'string' ? logoP : undefined,
        cure_nom: val.cure_nom || undefined,
        coordination_nom: val.coordination_nom || undefined
      };
      this.configService.updateParoisseConfig(dto).subscribe({
        next: () => {
          this.logoParoisseFile.set(null);
          this.logoCatecheseFile.set(null);
          this.removeLogoParoisseFlag.set(false);
          this.removeLogoCatecheseFlag.set(false);
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
