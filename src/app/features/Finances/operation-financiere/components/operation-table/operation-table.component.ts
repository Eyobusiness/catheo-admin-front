import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { OperationPaiementDto, StatutOperation } from '../../models/operation.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-operation-table',
  imports: [CommonModule, DecimalPipe, DatePipe, AppIconButton, AppPagination],
  templateUrl: './operation-table.component.html',
  styleUrl: './operation-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationTableComponent {
  public readonly operations = input<OperationPaiementDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly encaisserRequested = output<OperationPaiementDto>();
  public readonly printReceiptRequested = output<OperationPaiementDto>();
  public readonly deleteRequested = output<OperationPaiementDto>();

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly paginatedOperations = computed(() => {
    const list = this.operations();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getStatutBadgeClass(statut: StatutOperation): string {
    switch (statut) {
      case 'paye':
        return 'badge-paye';
      case 'partiellement_paye':
        return 'badge-partiel';
      case 'annule':
        return 'badge-annule';
      default:
        return 'badge-attente';
    }
  }

  protected getStatutLabel(statut: StatutOperation): string {
    switch (statut) {
      case 'paye':
        return 'Payé';
      case 'partiellement_paye':
        return 'Partiel';
      case 'annule':
        return 'Annulé';
      default:
        return 'En attente';
    }
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  protected onEncaisser(item: OperationPaiementDto): void {
    this.encaisserRequested.emit(item);
  }

  protected onPrintReceipt(item: OperationPaiementDto): void {
    this.printReceiptRequested.emit(item);
  }

  protected getDisplayLibelle(item: OperationPaiementDto): string {
    let lib = item.libelle || item.tarif_intitule || item.tarif?.intitule || 'Frais de catéchèse';
    const cat = item.catechumene as any;
    if (cat) {
      const candidates = [
        cat.nom_complet,
        cat.nom && cat.prenoms ? `${cat.nom} ${cat.prenoms}` : '',
        cat.nom && cat.prenoms ? `${cat.prenoms} ${cat.nom}` : '',
        cat.nom,
        cat.prenoms
      ].filter(Boolean);

      for (const name of candidates) {
        if (name && name.length >= 2) {
          const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\s*-\\s*${escaped}\\s*$`, 'i');
          lib = lib.replace(regex, '');
        }
      }
    }
    return lib.trim();
  }

  protected onDelete(item: OperationPaiementDto): void {
    this.deleteRequested.emit(item);
  }
}
