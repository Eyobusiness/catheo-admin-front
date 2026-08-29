import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AppSidebar } from './shared/ui/components/layout/app-sidebar/app-sidebar.component';
import { AppHeader } from './shared/ui/components/layout/app-header/app-header.component';
import { AppFooter } from './shared/ui/components/layout/app-footer/app-footer.component';
import { AppToast } from './shared/ui/components/feedback/app-toast/app-toast.component';

import { ThemeService } from './core/services/theme.service';

function getInitialUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.pathname || '/';
  }
  return '/';
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AppSidebar,
    AppHeader,
    AppFooter,
    AppToast
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  protected readonly currentUrl = signal<string>(getInitialUrl());

  protected readonly isAuthRoute = computed(() => {
    const url = this.currentUrl();
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    return (
      url.startsWith('/auth') ||
      url.startsWith('/login') ||
      url.startsWith('/preinscription-publique') ||
      url.startsWith('/preinscriptions/campagne') ||
      path.startsWith('/auth') ||
      path.startsWith('/login') ||
      path.startsWith('/preinscription-publique') ||
      path.startsWith('/preinscriptions/campagne')
    );
  });

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });
  }
}
