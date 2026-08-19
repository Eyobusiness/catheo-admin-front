import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { AnneeCatechese } from '../../models/annee-catechese.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-annee-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './annee-table.component.html',
  styleUrl: './annee-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnneeTableComponent {
  public readonly annees = input<AnneeCatechese[]>([]);

  public readonly viewRequested = output<AnneeCatechese>();
  public readonly editRequested = output<AnneeCatechese>();
  public readonly deleteRequested = output<AnneeCatechese>();
  public readonly toggleActiveRequested = output<AnneeCatechese>();
  public readonly createRequested = output<void>();

  // Local Pagination Signals
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedAnnees = computed(() => {
    const list = this.annees();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected onView(annee: AnneeCatechese): void {
    this.viewRequested.emit(annee);
  }

  protected onEdit(annee: AnneeCatechese): void {
    this.editRequested.emit(annee);
  }

  protected onDelete(annee: AnneeCatechese): void {
    this.deleteRequested.emit(annee);
  }

  protected onToggleActive(annee: AnneeCatechese): void {
    this.toggleActiveRequested.emit(annee);
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
