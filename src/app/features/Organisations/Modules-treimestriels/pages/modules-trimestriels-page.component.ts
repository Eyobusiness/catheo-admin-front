import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ModuleTrimestrielService } from '../services/module-trimestriel.service';
import { AnneeCatecheseService } from '../../AnneesPastorales/services/annee-catechese.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  CreateModuleTrimestrielDto,
  ModuleTrimestriel,
  UpdateModuleTrimestrielDto
} from '../models/module-trimestriel.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { ModuleTrimestrielTableComponent } from '../components/module-trimestriel-table/module-trimestriel-table.component';
import { ModuleTrimestrielFormModalComponent } from '../components/module-trimestriel-form-modal/module-trimestriel-form-modal.component';
import { ModuleTrimestrielDeleteModalComponent } from '../components/module-trimestriel-delete-modal/module-trimestriel-delete-modal.component';

@Component({
  selector: 'app-modules-trimestriels-page',
  imports: [
    AppCard,
    AppButton,
    ModuleTrimestrielTableComponent,
    ModuleTrimestrielFormModalComponent,
    ModuleTrimestrielDeleteModalComponent
  ],
  templateUrl: './modules-trimestriels-page.component.html',
  styleUrl: './modules-trimestriels-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModulesTrimestrielsPageComponent implements OnInit {
  protected readonly moduleService = inject(ModuleTrimestrielService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly toastService = inject(ToastService);

  // Signals from Services
  protected readonly modules = this.moduleService.modules;
  protected readonly annees = this.anneeService.annees;
  protected readonly isLoading = this.moduleService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedAnneeFilter = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedModule = signal<ModuleTrimestriel | null>(null);
  protected readonly itemToDelete = signal<ModuleTrimestriel | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedAnneeFilter();
  });

  public ngOnInit(): void {
    this.anneeService.getAll().subscribe();
    this.moduleService.getAll().subscribe();
  }

  protected readonly filteredModules = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const anneeFilter = this.selectedAnneeFilter();
    let list: ModuleTrimestriel[] = this.modules();

    if (anneeFilter) {
      list = list.filter(m => m.annee_catechese_id === anneeFilter || m.annee_catechese?.id === anneeFilter);
    }

    if (!q) return list;
    return list.filter((m: ModuleTrimestriel) =>
      m.libelle.toLowerCase().includes(q) ||
      (m.statut && m.statut.toLowerCase().includes(q)) ||
      (m.annee_catechese?.libelle && m.annee_catechese.libelle.toLowerCase().includes(q)) ||
      (m.date_debut && m.date_debut.includes(q)) ||
      (m.date_fin && m.date_fin.includes(q))
    );
  });

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onAnneeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedAnneeFilter.set(select.value);
  }

  protected resetAllFilters(): void {
    this.searchQuery.set('');
    this.selectedAnneeFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedModule.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(mod: ModuleTrimestriel): void {
    this.isEditing.set(true);
    this.selectedModule.set(mod);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedModule.set(null);
    this.isEditing.set(false);
  }

  protected handleView(mod: ModuleTrimestriel): void {
    const anneeLibelle = mod.annee_catechese?.libelle ||
      this.annees().find(a => a.id === mod.annee_catechese_id)?.libelle ||
      'Année en cours';
    this.toastService.info(
      `Module : ${mod.libelle}`,
      `Statut : ${mod.statut || 'En cours'} • Année : ${anneeLibelle} • Du ${mod.date_debut} au ${mod.date_fin}`
    );
  }

  protected handleFormSubmit(dto: CreateModuleTrimestrielDto | UpdateModuleTrimestrielDto): void {
    if (this.isEditing() && this.selectedModule()) {
      this.moduleService
        .update(this.selectedModule()!.id, dto as UpdateModuleTrimestrielDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    } else {
      this.moduleService
        .create(dto as CreateModuleTrimestrielDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    }
  }

  protected openDeleteModal(mod: ModuleTrimestriel): void {
    this.itemToDelete.set(mod);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.moduleService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}

