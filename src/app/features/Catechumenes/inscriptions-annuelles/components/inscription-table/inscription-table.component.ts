import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscriptionAnnuelleDto, StatutInscriptionAnnuelle } from '../../models/inscription-annuelle.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-inscription-table',
  imports: [CommonModule, AppIconButton, AppButton, AppPagination],
  templateUrl: './inscription-table.component.html',
  styleUrl: './inscription-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InscriptionTableComponent {
  public readonly inscriptions = input<InscriptionAnnuelleDto[]>([]);

  public readonly viewRequested = output<InscriptionAnnuelleDto>();
  public readonly editRequested = output<InscriptionAnnuelleDto>();
  public readonly deleteRequested = output<InscriptionAnnuelleDto>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedInscriptions = computed(() => {
    const list = this.inscriptions();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getStatutLabel(statut: StatutInscriptionAnnuelle): string {
    switch (statut) {
      case 'valide': return 'Validée';
      case 'inscrit': return 'Inscrit';
      case 'en_attente': return 'En Attente';
      case 'abandon': return 'Abandon';
      default: return statut;
    }
  }

  protected onView(item: InscriptionAnnuelleDto): void {
    this.viewRequested.emit(item);
  }

  protected onEdit(item: InscriptionAnnuelleDto): void {
    this.editRequested.emit(item);
  }

  protected onDelete(item: InscriptionAnnuelleDto): void {
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
