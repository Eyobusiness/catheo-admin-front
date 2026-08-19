import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { UserDto } from '../../models/user.model';
import { AppConfirmDialog } from '../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-user-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './user-delete-modal.component.html',
  styleUrl: './user-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly user = input<UserDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly closed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const u = this.user();
    if (!u) return 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?';
    return `Êtes-vous sûr de vouloir supprimer le compte utilisateur de "${u.name}" (${u.email}) ?`;
  });

  protected readonly warningText = computed(() => {
    return 'Cette action supprimera définitivement le compte et révoquera tous les accès applicatifs associés.';
  });

  protected onClose(): void {
    this.closed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
