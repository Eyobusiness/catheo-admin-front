import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AnimateurAuthService } from '../../services/animateur-auth.service';
import { AnimateurClasseService } from '../../services/animateur-classe.service';

import { PwaInstallButtonComponent } from '../../../../core/components/pwa-install-button/pwa-install-button.component';

@Component({
  selector: 'app-animateur-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PwaInstallButtonComponent],
  templateUrl: './animateur-layout.component.html',
  styleUrl: './animateur-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class AnimateurLayoutComponent implements OnInit {
  protected readonly authService = inject(AnimateurAuthService);
  protected readonly classeService = inject(AnimateurClasseService);
  protected readonly router = inject(Router);

  public ngOnInit(): void {
    this.authService.getMe().subscribe();
    this.classeService.getMaClasse().subscribe();
  }

  protected readonly isDrawerOpen = signal<boolean>(false);
  protected readonly brandLogoUrl = 'logo/catheo.png';

  protected readonly profile = this.authService.profile;
  protected readonly displayName = this.authService.displayName;
  protected readonly classe = this.classeService.classe;
  protected readonly anneePastorale = this.classeService.anneePastorale;

  protected readonly userInitials = computed(() => {
    const p = this.profile();
    if (p?.prenoms && p?.nom) {
      return `${p.nom.charAt(0)}${p.prenoms.charAt(0)}`.toUpperCase();
    }
    const name = this.displayName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  protected toggleDrawer(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isDrawerOpen.update(v => !v);
  }

  protected closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    if (this.isDrawerOpen() && !target.closest('.drawer-content') && !target.closest('.menu-toggle-btn')) {
      this.closeDrawer();
    }
  }

  protected onLogout(): void {
    this.closeDrawer();
    this.authService.logout().subscribe();
  }
}
