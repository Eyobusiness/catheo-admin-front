import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { StatutUtilisateur, UserItem } from '../../models/user.model';
import { AppIconButton } from '../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-user-table',
  imports: [CommonModule, DatePipe, AppIconButton, AppButton],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTableComponent {
  public readonly users = input<UserItem[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly createRequested = output<void>();
  public readonly editRequested = output<UserItem>();
  public readonly deleteRequested = output<UserItem>();
  public readonly statusChanged = output<{ user: UserItem; nextStatus: StatutUtilisateur }>();

  protected getDisplayName(u: UserItem): string {
    if (u.nom && u.prenoms) return `${u.nom} ${u.prenoms}`;
    if (u.name) return u.name;
    if (u.nom) return u.nom;
    return u.email ? u.email.split('@')[0] : 'Utilisateur';
  }

  protected getInitials(u: UserItem): string {
    if (u.nom && u.prenoms) {
      return `${u.nom.charAt(0)}${u.prenoms.charAt(0)}`.toUpperCase();
    }
    const name = this.getDisplayName(u);
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || 'U';
  }

  protected onEdit(u: UserItem): void {
    this.editRequested.emit(u);
  }

  protected onDelete(u: UserItem): void {
    this.deleteRequested.emit(u);
  }

  protected toggleNextStatus(u: UserItem): void {
    const isActif = u.statut === 'actif' || u.status === 'actif';
    const next: StatutUtilisateur = isActif ? 'inactif' : 'actif';
    this.statusChanged.emit({ user: u, nextStatus: next });
  }
}
