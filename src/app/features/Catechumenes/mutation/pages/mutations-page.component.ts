import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MutationCatechumeneService } from '../services/mutation.service';
import { CatechumeneService } from '../../liste-catechumene/services/catechumene.service';
import { AnneeCatecheseService } from '../../../Organisations/AnneesPastorales/services/annee-catechese.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  MutationCatechumeneDto,
  CreateMutationCatechumeneDto,
  StatutMutation
} from '../models/mutation.model';
import { CatechumeneDto } from '../../liste-catechumene/models/catechumene.model';
import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { MutationTableComponent } from '../components/mutation-table/mutation-table.component';
import { MutationFormModalComponent } from '../components/mutation-form-modal/mutation-form-modal.component';
import { MutationDetailModalComponent } from '../components/mutation-detail-modal/mutation-detail-modal.component';
import { MutationDeleteModalComponent } from '../components/mutation-delete-modal/mutation-delete-modal.component';

@Component({
  selector: 'app-mutations-page',
  imports: [
    AppCard,
    AppButton,
    MutationTableComponent,
    MutationFormModalComponent,
    MutationDetailModalComponent,
    MutationDeleteModalComponent
  ],
  templateUrl: './mutations-page.component.html',
  styleUrl: './mutations-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MutationsPageComponent implements OnInit {
  protected readonly mutationService = inject(MutationCatechumeneService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly toastService = inject(ToastService);

  // Signals
  protected readonly mutations = this.mutationService.mutations;
  protected readonly catechumenes = this.catechumeneService.catechumenes;
  protected readonly annees = this.anneeService.annees;
  protected readonly isLoading = this.mutationService.isLoading;

  // Local Page Filters
  protected readonly searchQuery = signal<string>('');
  protected readonly statusFilter = signal<string>(''); // '' | 'demande' | 'approuve' | 'refuse'

  // Modals state
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDetailModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly selectedItem = signal<MutationCatechumeneDto | null>(null);
  protected readonly itemToDelete = signal<MutationCatechumeneDto | null>(null);

  // Stats
  protected readonly stats = computed(() => {
    const list = this.mutations();
    return {
      total: list.length,
      demandes: list.filter(m => m.statut === 'demande').length,
      approuves: list.filter(m => m.statut === 'approuve').length,
      refuses: list.filter(m => m.statut === 'refuse').length
    };
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.statusFilter();
  });

  protected readonly filteredMutations = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sf = this.statusFilter();
    let list = this.mutations();

    if (sf) {
      list = list.filter(m => m.statut === sf);
    }

    if (!q) return list;
    return list.filter(m =>
      (m.catechumene?.nom && m.catechumene.nom.toLowerCase().includes(q)) ||
      (m.catechumene?.prenoms && m.catechumene.prenoms.toLowerCase().includes(q)) ||
      (m.paroisse_destination_nom && m.paroisse_destination_nom.toLowerCase().includes(q)) ||
      (m.paroisse_origine_nom && m.paroisse_origine_nom.toLowerCase().includes(q)) ||
      (m.motif && m.motif.toLowerCase().includes(q))
    );
  });

  public ngOnInit(): void {
    this.mutationService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.anneeService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
  }

  protected resetAllFilters(): void {
    this.resetFilters();
  }

  protected openCreateModal(): void {
    this.selectedItem.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openDetailModal(item: MutationCatechumeneDto): void {
    this.selectedItem.set(item);
    this.isDetailModalOpen.set(true);
  }

  protected openDeleteModal(item: MutationCatechumeneDto): void {
    this.itemToDelete.set(item);
    this.isDeleteModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isDetailModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedItem.set(null);
    this.itemToDelete.set(null);
  }

  protected handleFormSubmit(event: {
    dto: CreateMutationCatechumeneDto;
    catechumene?: CatechumeneDto;
    annee?: AnneeCatecheseDto;
  }): void {
    this.mutationService.create(event.dto, event).subscribe(() => {
      this.closeModals();
    });
  }

  protected handleApprove(item: MutationCatechumeneDto): void {
    this.mutationService.updateStatus(item.id, 'approuve').subscribe();
  }

  protected handleRefuse(item: MutationCatechumeneDto): void {
    this.mutationService.updateStatus(item.id, 'refuse').subscribe();
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.mutationService.delete(target.id).subscribe(() => {
        this.closeModals();
      });
    }
  }
}
