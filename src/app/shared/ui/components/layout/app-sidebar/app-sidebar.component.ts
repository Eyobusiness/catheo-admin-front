import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarService } from '../../../../../core/services/sidebar.service';
import { MenuItem } from '../../../../../core/constants/menu';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebar implements OnInit {
  protected readonly sidebarService = inject(SidebarService);
  protected readonly router = inject(Router);

  protected readonly isCollapsed = this.sidebarService.isCollapsed;
  protected readonly isMobileOpen = this.sidebarService.isMobileOpen;
  protected readonly menuItems = this.sidebarService.menuItems;

  public ngOnInit(): void {
    // Initial auto-expand for currently loaded route
    this.autoExpandActiveMenu(this.router.url);

    // Auto-expand on navigation events
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.autoExpandActiveMenu(e.urlAfterRedirects || e.url);
      });
  }

  private autoExpandActiveMenu(currentUrl: string): void {
    if (!currentUrl) return;
    const items = this.menuItems();
    for (const item of items) {
      if (item.sousMenus && item.sousMenus.length > 0) {
        const hasActiveChild = item.sousMenus.some(
          sub => sub.path && sub.path !== '#' && (currentUrl === sub.path || currentUrl.startsWith(sub.path + '/'))
        );
        if (hasActiveChild) {
          const ref = item.reference || item.code || item.libelle;
          this.sidebarService.expandSubMenu(ref);
        }
      }
    }
  }

  protected closeMobile(): void {
    this.sidebarService.closeMobile();
  }

  protected toggleMenu(item: MenuItem, event: MouseEvent): void {
    if (item.sousMenus && item.sousMenus.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      if (this.sidebarService.isCollapsed()) {
        this.sidebarService.isCollapsed.set(false);
      }
      const ref = item.reference || item.code || item.libelle;
      this.sidebarService.toggleSubMenu(ref);
    } else {
      this.closeMobile();
    }
  }

  protected isMenuExpanded(item: MenuItem): boolean {
    const ref = item.reference || item.code || item.libelle;
    return this.sidebarService.isExpanded(ref);
  }
}
