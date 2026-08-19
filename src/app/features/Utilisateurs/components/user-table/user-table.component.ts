import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StatutUtilisateur, UserDto } from '../../models/user.model';
import { AppIconButton } from '../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-user-table',
  imports: [AppIconButton, AppButton],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTableComponent {
  public readonly users = input<UserDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly createRequested = output<void>();
  public readonly editRequested = output<UserDto>();
  public readonly deleteRequested = output<UserDto>();
  public readonly statusChanged = output<{ user: UserDto; nextStatus: StatutUtilisateur }>();

  protected getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || 'U';
  }

  protected onEdit(u: UserDto): void {
    this.editRequested.emit(u);
  }

  protected onDelete(u: UserDto): void {
    this.deleteRequested.emit(u);
  }

  protected toggleNextStatus(u: UserDto): void {
    let next: StatutUtilisateur = 'actif';
    if (u.statut === 'actif') next = 'inactif';
    else if (u.statut === 'inactif') next = 'suspendu';
    else if (u.statut === 'suspendu') next = 'actif';

    this.statusChanged.emit({ user: u, nextStatus: next });
  }
}
