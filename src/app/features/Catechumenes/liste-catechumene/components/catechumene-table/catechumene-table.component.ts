import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatechumeneDto, StatutCatechumene } from '../../models/catechumene.model';
import { ClasseDto } from '../../../../Organisations/Classe/models/classe.model';
import { NiveauDto } from '../../../../Organisations/Niveaux/models/niveau.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-catechumene-table',
  imports: [CommonModule, AppIconButton, AppButton, AppPagination, HasPermissionDirective],
  templateUrl: './catechumene-table.component.html',
  styleUrl: './catechumene-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatechumeneTableComponent {
  public readonly catechumenes = input<CatechumeneDto[]>([]);
  public readonly classes = input<ClasseDto[]>([]);
  public readonly niveaux = input<NiveauDto[]>([]);

  public readonly viewRequested = output<CatechumeneDto>();
  public readonly editRequested = output<CatechumeneDto>();
  public readonly deleteRequested = output<CatechumeneDto>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedCatechumenes = computed(() => {
    const list = this.catechumenes();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getStatutBadgeClass(statut: StatutCatechumene): string {
    switch (statut) {
      case 'actif': return 'badge-actif';
      case 'abandon': return 'badge-abandon';
      case 'transfere': return 'badge-transfere';
      case 'complete': return 'badge-complete';
      default: return 'badge-actif';
    }
  }

  public getClasseDisplay(item: CatechumeneDto): string {
    if (item.classe_nom) return item.classe_nom;
    if (item.classe?.nom) return item.classe.nom;

    if (item.inscriptions_annuelles && item.inscriptions_annuelles.length > 0) {
      const activeIns = item.inscriptions_annuelles.find((i: any) => i.statut === 'actif' || i.statut_inscription === 'actif') || item.inscriptions_annuelles[0];
      if (activeIns?.classe?.nom) return activeIns.classe.nom;
      if (activeIns?.classe_nom) return activeIns.classe_nom;
      if (activeIns?.classe_id && this.classes().length > 0) {
        const found = this.classes().find(c => String(c.id) === String(activeIns.classe_id));
        if (found?.nom) return found.nom;
      }
    }

    if (item.classe_id && this.classes().length > 0) {
      const found = this.classes().find(c => String(c.id) === String(item.classe_id));
      if (found?.nom) return found.nom;
    }

    return '';
  }

  public getNiveauDisplay(item: CatechumeneDto): string {
    if (item.niveau_nom) return item.niveau_nom;
    if (item.niveau?.nom) return item.niveau.nom;

    if (item.inscriptions_annuelles && item.inscriptions_annuelles.length > 0) {
      const activeIns = item.inscriptions_annuelles.find((i: any) => i.statut === 'actif' || i.statut_inscription === 'actif') || item.inscriptions_annuelles[0];
      if (activeIns?.niveau?.nom) return activeIns.niveau.nom;
      if (activeIns?.niveau_nom) return activeIns.niveau_nom;
      if (activeIns?.classe?.niveau?.nom) return activeIns.classe.niveau.nom;
      if (activeIns?.niveau_id && this.niveaux().length > 0) {
        const found = this.niveaux().find(n => String(n.id) === String(activeIns.niveau_id));
        if (found?.nom) return found.nom;
      }
      if (activeIns?.classe_id && this.classes().length > 0) {
        const cl = this.classes().find(c => String(c.id) === String(activeIns.classe_id));
        if (cl?.niveau?.nom) return cl.niveau.nom;
        if (cl?.niveau_nom) return cl.niveau_nom;
        if (cl?.niveau_id && this.niveaux().length > 0) {
          const niv = this.niveaux().find(n => String(n.id) === String(cl.niveau_id));
          if (niv?.nom) return niv.nom;
        }
      }
    }

    if (item.niveau_id && this.niveaux().length > 0) {
      const found = this.niveaux().find(n => String(n.id) === String(item.niveau_id));
      if (found?.nom) return found.nom;
    }

    if (item.classe_id && this.classes().length > 0) {
      const cl = this.classes().find(c => String(c.id) === String(item.classe_id));
      if (cl?.niveau?.nom) return cl.niveau.nom;
      if (cl?.niveau_nom) return cl.niveau_nom;
      if (cl?.niveau_id && this.niveaux().length > 0) {
        const niv = this.niveaux().find(n => String(n.id) === String(cl.niveau_id));
        if (niv?.nom) return niv.nom;
      }
    }

    return '';
  }

  protected onView(item: CatechumeneDto): void {
    this.viewRequested.emit(item);
  }

  protected onEdit(item: CatechumeneDto): void {
    this.editRequested.emit(item);
  }

  protected onDelete(item: CatechumeneDto): void {
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
