import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { CaisseMouvementDto, TypeMouvementCaisse } from '../../models/caisse.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-caisse-table',
  imports: [CommonModule, DecimalPipe, DatePipe, AppIconButton, AppButton, AppPagination],
  templateUrl: './caisse-table.component.html',
  styleUrl: './caisse-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaisseTableComponent {
  public readonly mouvements = input<CaisseMouvementDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly createRequested = output<void>();
  public readonly rembourserRequested = output<CaisseMouvementDto>();
  public readonly deleteRequested = output<CaisseMouvementDto>();

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly paginatedMouvements = computed(() => {
    const list = this.mouvements();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected isEntree(type: TypeMouvementCaisse): boolean {
    return type === 'entree' || type === 'recette';
  }

  protected getTypeBadgeClass(type: TypeMouvementCaisse): string {
    if (this.isEntree(type)) return 'badge-entree';
    if (type === 'remboursement') return 'badge-remboursement';
    return 'badge-sortie';
  }

  protected getTypeLabel(type: TypeMouvementCaisse): string {
    switch (type) {
      case 'entree':
      case 'recette':
        return 'Encaissement';
      case 'remboursement':
        return 'Remboursement';
      case 'depense':
        return 'Dépense';
      default:
        return 'Sortie de Caisse';
    }
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  protected onRembourser(item: CaisseMouvementDto): void {
    this.rembourserRequested.emit(item);
  }

  protected onDelete(item: CaisseMouvementDto): void {
    this.deleteRequested.emit(item);
  }
}
