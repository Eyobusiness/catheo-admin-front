import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Niveau } from '../../models/niveau.model';
import { Section } from '../../../Sections/models/section.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-niveau-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './niveau-table.component.html',
  styleUrl: './niveau-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NiveauTableComponent {
  public readonly niveaux = input<Niveau[]>([]);
  public readonly sections = input<Section[]>([]);

  public readonly viewRequested = output<Niveau>();
  public readonly editRequested = output<Niveau>();
  public readonly deleteRequested = output<Niveau>();
  public readonly toggleStatusRequested = output<Niveau>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedNiveaux = computed(() => {
    const list = this.niveaux();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected isActif(niveau: Niveau): boolean {
    return niveau.statut_code === 'actif' || String(niveau.statut).toLowerCase() === 'actif';
  }

  protected getSectionName(sectionId: string): string {
    if (!sectionId) return 'Section';
    const s = this.sections().find(sec => sec.id === sectionId);
    return s ? s.nom : 'Section';
  }

  protected onView(niveau: Niveau): void {
    this.viewRequested.emit(niveau);
  }

  protected onEdit(niveau: Niveau): void {
    this.editRequested.emit(niveau);
  }

  protected onDelete(niveau: Niveau): void {
    this.deleteRequested.emit(niveau);
  }

  protected onToggleStatus(niveau: Niveau): void {
    this.toggleStatusRequested.emit(niveau);
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
