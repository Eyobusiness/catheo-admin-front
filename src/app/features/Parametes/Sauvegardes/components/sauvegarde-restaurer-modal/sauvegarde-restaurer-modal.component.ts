import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SauvegardeDto } from '../../models/sauvegarde.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-sauvegarde-restaurer-modal',
  imports: [AppConfirmDialog],
  templateUrl: './sauvegarde-restaurer-modal.component.html',
  styleUrl: './sauvegarde-restaurer-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SauvegardeRestaurerModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly sauvegarde = input<SauvegardeDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly closed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const s = this.sauvegarde();
    if (!s) return 'Êtes-vous sûr de vouloir restaurer la base de données depuis cette sauvegarde ?';
    return `Êtes-vous sûr de vouloir restaurer la base de données à partir de l'archive "${s.nom_fichier}" (enregistrée le ${s.date} à ${s.heure}) ?`;
  });

  protected readonly warningText = computed(() => {
    return 'ATTENTION : Cette opération écrasera toutes les modifications postérieures à la date de cette sauvegarde. Une sauvegarde de sécurité préliminaire est recommandée.';
  });

  protected onClose(): void {
    this.closed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
