import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { VersementCureDto, ModeRemise, StatutVersement } from '../../models/versement.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-versement-table',
  imports: [CommonModule, DecimalPipe, DatePipe, AppIconButton, AppButton, AppPagination],
  templateUrl: './versement-table.component.html',
  styleUrl: './versement-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersementTableComponent {
  public readonly versements = input<VersementCureDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly createRequested = output<void>();
  public readonly editRequested = output<VersementCureDto>();
  public readonly deleteRequested = output<VersementCureDto>();
  public readonly printRequested = output<VersementCureDto>();

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly paginatedVersements = computed(() => {
    const list = this.versements();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getModeBadgeClass(mode: ModeRemise): string {
    switch (mode) {
      case 'cheque':
        return 'badge-cheque';
      case 'virement':
        return 'badge-virement';
      default:
        return 'badge-especes';
    }
  }

  protected getModeLabel(mode: ModeRemise): string {
    switch (mode) {
      case 'cheque':
        return 'Chèque';
      case 'virement':
        return 'Virement';
      default:
        return 'Espèces';
    }
  }

  protected getStatutBadgeClass(statut?: StatutVersement): string {
    switch (statut) {
      case 'valide':
        return 'badge-valide';
      case 'annule':
        return 'badge-annule';
      default:
        return 'badge-attente';
    }
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  protected onEdit(item: VersementCureDto): void {
    this.editRequested.emit(item);
  }

  protected onDelete(item: VersementCureDto): void {
    this.deleteRequested.emit(item);
  }

  protected onPrint(item: VersementCureDto): void {
    this.printRequested.emit(item);
  }
}
