import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Animateur } from '../../models/animateur.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-animateur-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './animateur-table.component.html',
  styleUrl: './animateur-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimateurTableComponent {
  public readonly animateurs = input<Animateur[]>([]);

  public readonly viewRequested = output<Animateur>();
  public readonly editRequested = output<Animateur>();
  public readonly deleteRequested = output<Animateur>();
  public readonly toggleStatusRequested = output<Animateur>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedAnimateurs = computed(() => {
    const list = this.animateurs();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected isActif(animateur: Animateur): boolean {
    return animateur.statut === 'actif';
  }

  protected getInitials(animateur: Animateur): string {
    const n = animateur.nom ? animateur.nom[0] : '';
    const p = animateur.prenoms ? animateur.prenoms[0] : '';
    return (n + p).toUpperCase() || 'CA';
  }

  protected onView(animateur: Animateur): void {
    this.viewRequested.emit(animateur);
  }

  protected onEdit(animateur: Animateur): void {
    this.editRequested.emit(animateur);
  }

  protected onDelete(animateur: Animateur): void {
    this.deleteRequested.emit(animateur);
  }

  protected onToggleStatus(animateur: Animateur): void {
    this.toggleStatusRequested.emit(animateur);
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
