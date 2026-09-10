import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardSummaryData } from '../../models/dashboard.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { SystemNotificationService } from '../../../../core/services/system-notification.service';
import { AlertSummaryItem } from '../../../../core/models/system-notification.model';

@Component({
  selector: 'app-admin-dashboard-view',
  imports: [CommonModule, RouterLink, AppCard],
  templateUrl: './admin-dashboard-view.component.html',
  styleUrl: './admin-dashboard-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardViewComponent implements OnInit {
  protected readonly notificationService = inject(SystemNotificationService);
  protected readonly router = inject(Router);

  public readonly data = input<DashboardSummaryData | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly alertsSummary = this.notificationService.alertsSummary;

  // Gestion de l'affichage progressif des Niveaux (5 par défaut + Voir plus/moins)
  public readonly showAllNiveaux = signal<boolean>(false);

  public readonly allNiveaux = computed(() => {
    return this.data()?.effectifs?.par_niveau || [];
  });

  public readonly totalNiveauxCount = computed(() => this.allNiveaux().length);

  public readonly displayedNiveaux = computed(() => {
    const list = this.allNiveaux();
    if (this.showAllNiveaux() || list.length <= 5) {
      return list;
    }
    return list.slice(0, 5);
  });

  // Gestion de l'affichage progressif des Classes (5 par défaut + Voir plus/moins)
  public readonly showAllClasses = signal<boolean>(false);

  public readonly allClasses = computed(() => {
    return this.data()?.effectifs?.par_classe || [];
  });

  public readonly totalClassesCount = computed(() => {
    return this.allClasses().length || this.data()?.summary?.classes || 0;
  });

  public readonly displayedClasses = computed(() => {
    const list = this.allClasses();
    if (this.showAllClasses() || list.length <= 5) {
      return list;
    }
    return list.slice(0, 5);
  });

  // Calcul du total des effectifs pour les pourcentages par section
  public readonly totalSectionEffectif = computed(() => {
    const sections = this.data()?.effectifs?.par_section || [];
    return sections.reduce((sum, s) => sum + (s.effectif || 0), 0) || this.data()?.summary?.catechumenes_actifs || 1;
  });

  public toggleShowAllNiveaux(): void {
    this.showAllNiveaux.update(val => !val);
  }

  public toggleShowAllClasses(): void {
    this.showAllClasses.update(val => !val);
  }

  public ngOnInit(): void {
    this.notificationService.fetchAlertsSummary().subscribe();
  }

  public getSectionPercentage(effectif: number): number {
    const total = this.totalSectionEffectif();
    if (!total || total <= 0) return 0;
    return Math.round((effectif / total) * 100);
  }

  public getClassOccupancy(effectif: number, capaciteMax?: number): number {
    if (!capaciteMax || capaciteMax <= 0) {
      return effectif > 0 ? 100 : 0;
    }
    return Math.min(100, Math.round((effectif / capaciteMax) * 100));
  }

  public getResolvedRoute(alert: AlertSummaryItem): string {
    return this.notificationService.normalizeRoute(alert.route_url);
  }
}
