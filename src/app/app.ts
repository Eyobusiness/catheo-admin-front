import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AppSidebar } from './shared/ui/components/layout/app-sidebar/app-sidebar.component';
import { AppHeader } from './shared/ui/components/layout/app-header/app-header.component';
import { AppFooter } from './shared/ui/components/layout/app-footer/app-footer.component';
import { AppToast } from './shared/ui/components/feedback/app-toast/app-toast.component';
import { PdfPreviewModalComponent } from './shared/ui/components/dialogs/pdf-preview-modal/pdf-preview-modal.component';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

const FAVICON_STORAGE_KEY = 'catheo_paroisse_favicon';

function getInitialUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.pathname || '/';
  }
  return '/';
}

function isPublicRoute(url: string): boolean {
  return (
    url === '/' ||
    url === '' ||
    url.startsWith('/auth') ||
    url.startsWith('/login') ||
    url.startsWith('/preinscription-publique') ||
    url.startsWith('/preinscriptions/campagne')
  );
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AppSidebar,
    AppHeader,
    AppFooter,
    AppToast,
    PdfPreviewModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly brandFaviconUrl = 'logo/catheo.png';
  protected readonly currentUrl = signal<string>(getInitialUrl());

  /**
   * Affiche le layout (sidebar/header/footer) UNIQUEMENT si :
   * - l'utilisateur est authentifié ET
   * - l'URL n'est pas une route publique
   * Cela évite tout flash du layout pour les utilisateurs non connectés.
   */
  protected readonly showAppLayout = computed(() => {
    const url = this.currentUrl();
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const onPublicRoute = isPublicRoute(url) || isPublicRoute(path);
    return this.authService.isAuthenticated() && !onPublicRoute;
  });

  constructor() {
    this.applyRouteFavicon(this.currentUrl());

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const nextUrl = event.urlAfterRedirects || event.url;
        this.currentUrl.set(nextUrl);
        this.applyRouteFavicon(nextUrl);
      });
  }

  private applyRouteFavicon(url: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    if (isPublicRoute(url)) {
      this.setFaviconInDom(this.brandFaviconUrl);
      return;
    }

    const cachedFavicon = this.getCachedFavicon();
    if (cachedFavicon) {
      this.setFaviconInDom(cachedFavicon);
    }
  }

  private getCachedFavicon(): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(FAVICON_STORAGE_KEY);
      }
    } catch {
      return null;
    }

    return null;
  }

  private setFaviconInDom(iconUrl: string): void {
    if (!iconUrl || typeof document === 'undefined') {
      return;
    }

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (iconUrl.endsWith('.svg') || iconUrl.startsWith('data:image/svg')) {
      link.type = 'image/svg+xml';
    } else if (iconUrl.endsWith('.png') || iconUrl.startsWith('data:image/png')) {
      link.type = 'image/png';
    } else if (iconUrl.endsWith('.jpg') || iconUrl.endsWith('.jpeg') || iconUrl.startsWith('data:image/jpeg')) {
      link.type = 'image/jpeg';
    } else if (iconUrl.endsWith('.webp') || iconUrl.startsWith('data:image/webp')) {
      link.type = 'image/webp';
    }

    link.href = iconUrl;
  }
}