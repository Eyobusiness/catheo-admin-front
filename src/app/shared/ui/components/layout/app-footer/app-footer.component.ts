import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ConfigurationService } from '../../../../../features/Parametes/Configuration/services/configuration.service';
import { WorkingAnneeService } from '../../../../../core/services/working-annee.service';
import { AnneeCatecheseService } from '../../../../../core/services/annee-catechese.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFooter {
  private readonly configService = inject(ConfigurationService);
  private readonly workingAnneeService = inject(WorkingAnneeService);
  private readonly anneeService = inject(AnneeCatecheseService);
  private readonly authService = inject(AuthService);

  protected readonly currentYear = signal<number>(new Date().getFullYear());

  protected readonly nomParoisse = computed(() => {
    const p = this.configService.paroisseConfig();
    const nomFromConfig = (p?.nom_paroisse || p?.nom || '').trim();
    if (nomFromConfig) {
      return nomFromConfig;
    }
    const u = this.authService.currentUser();
    const nomFromAuth = (u?.paroisse?.nom || u?.paroisse_nom || '').trim();
    if (nomFromAuth) {
      return nomFromAuth;
    }
    return 'Paroisse Cœur Immaculé de Marie';
  });

  protected readonly anneeLibelle = computed(() => {
    const lib = this.workingAnneeService.workingAnnee()?.libelle || this.anneeService.activeAnnee()?.libelle;
    if (!lib) {
      return 'Année 2026-2027';
    }
    const trimmed = lib.trim();
    return trimmed.toLowerCase().startsWith('année') ? trimmed : `Année ${trimmed}`;
  });
}

