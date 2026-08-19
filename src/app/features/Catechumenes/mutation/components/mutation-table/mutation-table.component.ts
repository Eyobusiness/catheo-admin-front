import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MutationCatechumeneDto } from '../../models/mutation.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-mutation-table',
  imports: [CommonModule, DatePipe, AppIconButton, AppButton, AppPagination],
  templateUrl: './mutation-table.component.html',
  styleUrl: './mutation-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MutationTableComponent {
  public readonly mutations = input<MutationCatechumeneDto[]>([]);

  public readonly viewRequested = output<MutationCatechumeneDto>();
  public readonly approveRequested = output<MutationCatechumeneDto>();
  public readonly refuseRequested = output<MutationCatechumeneDto>();
  public readonly deleteRequested = output<MutationCatechumeneDto>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedMutations = computed(() => {
    const list = this.mutations();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected onView(item: MutationCatechumeneDto): void {
    this.viewRequested.emit(item);
  }

  protected onApprove(item: MutationCatechumeneDto): void {
    this.approveRequested.emit(item);
  }

  protected onRefuse(item: MutationCatechumeneDto): void {
    this.refuseRequested.emit(item);
  }

  protected onDelete(item: MutationCatechumeneDto): void {
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
