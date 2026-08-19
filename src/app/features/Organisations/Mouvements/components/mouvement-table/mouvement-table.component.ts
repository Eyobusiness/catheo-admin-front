import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Mouvement } from '../../models/mouvement.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-mouvement-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './mouvement-table.component.html',
  styleUrl: './mouvement-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MouvementTableComponent {
  public readonly mouvements = input<Mouvement[]>([]);

  public readonly viewRequested = output<Mouvement>();
  public readonly editRequested = output<Mouvement>();
  public readonly deleteRequested = output<Mouvement>();
  public readonly toggleStatusRequested = output<Mouvement>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedMouvements = computed(() => {
    const list = this.mouvements();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected isActif(mouvement: Mouvement): boolean {
    return mouvement.statut === 'Active' || mouvement.statut_code === 'active';
  }

  protected getInitials(nom: string): string {
    if (!nom) return 'MV';
    const words = nom.split(' ').filter(w => w.length > 2);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  }

  protected onView(mouvement: Mouvement): void {
    this.viewRequested.emit(mouvement);
  }

  protected onEdit(mouvement: Mouvement): void {
    this.editRequested.emit(mouvement);
  }

  protected onDelete(mouvement: Mouvement): void {
    this.deleteRequested.emit(mouvement);
  }

  protected onToggleStatus(mouvement: Mouvement): void {
    this.toggleStatusRequested.emit(mouvement);
  }

  protected onCreate(): void {
    this.createRequested.emit();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }
}
