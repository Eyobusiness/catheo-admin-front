import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SystemNotificationService } from '../../../core/services/system-notification.service';
import { NotificationTabType, SystemNotification } from '../../../core/models/system-notification.model';
import { AppButton } from '../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppCard } from '../../../shared/ui/components/layout/app-card/app-card.component';

@Component({
  selector: 'app-notifications-page',
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    AppButton,
    AppCard
  ],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsPageComponent implements OnInit {
  protected readonly notificationService = inject(SystemNotificationService);
  protected readonly router = inject(Router);

  public readonly activeTab = signal<NotificationTabType>('all');
  public readonly searchQuery = signal<string>('');
  public readonly filterUnreadOnly = signal<boolean>(false);

  public readonly isLoading = this.notificationService.isLoading;
  public readonly allNotifications = this.notificationService.notificationsList;

  // Counts for tabs
  public readonly countAll = computed(() => this.allNotifications().length);
  public readonly countAlertes = computed(() => this.allNotifications().filter((n: SystemNotification) => n.type === 'alerte' || n.couleur === 'danger').length);
  public readonly countActivites = computed(() => this.allNotifications().filter((n: SystemNotification) => n.type === 'activite' || n.couleur === 'success').length);
  public readonly countRappels = computed(() => this.allNotifications().filter((n: SystemNotification) => n.type === 'rappel' || n.couleur === 'warning').length);
  public readonly unreadTotal = computed(() => this.allNotifications().filter((n: SystemNotification) => !n.is_read).length);

  // Filtered notifications computed signal
  public readonly filteredNotifications = computed<SystemNotification[]>(() => {
    let list: SystemNotification[] = this.allNotifications();
    const tab = this.activeTab();
    const query = this.searchQuery().toLowerCase().trim();
    const unreadOnly = this.filterUnreadOnly();

    // Filter by tab
    if (tab === 'alerte') {
      list = list.filter((n: SystemNotification) => n.type === 'alerte' || n.couleur === 'danger');
    } else if (tab === 'activite') {
      list = list.filter((n: SystemNotification) => n.type === 'activite' || n.couleur === 'success');
    } else if (tab === 'rappel') {
      list = list.filter((n: SystemNotification) => n.type === 'rappel' || n.couleur === 'warning');
    }

    // Filter by unread status
    if (unreadOnly) {
      list = list.filter((n: SystemNotification) => !n.is_read);
    }

    // Filter by search query
    if (query) {
      list = list.filter((n: SystemNotification) =>
        n.titre.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    return list;
  });

  public ngOnInit(): void {
    this.refresh();
  }

  public refresh(): void {
    this.notificationService.fetchNotifications().subscribe();
    this.notificationService.fetchUnreadCount().subscribe();
  }

  public setTab(tab: NotificationTabType): void {
    this.activeTab.set(tab);
  }

  public toggleUnreadFilter(): void {
    this.filterUnreadOnly.update(v => !v);
  }

  public onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }

  public markAsRead(notif: SystemNotification, event?: Event): void {
    if (event) event.stopPropagation();
    this.notificationService.markAsRead(notif.id).subscribe();
  }

  public markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  public handleAction(notif: SystemNotification, event?: Event): void {
    if (event) event.stopPropagation();
    this.notificationService.handleNotificationClick(notif);
  }

  public getActionLabel(notif: SystemNotification): string {
    return this.notificationService.getActionLabel(notif);
  }

  public getBadgeType(notif: SystemNotification): 'danger' | 'warning' | 'success' | 'info' {
    if (notif.couleur === 'danger' || notif.type === 'alerte') return 'danger';
    if (notif.couleur === 'warning' || notif.type === 'rappel') return 'warning';
    if (notif.couleur === 'success' || notif.type === 'activite') return 'success';
    return 'info';
  }

  public getBadgeLabel(notif: SystemNotification): string {
    if (notif.type === 'alerte' || notif.couleur === 'danger') return 'Alerte';
    if (notif.type === 'rappel' || notif.couleur === 'warning') return 'Rappel';
    if (notif.type === 'activite' || notif.couleur === 'success') return 'Activité';
    return 'Info';
  }
}
