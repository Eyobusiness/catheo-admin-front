import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { AffectationAnimateur, RoleAnimateur } from '../../models/affectation-animateur.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-affectation-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './affectation-table.component.html',
  styleUrl: './affectation-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffectationTableComponent {
  public readonly affectations = input<AffectationAnimateur[]>([]);

  public readonly viewRequested = output<AffectationAnimateur>();
  public readonly editRequested = output<AffectationAnimateur>();
  public readonly deleteRequested = output<AffectationAnimateur>();
  public readonly toggleRoleRequested = output<{ id: string; nextRole: RoleAnimateur }>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedAffectations = computed(() => {
    const list = this.affectations();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getInitials(anim?: { nom?: string; prenoms?: string }): string {
    if (!anim) return 'CA';
    const n = anim.nom ? anim.nom[0] : '';
    const p = anim.prenoms ? anim.prenoms[0] : '';
    return (n + p).toUpperCase() || 'CA';
  }

  protected getRoleLabel(role: RoleAnimateur): string {
    switch (role) {
      case 'principal':
        return 'Principal';
      case 'adjoint':
        return 'Adjoint';
      case 'assistant':
        return 'Assistant';
      default:
        return role;
    }
  }

  protected onView(aff: AffectationAnimateur): void {
    this.viewRequested.emit(aff);
  }

  protected onEdit(aff: AffectationAnimateur): void {
    this.editRequested.emit(aff);
  }

  protected onDelete(aff: AffectationAnimateur): void {
    this.deleteRequested.emit(aff);
  }

  protected onCycleRole(aff: AffectationAnimateur): void {
    const nextRole: RoleAnimateur =
      aff.role === 'principal'
        ? 'adjoint'
        : aff.role === 'adjoint'
        ? 'assistant'
        : 'principal';
    this.toggleRoleRequested.emit({ id: aff.id, nextRole });
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
