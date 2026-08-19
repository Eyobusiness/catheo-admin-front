import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CampagnePreinscriptionDto } from '../../models/campagne.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-campagne-table',
  imports: [CommonModule, DatePipe, AppIconButton, AppButton, AppPagination],
  templateUrl: './campagne-table.component.html',
  styleUrl: './campagne-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneTableComponent {
  public readonly campagnes = input<CampagnePreinscriptionDto[]>([]);

  public readonly viewRequested = output<CampagnePreinscriptionDto>();
  public readonly editRequested = output<CampagnePreinscriptionDto>();
  public readonly deleteRequested = output<CampagnePreinscriptionDto>();
  public readonly toggleStatusRequested = output<CampagnePreinscriptionDto>();
  public readonly qrRequested = output<CampagnePreinscriptionDto>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedCampagnes = computed(() => {
    const list = this.campagnes();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected isCampagneEnCours(campagne: CampagnePreinscriptionDto): boolean {
    if (!campagne.est_ouverte) return false;
    const now = new Date();
    const fin = new Date(campagne.date_fin);
    return fin >= now;
  }

  protected onView(item: CampagnePreinscriptionDto): void {
    this.viewRequested.emit(item);
  }

  protected onEdit(item: CampagnePreinscriptionDto): void {
    this.editRequested.emit(item);
  }

  protected onDelete(item: CampagnePreinscriptionDto): void {
    this.deleteRequested.emit(item);
  }

  protected onToggleStatus(item: CampagnePreinscriptionDto): void {
    this.toggleStatusRequested.emit(item);
  }

  protected onQr(item: CampagnePreinscriptionDto): void {
    this.qrRequested.emit(item);
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
