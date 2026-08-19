import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ProfilDto } from '../../models/profil.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-profil-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './profil-delete-modal.component.html',
  styleUrl: './profil-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly profil = input<ProfilDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly closed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const p = this.profil();
    if (!p) return 'Êtes-vous sûr de vouloir supprimer ce profil ?';
    return `Êtes-vous sûr de vouloir supprimer le profil "${p.nom}" (${p.total_permissions !== undefined ? p.total_permissions : p.permissions.length} permissions) ?`;
  });

  protected readonly warningText = computed(() => {
    const p = this.profil();
    if (p?.users_count && p.users_count > 0) {
      return `Attention : Ce profil est actuellement attribué à ${p.users_count} utilisateur(s).`;
    }
    return 'Cette action supprimera définitivement le profil et retirera les droits associés.';
  });

  protected onClose(): void {
    this.closed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
