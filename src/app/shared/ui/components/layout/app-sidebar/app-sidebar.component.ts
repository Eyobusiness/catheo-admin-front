import { ChangeDetectionStrategy, Component, inject, OnInit, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarService } from '../../../../../core/services/sidebar.service';
import { MenuItem } from '../../../../../core/constants/menu';
import { AnneeCatecheseService } from '../../../../../features/Organisations/AnneesPastorales/services/annee-catechese.service';
import { ConfigurationService } from '../../../../../features/Parametes/Configuration/services/configuration.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebar implements OnInit {
  protected readonly sidebarService = inject(SidebarService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly configService = inject(ConfigurationService);
  protected readonly router = inject(Router);

  protected readonly isCollapsed = this.sidebarService.isCollapsed;
  protected readonly isMobileOpen = this.sidebarService.isMobileOpen;
  protected readonly menuItems = this.sidebarService.menuItems;

  public readonly catecheseLogo = computed(() => {
    const p = this.configService.paroisseConfig();
    return p.logo_catechese_url || p.logo_catechese || '';
  });

  public readonly prefixeMatricule = computed(() => {
    const p = this.configService.paroisseConfig();
    return p.prefixe_matricule || 'CATHÉO';
  });

  public readonly nomParoisse = computed(() => {
    const p = this.configService.paroisseConfig();
    return p.nom_paroisse || p.nom || 'Catéchèse Paroissiale';
  });

  public readonly currentAnnee = computed(() => {
    const active = this.anneeService.activeAnnee();
    if (!active) {
      return {
        libelle: '2026-2027',
        code: '2026-2027',
        date_debut: '2026-09-15',
        date_fin: '2027-06-30',
        debut: '2026-09-15',
        fin: '2027-06-30',
        est_active: true
      };
    }
    return {
      ...active,
      code: active.libelle,
      debut: active.date_debut,
      fin: active.date_fin
    };
  });

  public ngOnInit(): void {
    // Charger les années pastorales pour avoir l'année active à jour
    this.anneeService.getAll().subscribe();
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
