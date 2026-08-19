import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UserService } from '../services/user.service';
import { ProfilService } from '../Profil/services/profil.service';
import { CreateUserDto, StatutUtilisateur, UpdateUserDto, UserDto } from '../models/user.model';
import { AppCard } from '../../../shared/ui/components/layout/app-card/app-card.component';
import { AppPagination } from '../../../shared/ui/components/tables/app-pagination/app-pagination.component';
import { AppIconButton } from '../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../shared/ui/components/buttons/app-button/app-button.component';
import { UserTableComponent } from '../components/user-table/user-table.component';
import { UserFormModalComponent } from '../components/user-form-modal/user-form-modal.component';
import { UserDeleteModalComponent } from '../components/user-delete-modal/user-delete-modal.component';

@Component({
  selector: 'app-users-page',
  imports: [
    AppCard,
    AppButton,
    AppIconButton,
    AppPagination,
    UserTableComponent,
    UserFormModalComponent,
    UserDeleteModalComponent
  ],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPageComponent {
  protected readonly userService = inject(UserService);
  protected readonly profilService = inject(ProfilService);

  // State signals
  protected readonly users = this.userService.users;
  protected readonly profils = this.profilService.profils;
  protected readonly isLoading = this.userService.isLoading;
  protected readonly isSaving = this.userService.isSaving;

  // Pagination signals
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);
  protected readonly pageSizeOptions = signal<number[]>([10, 25, 50, 100]);
  // Local filter signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedProfilFilter = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');

  // Modals signals
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedUser = signal<UserDto | null>(null);
  protected readonly itemToDelete = signal<UserDto | null>(null);

  protected readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const profId = this.selectedProfilFilter();
    const status = this.selectedStatutFilter();
    let list = this.users();

    if (profId) {
      list = list.filter(u => u.profil?.id === profId);
    }

    if (status) {
      list = list.filter(u => u.statut === status);
    }

    if (!q) return list;
    return list.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.telephone && u.telephone.includes(q)) ||
      (u.profil && u.profil.nom.toLowerCase().includes(q))
    );
  });

  // Paginated users based on pagination signals
  protected readonly paginatedUsers = computed(() => {
    const list = this.filteredUsers();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  // KPI Computeds
  protected readonly totalCount = computed(() => this.users().length);
  protected readonly activeCount = computed(() => this.users().filter(u => u.statut === 'actif').length);
  protected readonly inactiveCount = computed(() => this.users().filter(u => u.statut === 'inactif').length);
  protected readonly suspendedCount = computed(() => this.users().filter(u => u.statut === 'suspendu').length);

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    // Reset pagination when search changes
    this.currentPage.set(1);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onProfilFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedProfilFilter.set(select.value);
    this.currentPage.set(1);
  }

  protected onStatutFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatutFilter.set(select.value);
    this.currentPage.set(1);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedProfilFilter.set('');
    this.selectedStatutFilter.set('');
    this.currentPage.set(1);
  }

  protected refreshList(): void {
    this.userService.getAll().subscribe();
    this.profilService.getAll().subscribe();
    // Reset pagination to first page after refresh
    this.currentPage.set(1);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  // Create / Edit modal
  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedUser.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(u: UserDto): void {
    this.isEditing.set(true);
    this.selectedUser.set(u);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedUser.set(null);
  }

  protected handleFormSubmit(dto: CreateUserDto | UpdateUserDto): void {
    if (this.isEditing() && this.selectedUser()) {
      this.userService
        .update(this.selectedUser()!.id, dto as UpdateUserDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    } else {
      this.userService
        .create(dto as CreateUserDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    }
    // After any add/update, reset to first page to show newest items
    this.currentPage.set(1);
  }

  // Status changed
  protected handleStatusChanged(event: { user: UserDto; nextStatus: StatutUtilisateur }): void {
    this.userService.patchStatus(event.user.id, event.nextStatus).subscribe();
  }

  // Delete modal
  protected openDeleteModal(u: UserDto): void {
    this.itemToDelete.set(u);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.userService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
        // After deletion, stay on current page if possible
        const total = this.filteredUsers().length;
        const maxPage = Math.ceil(total / this.pageSize());
        if (this.currentPage() > maxPage) this.currentPage.set(maxPage);
      });
    }
  }
}
