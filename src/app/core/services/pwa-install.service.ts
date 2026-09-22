import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private readonly router = inject(Router);

  // État d'installation réactif
  public readonly canInstall = signal<boolean>(false);
  public readonly isInstalled = signal<boolean>(false);
  public readonly isIos = signal<boolean>(false);
  public readonly isAnimateurRoute = signal<boolean>(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    this.checkIfInstalled();
    this.detectIos();
    this.setupInstallPromptListener();
    this.setupRouteListener();
  }

  /**
   * Vérifie si l'application est déjà lancée en mode autonome (PWA installée)
   */
  private checkIfInstalled(): void {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      this.isInstalled.set(true);
      this.canInstall.set(false);
    }
  }

  /**
   * Détecte si l'appareil est un appareil Apple (iOS/iPadOS)
   */
  private detectIos(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone === true;

    this.isIos.set(isAppleMobile && !isStandalone);
  }

  /**
   * Écoute l'événement standard de proposition d'installation navigateur
   */
  private setupInstallPromptListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      // Empêche la bannière automatique native pour permettre un contrôle UX
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.canInstall.set(false);
      this.deferredPrompt = null;
    });
  }

  /**
   * Écoute les changements de route pour synchroniser le manifeste et le mode
   */
  private setupRouteListener(): void {
    // Initialisation immédiate
    if (typeof window !== 'undefined') {
      this.updateManifestForPath(window.location.pathname);
    }

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateManifestForPath(event.urlAfterRedirects || event.url);
      });
  }

  /**
   * Bascule dynamiquement le manifeste entre Admin et Espace Animateur
   */
  public updateManifestForPath(path: string): void {
    if (typeof document === 'undefined') return;

    const isAnim =
      path.startsWith('/animateur') ||
      path.startsWith('/espace-animateur');

    this.isAnimateurRoute.set(isAnim);

    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const targetManifest = isAnim ? 'manifest-animateur.webmanifest' : 'manifest-admin.webmanifest';

    if (manifestLink) {
      if (!manifestLink.href.endsWith(targetManifest)) {
        manifestLink.setAttribute('href', targetManifest);
      }
    }

    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isAnim ? '#0284c7' : '#0284c7');
    }
  }

  /**
   * Déclenche la fenêtre native d'installation de l'application
   */
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        this.canInstall.set(false);
        this.isInstalled.set(true);
        this.deferredPrompt = null;
        return true;
      }
    } catch {
      // Ignorer l'erreur d'annulation
    }

    return false;
  }
}
