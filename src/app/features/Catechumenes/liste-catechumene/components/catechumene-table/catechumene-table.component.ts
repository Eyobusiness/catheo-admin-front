import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CatechumeneDto, StatutCatechumene } from '../../models/catechumene.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-catechumene-table',
  imports: [CommonModule, DatePipe, AppIconButton, AppButton, AppPagination],
  templateUrl: './catechumene-table.component.html',
  styleUrl: './catechumene-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatechumeneTableComponent {
  public readonly catechumenes = input<CatechumeneDto[]>([]);

  public readonly viewRequested = output<CatechumeneDto>();
  public readonly editRequested = output<CatechumeneDto>();
  public readonly deleteRequested = output<CatechumeneDto>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedCatechumenes = computed(() => {
    const list = this.catechumenes();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getStatutBadgeClass(statut: StatutCatechumene): string {
    switch (statut) {
      case 'actif': return 'badge-actif';
      case 'abandon': return 'badge-abandon';
      case 'transfere': return 'badge-transfere';
      case 'complete': return 'badge-complete';
      default: return 'badge-actif';
    }
  }

  protected onView(item: CatechumeneDto): void {
    this.viewRequested.emit(item);
  }

  protected onEdit(item: CatechumeneDto): void {
    this.editRequested.emit(item);
  }

  protected onDelete(item: CatechumeneDto): void {
    this.deleteRequested.emit(item);
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
