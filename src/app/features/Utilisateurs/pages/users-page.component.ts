import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UserService } from '../services/user.service';
import { ProfilService } from '../Profil/services/profil.service';
import { CreateUserDto, StatutUtilisateur, UpdateUserDto, UserItem } from '../models/user.model';
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
  protected readonly users = this.userService.usersList;
  protected readonly profils = this.profilService.profilsList;
  protected readonly isLoading = this.userService.isLoading;
  protected readonly isSaving = this.userService.isSaving;

  // Pagination signals
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(15);
  protected readonly pageSizeOptions = signal<number[]>([10, 15, 25, 50, 100]);

  // Local filter signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedProfilFilter = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');

  // Modals signals
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedUser = signal<UserItem | null>(null);
  protected readonly itemToDelete = signal<UserItem | null>(null);

  protected readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const profId = this.selectedProfilFilter();
    const status = this.selectedStatutFilter();

    // Exclure les super administrateurs : ils gèrent les catéchèses depuis leur propre dashboard
    let list = this.users().filter(u =>
      u.user_type !== 'super_admin' &&
      u.profil?.code !== 'super_admin' &&
      u.profil?.code !== 'SUPER_ADMIN'
    );

    if (profId) {
      list = list.filter(u => u.profil?.uuid === profId || u.profil?.id === profId);
    }

    if (status) {
      list = list.filter(u => u.statut === status || u.status === status);
    }

    if (!q) return list;
    return list.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.nom && u.nom.toLowerCase().includes(q)) ||
      (u.prenoms && u.prenoms.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
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

  // KPI Computeds — basés sur utilisateurs non-super-admin
  protected readonly totalCount = computed(() =>
    this.users().filter(u => u.user_type !== 'super_admin' && u.profil?.code !== 'super_admin').length
  );
  protected readonly activeCount = computed(() =>
    this.users().filter(u =>
      u.user_type !== 'super_admin' &&
      u.profil?.code !== 'super_admin' &&
      (u.statut === 'actif' || u.status === 'actif')
    ).length
  );
  protected readonly inactiveCount = computed(() =>
    this.users().filter(u =>
      u.user_type !== 'super_admin' &&
      u.profil?.code !== 'super_admin' &&
      (u.statut === 'inactif' || u.status === 'inactif')
    ).length
  );
  protected readonly suspendedCount = computed(() => 0);

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
    this.currentPage.set(1);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
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
    this.userService.getUsers(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery(),
      this.selectedStatutFilter(),
      this.selectedProfilFilter()
    ).subscribe();
    this.profilService.getProfils().subscribe();
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

  protected openEditModal(u: UserItem): void {
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
      const id = this.selectedUser()!.uuid || this.selectedUser()!.id;
      this.userService
        .updateUser(id, dto as UpdateUserDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    } else {
      this.userService
        .createUser(dto as CreateUserDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    }
  }

  // Status changed
  protected handleStatusChanged(event: { user: UserItem; nextStatus: StatutUtilisateur }): void {
    const id = event.user.uuid || event.user.id;
    this.userService.toggleStatus(id, event.nextStatus as ('actif' | 'inactif')).subscribe();
  }

  // Delete modal
  protected openDeleteModal(u: UserItem): void {
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
      const id = target.uuid || target.id;
      this.userService.deleteUser(id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
