import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Classe } from '../../models/classe.model';
import { Niveau } from '../../../Niveaux/models/niveau.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-classe-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './classe-table.component.html',
  styleUrl: './classe-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClasseTableComponent {
  public readonly classes = input<Classe[]>([]);
  public readonly niveaux = input<Niveau[]>([]);

  public readonly viewRequested = output<Classe>();
  public readonly editRequested = output<Classe>();
  public readonly deleteRequested = output<Classe>();
  public readonly toggleStatusRequested = output<Classe>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedClasses = computed(() => {
    const list = this.classes();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected isActif(classe: Classe): boolean {
    return String(classe.statut).toLowerCase() === 'active';
  }

  protected getNiveauName(niveauId?: string): string {
    if (!niveauId) return 'Niveau';
    const n = this.niveaux().find(niv => niv.id === niveauId);
    return n ? n.nom : 'Niveau';
  }

  protected getOccupationPercentage(classe: Classe): number {
    const max = classe.capacite_max || 30;
    const current = classe.effectif_actuel || 0;
    return Math.min(100, Math.round((current / max) * 100));
  }

  protected onView(classe: Classe): void {
    this.viewRequested.emit(classe);
  }

  protected onEdit(classe: Classe): void {
    this.editRequested.emit(classe);
  }

  protected onDelete(classe: Classe): void {
    this.deleteRequested.emit(classe);
  }

  protected onToggleStatus(classe: Classe): void {
    this.toggleStatusRequested.emit(classe);
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
