import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PreinscriptionDto, StatutPreinscription } from '../../models/preinscription.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-preinscription-table',
  imports: [CommonModule, DatePipe, AppIconButton, AppButton, AppPagination],
  templateUrl: './preinscription-table.component.html',
  styleUrl: './preinscription-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreinscriptionTableComponent {
  public readonly preinscriptions = input<PreinscriptionDto[]>([]);

  public readonly viewRequested = output<PreinscriptionDto>();
  public readonly editRequested = output<PreinscriptionDto>();
  public readonly validerRequested = output<PreinscriptionDto>();
  public readonly rejeterRequested = output<PreinscriptionDto>();
  public readonly deleteRequested = output<PreinscriptionDto>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedPreinscriptions = computed(() => {
    const list = this.preinscriptions();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getStatutLabel(statut: StatutPreinscription): string {
    switch (statut) {
      case 'en_attente': return 'En Attente';
      case 'validee': return 'Validée';
      case 'rejetee': return 'Rejetée';
      default: return statut;
    }
  }

  protected onView(item: PreinscriptionDto): void {
    this.viewRequested.emit(item);
  }

  protected onEdit(item: PreinscriptionDto): void {
    this.editRequested.emit(item);
  }

  protected onValider(item: PreinscriptionDto): void {
    this.validerRequested.emit(item);
  }

  protected onRejeter(item: PreinscriptionDto): void {
    this.rejeterRequested.emit(item);
  }

  protected onDelete(item: PreinscriptionDto): void {
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
