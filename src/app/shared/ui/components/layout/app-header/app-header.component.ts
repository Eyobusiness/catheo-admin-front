import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SidebarService } from '../../../../../core/services/sidebar.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { AppButton } from '../../buttons/app-button/app-button.component';

@Component({
  selector: 'app-header',
  imports: [AppButton],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppHeader {
  protected readonly sidebarService = inject(SidebarService);
  protected readonly toastService = inject(ToastService);
  protected readonly authService = inject(AuthService);

  public readonly notificationCount = signal<number>(3);
  public readonly showNotifications = signal<boolean>(false);
  public readonly showUserMenu = signal<boolean>(false);

  // Auth User Data
  protected readonly user = this.authService.currentUser;

  protected readonly userInitials = computed(() => {
    const u = this.user();
    if (!u) return 'CP';
    if (u.name) {
      const parts = u.name.split(' ').filter(Boolean);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return u.name.substring(0, 2).toUpperCase();
    }
    return u.email.substring(0, 2).toUpperCase();
  });

  protected toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    if (this.showUserMenu()) this.showUserMenu.set(false);
  }

  protected toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    if (this.showNotifications()) this.showNotifications.set(false);
  }

  protected markAllNotificationsAsRead(): void {
    this.notificationCount.set(0);
    this.toastService.info('Notifications', 'Toutes les notifications ont été marquées comme lues.');
  }

  protected triggerQuickAction(): void {
    this.toastService.success('Synchronisation', 'Synchronisation pastorale effectuée avec succès.');
  }

  protected onLogout(): void {
    this.showUserMenu.set(false);
    this.authService.logout().subscribe();
  }
}
