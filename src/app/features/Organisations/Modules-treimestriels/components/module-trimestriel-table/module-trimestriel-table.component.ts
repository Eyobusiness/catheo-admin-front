import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ModuleTrimestriel } from '../../models/module-trimestriel.model';
import { AnneeCatechese } from '../../../AnneesPastorales/models/annee-catechese.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-module-trimestriel-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './module-trimestriel-table.component.html',
  styleUrl: './module-trimestriel-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleTrimestrielTableComponent {
  public readonly modules = input<ModuleTrimestriel[]>([]);
  public readonly annees = input<AnneeCatechese[]>([]);

  public readonly viewRequested = output<ModuleTrimestriel>();
  public readonly editRequested = output<ModuleTrimestriel>();
  public readonly deleteRequested = output<ModuleTrimestriel>();
  public readonly createRequested = output<void>();


  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedModules = computed(() => {
    const list = this.modules();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getAnneeLibelle(mod: ModuleTrimestriel): string {
    if (mod.annee_catechese?.libelle) return mod.annee_catechese.libelle;
    const anneeId = mod.annee_catechese_id || mod.annee_catechese?.id;
    if (anneeId) {
      const a = this.annees().find(an => an.id === anneeId);
      if (a) return a.libelle;
    }
    return 'Année pastorale';
  }

  protected isModuleEnCours(mod: ModuleTrimestriel): boolean {
    const s = String(mod.statut || '').trim().toLowerCase();
    if (s === 'termine' || s === 'terminé' || s === 'completed') return false;
    return true;
  }

  protected getStatutLabel(mod: ModuleTrimestriel): string {
    return this.isModuleEnCours(mod) ? 'En cours' : 'Terminé';
  }

  protected getPeriodStatus(dateDebut: string, dateFin: string): { label: string; type: 'current' | 'future' | 'past' } {
    if (!dateDebut || !dateFin) {
      return { label: 'Non défini', type: 'future' };
    }
    const now = new Date();
    const dStart = new Date(dateDebut);
    const dEnd = new Date(dateFin);

    if (now >= dStart && now <= dEnd) {
      return { label: 'En cours', type: 'current' };
    }
    if (now < dStart) {
      return { label: 'À venir', type: 'future' };
    }
    return { label: 'Terminé', type: 'past' };
  }

  protected onView(mod: ModuleTrimestriel): void {
    this.viewRequested.emit(mod);
  }

  protected onEdit(mod: ModuleTrimestriel): void {
    this.editRequested.emit(mod);
  }

  protected onDelete(mod: ModuleTrimestriel): void {
    this.deleteRequested.emit(mod);
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

