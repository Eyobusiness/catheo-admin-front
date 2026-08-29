import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
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

  // Calcul du total des effectifs pour les pourcentages par section
  public readonly totalSectionEffectif = computed(() => {
    const sections = this.data()?.effectifs?.par_section || [];
    return sections.reduce((sum, s) => sum + (s.effectif || 0), 0) || this.data()?.summary?.catechumenes_actifs || 1;
  });

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
