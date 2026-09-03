import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ProfilService } from '../services/profil.service';
import { CreateProfilDto, ProfilItem, UpdateProfilDto } from '../models/profil.model';
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
  protected readonly profils = this.profilService.profilsList;
  protected readonly isLoading = this.profilService.isLoading;
  protected readonly isSaving = this.profilService.isSaving;

  // Local filter signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');

  // Modals signals
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedProfil = signal<ProfilItem | null>(null);
  protected readonly itemToDelete = signal<ProfilItem | null>(null);

  protected readonly filteredProfils = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatutFilter();

    // Exclure le profil super administrateur (réservé au dashboard super admin)
    let list = this.profils().filter(p =>
      p.code !== 'super_admin' &&
      p.code !== 'SUPER_ADMIN' &&
      p.code?.toLowerCase() !== 'super_admin'
    );

    if (status) {
      list = list.filter(p => p.statut_code === status || p.statut?.toLowerCase() === status.toLowerCase());
    }

    if (!q) return list;
    return list.filter(p =>
      (p.nom && p.nom.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  // KPI Computeds — super admin exclu
  protected readonly totalCount = computed(() =>
    this.profils().filter(p => p.code?.toLowerCase() !== 'super_admin').length
  );
  protected readonly activeCount = computed(() =>
    this.profils().filter(p =>
      p.code?.toLowerCase() !== 'super_admin' &&
      (p.statut_code === 'actif' || p.statut?.toLowerCase() === 'actif')
    ).length
  );
  protected readonly systemCount = computed(() =>
    this.profils().filter(p => p.is_system && p.code?.toLowerCase() !== 'super_admin').length
  );

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
    this.profilService.getProfils().subscribe();
    this.profilService.getPermissionsTree().subscribe();
  }

  // Create / Edit modal
  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedProfil.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(p: ProfilItem): void {
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
      const id = this.selectedProfil()!.uuid || this.selectedProfil()!.id;
      this.profilService
        .updateProfil(id, dto as UpdateProfilDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    } else {
      this.profilService
        .createProfil(dto as CreateProfilDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    }
  }

  // Toggle status
  protected handleToggleStatus(p: ProfilItem): void {
    if (p.is_system) return;
    const id = p.uuid || p.id;
    this.profilService.toggleStatus(id).subscribe();
  }

  // Delete modal
  protected openDeleteModal(p: ProfilItem): void {
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
      const id = target.uuid || target.id;
      this.profilService.deleteProfil(id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
