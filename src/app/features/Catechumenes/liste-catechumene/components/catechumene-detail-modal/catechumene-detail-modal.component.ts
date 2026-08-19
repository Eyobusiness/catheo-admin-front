import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CatechumeneDto, ParrainMarraineDto } from '../../models/catechumene.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';

@Component({
  selector: 'app-catechumene-detail-modal',
  imports: [CommonModule, DatePipe, AppDialog, AppButton, AppIconButton],
  templateUrl: './catechumene-detail-modal.component.html',
  styleUrl: './catechumene-detail-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatechumeneDetailModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly catechumene = input<CatechumeneDto | null>(null);
  public readonly parrains = input<ParrainMarraineDto[]>([]);

  public readonly modalClosed = output<void>();
  public readonly editRequested = output<CatechumeneDto>();
  public readonly addParrainRequested = output<CatechumeneDto>();
  public readonly deleteParrainRequested = output<string>();

  protected readonly catechumeneParrains = computed(() => {
    const cat = this.catechumene();
    if (!cat) return [];
    return this.parrains().filter(p => p.catechumene_id === cat.id);
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onEdit(): void {
    const c = this.catechumene();
    if (c) this.editRequested.emit(c);
  }

  protected onAddParrain(): void {
    const c = this.catechumene();
    if (c) this.addParrainRequested.emit(c);
  }

  protected onDeleteParrain(id: string): void {
    this.deleteParrainRequested.emit(id);
  }
}
