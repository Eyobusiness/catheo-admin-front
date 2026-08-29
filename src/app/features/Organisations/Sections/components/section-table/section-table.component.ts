import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Section } from '../../models/section.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-section-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './section-table.component.html',
  styleUrl: './section-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionTableComponent {
  public readonly sections = input<Section[]>([]);

  public readonly viewRequested = output<Section>();
  public readonly editRequested = output<Section>();
  public readonly deleteRequested = output<Section>();
  public readonly toggleActiveRequested = output<Section>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedSections = computed(() => {
    const list = this.sections();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected isSectionActive(section: Section): boolean {
    if (!section) return false;
    const s = String(section.statut || '').trim().toLowerCase();
    return s === 'actif' || s === 'active' || s === '1' || s === 'true';
  }

  protected onView(section: Section): void {
    this.viewRequested.emit(section);
  }

  protected onEdit(section: Section): void {
    this.editRequested.emit(section);
  }

  protected onDelete(section: Section): void {
    this.deleteRequested.emit(section);
  }

  protected onToggleActive(section: Section): void {
    this.toggleActiveRequested.emit(section);
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

