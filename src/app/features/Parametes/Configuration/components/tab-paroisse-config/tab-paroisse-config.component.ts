import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfigurationService } from '../../services/configuration.service';
import { AppCard } from '../../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { UpdateParoisseConfigurationDto } from '../../models/configuration.model';

@Component({
  selector: 'app-tab-paroisse-config',
  imports: [ReactiveFormsModule, AppCard, AppButton, TitleCasePipe],
  templateUrl: './tab-paroisse-config.component.html',
  styleUrl: './tab-paroisse-config.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabParoisseConfigComponent {
  protected readonly configService = inject(ConfigurationService);
  protected readonly paroisse = this.configService.paroisseConfig;
  protected readonly isSaving = this.configService.isSaving;

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
    cure_nom: new FormControl('', { nonNullable: true }),
    coordination_nom: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const p = this.paroisse();
      if (p) {
        this.form.patchValue({
          nom: p.nom || '',
          diocese: p.diocese || '',
          doyenne: p.doyenne || '',
          ville: p.ville || '',
          commune: p.commune || '',
          telephone: p.telephone || '',
          email: p.email || '',
          site_web: p.site_web || '',
          adresse: p.adresse || '',
          cure_nom: p.cure_nom || '',
          coordination_nom: p.coordination_nom || ''
        }, { emitEvent: false });
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const dto: UpdateParoisseConfigurationDto = {
        nom: val.nom,
        diocese: val.diocese || undefined,
        doyenne: val.doyenne || undefined,
        ville: val.ville || undefined,
        commune: val.commune || undefined,
        telephone: val.telephone || undefined,
        email: val.email || undefined,
        site_web: val.site_web || undefined,
        adresse: val.adresse || undefined,
        cure_nom: val.cure_nom || undefined,
        coordination_nom: val.coordination_nom || undefined
      };
      this.configService.updateParoisseConfig(dto).subscribe();
    } else {
      this.form.markAllAsTouched();
    }
  }
}
