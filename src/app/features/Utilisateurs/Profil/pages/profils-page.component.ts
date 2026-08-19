import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ProfilService } from '../services/profil.service';
import { CreateProfilDto, ProfilDto, UpdateProfilDto } from '../models/profil.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppIconButton } from '../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { ProfilTableComponent } from '../components/profil-table/profil-table.component';
import { ProfilFormModalComponent } from '../components/profil-form-modal/profil-form-modal.component';
import { ProfilDeleteModalComponent } from '../components/profil-delete-modal/profil-delete-modal.component';

@Component({
  selector: 'app-profils-page',
  imports: [
    AppCard,
    AppButton,
    AppIconButton,
    ProfilTableComponent,
    ProfilFormModalComponent,
    ProfilDeleteModalComponent
  ],
  templateUrl: './profils-page.component.html',
  styleUrl: './profils-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilsPageComponent {
  protected readonly profilService = inject(ProfilService);

  // State signals
  protected readonly profils = this.profilService.profils;
  protected readonly isLoading = this.profilService.isLoading;
  protected readonly isSaving = this.profilService.isSaving;

  // Local filter signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');

  // Modals signals
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedProfil = signal<ProfilDto | null>(null);
  protected readonly itemToDelete = signal<ProfilDto | null>(null);

  protected readonly filteredProfils = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatutFilter();
    let list = this.profils();

    if (status) {
      list = list.filter(p => p.statut === status);
    }

    if (!q) return list;
    return list.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  // KPI Computeds
  protected readonly totalCount = computed(() => this.profils().length);
  protected readonly activeCount = computed(() => this.profils().filter(p => p.statut === 'actif').length);
  protected readonly systemCount = computed(() => this.profils().filter(p => p.is_system).length);

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onStatutFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatutFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatutFilter.set('');
  }

  protected refreshList(): void {
    this.profilService.getAll().subscribe();
    this.profilService.getPermissionsTree().subscribe();
  }

  // Create / Edit modal
  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedProfil.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(p: ProfilDto): void {
    this.isEditing.set(true);
    this.selectedProfil.set(p);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedProfil.set(null);
  }

  protected handleFormSubmit(dto: CreateProfilDto | UpdateProfilDto): void {
    if (this.isEditing() && this.selectedProfil()) {
      this.profilService
        .update(this.selectedProfil()!.id, dto as UpdateProfilDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    } else {
      this.profilService
        .create(dto as CreateProfilDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    }
  }

  // Toggle status
  protected handleToggleStatus(p: ProfilDto): void {
    if (p.is_system) return;
    const nextStatus: 'actif' | 'inactif' = p.statut === 'actif' ? 'inactif' : 'actif';
    this.profilService.patchStatus(p.id, nextStatus).subscribe();
  }

  // Delete modal
  protected openDeleteModal(p: ProfilDto): void {
    this.itemToDelete.set(p);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.profilService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
