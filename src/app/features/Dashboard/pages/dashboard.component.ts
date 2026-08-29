import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';
import { SystemNotificationService } from '../../../core/services/system-notification.service';
import { AdminDashboardViewComponent } from '../components/admin-dashboard-view/admin-dashboard-view.component';
import { AppButton } from '../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    AppButton,
    AdminDashboardViewComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected readonly dashboardService = inject(DashboardService);
  protected readonly notificationService = inject(SystemNotificationService);

  protected readonly isLoading = this.dashboardService.isLoading;
  protected readonly dashboardData = this.dashboardService.dashboardData;

  public ngOnInit(): void {
    this.refreshData();
  }

  protected refreshData(): void {
    this.dashboardService.getSummary().subscribe();
    this.notificationService.fetchAlertsSummary().subscribe();
  }
}
