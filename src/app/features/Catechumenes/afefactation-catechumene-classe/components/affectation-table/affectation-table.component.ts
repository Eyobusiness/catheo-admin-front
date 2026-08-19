import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InscriptionAnnuelleDto } from '../../../inscriptions-annuelles/models/inscription-annuelle.model';
import { ClasseDto } from '../../../../Organisations/Classe/models/classe.model';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-affectation-table',
  imports: [CommonModule, AppPagination],
  templateUrl: './affectation-table.component.html',
  styleUrl: './affectation-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffectationTableComponent {
  public readonly inscriptions = input<InscriptionAnnuelleDto[]>([]);
  public readonly classes = input<ClasseDto[]>([]);
  public readonly selectedIds = input<string[]>([]);

  public readonly selectionToggled = output<string>();
  public readonly selectAllToggled = output<boolean>();
  public readonly classChanged = output<{ inscriptionId: string; classeId: string }>();

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

  protected isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  protected isAllSelected(): boolean {
    const currentList = this.paginatedInscriptions();
    if (currentList.length === 0) return false;
    return currentList.every(i => this.selectedIds().includes(i.id));
  }

  protected getFilteredClasses(niveauId?: string): ClasseDto[] {
    if (!niveauId) return this.classes();
    return this.classes().filter(c => c.niveau_id === niveauId || c.niveau?.id === niveauId);
  }

  protected onToggleSelect(id: string): void {
    this.selectionToggled.emit(id);
  }

  protected onToggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAllToggled.emit(checked);
  }

  protected onSelectClass(inscriptionId: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.classChanged.emit({ inscriptionId, classeId: select.value });
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }
}
