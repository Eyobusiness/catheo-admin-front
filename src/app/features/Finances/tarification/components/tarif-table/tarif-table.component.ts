import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TarifDto, TypeTarif } from '../../models/tarif.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-tarif-table',
  imports: [CommonModule, DecimalPipe, AppIconButton, AppButton, AppPagination],
  templateUrl: './tarif-table.component.html',
  styleUrl: './tarif-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarifTableComponent {
  public readonly tarifs = input<TarifDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly createRequested = output<void>();
  public readonly editRequested = output<TarifDto>();
  public readonly deleteRequested = output<TarifDto>();
  public readonly genererRequested = output<TarifDto>();
  public readonly toggleStatusRequested = output<TarifDto>();

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly paginatedTarifs = computed(() => {
    const list = this.tarifs();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'inscription':
        return 'badge-inscription';
      case 'bapteme':
      case 'sacrement_bapteme':
        return 'badge-bapteme';
      case 'premiere_communion':
      case 'sacrement_premiere_communion':
        return 'badge-communion';
      case 'confirmation':
      case 'sacrement_confirmation':
        return 'badge-confirmation';
      case 'retraite':
        return 'badge-retraite';
      case 'manuel':
        return 'badge-manuel';
      case 'uniforme':
        return 'badge-uniforme';
      case 'examen':
        return 'badge-examen';
      default:
        return 'badge-autre';
    }
  }

  protected getTypeLabel(type: string): string {
    switch (type) {
      case 'inscription':
        return 'Droit d\'inscription';
      case 'bapteme':
      case 'sacrement_bapteme':
        return 'Sacrement Baptême';
      case 'premiere_communion':
      case 'sacrement_premiere_communion':
        return 'Première Communion';
      case 'confirmation':
      case 'sacrement_confirmation':
        return 'Confirmation';
      case 'retraite':
        return 'Retraite Spirituelle';
      case 'manuel':
        return 'Manuel de Catéchèse';
      case 'uniforme':
        return 'Uniforme / Tenue';
      case 'examen':
        return 'Frais d\'Examen';
      default:
        return 'Autre Contribution';
    }
  }

  protected onToggleStatus(item: TarifDto): void {
    this.toggleStatusRequested.emit(item);
  }

  protected onGenerer(item: TarifDto): void {
    this.genererRequested.emit(item);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  protected onEdit(item: TarifDto): void {
    this.editRequested.emit(item);
  }

  protected onDelete(item: TarifDto): void {
    this.deleteRequested.emit(item);
  }
}
