import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SauvegardeService } from '../services/sauvegarde.service';
import { CreateSauvegardeRequest, SauvegardeDto, StatutSauvegarde, TypeSauvegarde } from '../models/sauvegarde.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppIconButton } from '../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { SauvegardeStatsCardsComponent } from '../components/sauvegarde-stats-cards/sauvegarde-stats-cards.component';
import { SauvegardeTableComponent } from '../components/sauvegarde-table/sauvegarde-table.component';
import { SauvegardeCreateModalComponent } from '../components/sauvegarde-create-modal/sauvegarde-create-modal.component';
import { SauvegardeRestaurerModalComponent } from '../components/sauvegarde-restaurer-modal/sauvegarde-restaurer-modal.component';
import { SauvegardeDeleteModalComponent } from '../components/sauvegarde-delete-modal/sauvegarde-delete-modal.component';

@Component({
  selector: 'app-sauvegardes-page',
  imports: [
    AppCard,
    AppButton,
    AppIconButton,
    SauvegardeStatsCardsComponent,
    SauvegardeTableComponent,
    SauvegardeCreateModalComponent,
    SauvegardeRestaurerModalComponent,
    SauvegardeDeleteModalComponent
  ],
  templateUrl: './sauvegardes-page.component.html',
  styleUrl: './sauvegardes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SauvegardesPageComponent {
  protected readonly sauvegardeService = inject(SauvegardeService);

  // State from service
  protected readonly sauvegardes = this.sauvegardeService.sauvegardes;
  protected readonly isLoading = this.sauvegardeService.isLoading;
  protected readonly isActionInProgress = this.sauvegardeService.isActionInProgress;

  // Local filter signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedTypeFilter = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');

  // Modals state signals
  protected readonly isCreateModalOpen = signal<boolean>(false);
  protected readonly isRestaurerModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);

  protected readonly selectedSauvegarde = signal<SauvegardeDto | null>(null);

  protected readonly filteredSauvegardes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const type = this.selectedTypeFilter();
    const status = this.selectedStatutFilter();
    let list = this.sauvegardes();

    if (type) {
      list = list.filter(s => s.type === type);
    }

    if (status) {
      list = list.filter(s => s.statut === status);
    }

    if (!q) return list;
    return list.filter(s =>
      s.nom_fichier.toLowerCase().includes(q) ||
      (s.cree_par && s.cree_par.toLowerCase().includes(q)) ||
      (s.date && s.date.includes(q))
    );
  });

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onTypeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedTypeFilter.set(select.value);
  }

  protected onStatutFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatutFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedTypeFilter.set('');
    this.selectedStatutFilter.set('');
  }

  protected refreshList(): void {
    this.sauvegardeService.getAll().subscribe();
  }

  // Create modal handlers
  protected openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  protected handleCreateSubmit(request: CreateSauvegardeRequest): void {
    this.sauvegardeService.create(request).subscribe(() => {
      this.closeCreateModal();
    });
  }

  // Download handler
  protected handleDownload(s: SauvegardeDto): void {
    this.sauvegardeService.download(s.id, s.nom_fichier);
  }

  // Restore modal handlers
  protected openRestaurerModal(s: SauvegardeDto): void {
    this.selectedSauvegarde.set(s);
    this.isRestaurerModalOpen.set(true);
  }

  protected closeRestaurerModal(): void {
    this.isRestaurerModalOpen.set(false);
    this.selectedSauvegarde.set(null);
  }

  protected handleRestaurerConfirm(): void {
    const target = this.selectedSauvegarde();
    if (target) {
      this.sauvegardeService.restaurer(target.id).subscribe(() => {
        this.closeRestaurerModal();
      });
    }
  }

  // Delete modal handlers
  protected openDeleteModal(s: SauvegardeDto): void {
    this.selectedSauvegarde.set(s);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.selectedSauvegarde.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.selectedSauvegarde();
    if (target) {
      this.sauvegardeService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
