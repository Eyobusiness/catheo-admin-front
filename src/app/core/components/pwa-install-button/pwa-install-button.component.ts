import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-pwa-install-button',
  templateUrl: './pwa-install-button.component.html',
  styleUrl: './pwa-install-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PwaInstallButtonComponent {
  protected readonly pwaService = inject(PwaInstallService);

  /**
   * Mode d'affichage :
   * - 'header-btn' : bouton compact pour l'en-tête admin ou mobile
   * - 'drawer-item' : élément cliquable pour le drawer/menu
   * - 'banner-card' : carte tactile attrayante pour le tableau de bord animateur
   */
  public readonly displayMode = input<'header-btn' | 'drawer-item' | 'banner-card'>('header-btn');

  // Signaux réactifs dérivés du service PWA
  protected readonly canInstall = this.pwaService.canInstall;
  protected readonly isInstalled = this.pwaService.isInstalled;
  protected readonly isIos = this.pwaService.isIos;
  protected readonly isAnimateur = this.pwaService.isAnimateurRoute;

  protected readonly showIosModal = signal<boolean>(false);
  protected readonly isInstalling = signal<boolean>(false);

  protected async triggerInstall(): Promise<void> {
    if (this.isIos()) {
      this.showIosModal.set(true);
      return;
    }

    this.isInstalling.set(true);
    try {
      await this.pwaService.promptInstall();
    } finally {
      this.isInstalling.set(false);
    }
  }

  protected closeIosModal(): void {
    this.showIosModal.set(false);
  }
}
