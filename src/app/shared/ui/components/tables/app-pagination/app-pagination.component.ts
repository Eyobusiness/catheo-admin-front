import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './app-pagination.component.html',
  styleUrl: './app-pagination.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppPagination {
  public readonly totalItems = input<number>(0);
  public readonly currentPage = input<number>(1);
  public readonly pageSize = input<number>(10);
  public readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);

  public readonly pageChange = output<number>();
  public readonly pageSizeChange = output<number>();

  protected readonly totalPages = computed(() => {
    const total = this.totalItems();
    const size = this.pageSize();
    if (total <= 0 || size <= 0) return 1;
    return Math.ceil(total / size);
  });

  protected readonly startItem = computed(() => {
    const total = this.totalItems();
    if (total === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  protected readonly endItem = computed(() => {
    const total = this.totalItems();
    return Math.min(this.currentPage() * this.pageSize(), total);
  });

  protected readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  });

  protected onPageSelect(page: number | string): void {
    if (typeof page === 'number' && page !== this.currentPage() && page >= 1 && page <= this.totalPages()) {
      this.pageChange.emit(page);
    }
  }

  protected onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    if (!isNaN(newSize)) {
      this.pageSizeChange.emit(newSize);
    }
  }

  protected onPrevious(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  protected onNext(): void {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}
