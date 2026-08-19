import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Ceb } from '../../models/ceb.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-ceb-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './ceb-table.component.html',
  styleUrl: './ceb-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CebTableComponent {
  public readonly cebs = input<Ceb[]>([]);

  public readonly viewRequested = output<Ceb>();
  public readonly editRequested = output<Ceb>();
  public readonly deleteRequested = output<Ceb>();
  public readonly toggleStatusRequested = output<Ceb>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedCebs = computed(() => {
    const list = this.cebs();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected isActif(ceb: Ceb): boolean {
    return ceb.statut === 'Active' || ceb.statut_code === 'active';
  }

  protected getInitials(nom: string): string {
    if (!nom) return 'CEB';
    const words = nom.split(' ').filter(w => w.length > 2);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  }

  protected onView(ceb: Ceb): void {
    this.viewRequested.emit(ceb);
  }

  protected onEdit(ceb: Ceb): void {
    this.editRequested.emit(ceb);
  }

  protected onDelete(ceb: Ceb): void {
    this.deleteRequested.emit(ceb);
  }

  protected onToggleStatus(ceb: Ceb): void {
    this.toggleStatusRequested.emit(ceb);
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
