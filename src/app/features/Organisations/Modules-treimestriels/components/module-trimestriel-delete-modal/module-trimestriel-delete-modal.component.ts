import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModuleTrimestriel } from '../../models/module-trimestriel.model';
import { AppConfirmDialog } from '../../../../../shared/ui/components/dialogs/app-confirm-dialog/app-confirm-dialog.component';

@Component({
  selector: 'app-module-trimestriel-delete-modal',
  imports: [AppConfirmDialog],
  templateUrl: './module-trimestriel-delete-modal.component.html',
  styleUrl: './module-trimestriel-delete-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleTrimestrielDeleteModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly itemToDelete = input<ModuleTrimestriel | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly confirmed = output<void>();

  protected readonly message = computed(() => {
    const target = this.itemToDelete();
    if (!target) return 'Êtes-vous sûr de vouloir supprimer ce module trimestriel ?';
    return `Êtes-vous sûr de vouloir supprimer le module "${target.libelle}" (${target.trimestre}) ? Toutes les évaluations associées à cette période devront être réassignées.`;
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }
}
