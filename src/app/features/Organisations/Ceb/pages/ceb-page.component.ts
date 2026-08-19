import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CebService } from '../services/ceb.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Ceb, CreateCebDto, UpdateCebDto } from '../models/ceb.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { CebTableComponent } from '../components/ceb-table/ceb-table.component';
import { CebFormModalComponent } from '../components/ceb-form-modal/ceb-form-modal.component';
import { CebDeleteModalComponent } from '../components/ceb-delete-modal/ceb-delete-modal.component';

@Component({
  selector: 'app-ceb-page',
  imports: [
    AppCard,
    AppButton,
    CebTableComponent,
    CebFormModalComponent,
    CebDeleteModalComponent
  ],
  templateUrl: './ceb-page.component.html',
  styleUrl: './ceb-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CebPageComponent implements OnInit {
  protected readonly cebService = inject(CebService);
  protected readonly toastService = inject(ToastService);

  // Signals from Service
  protected readonly cebs = this.cebService.cebs;
  protected readonly isLoading = this.cebService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedCeb = signal<Ceb | null>(null);
  protected readonly itemToDelete = signal<Ceb | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedStatutFilter();
  });

  public ngOnInit(): void {
    this.cebService.getAll().subscribe();
  }

  protected readonly filteredCebs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const statutFilter = this.selectedStatutFilter();
    let list: Ceb[] = this.cebs();

    if (statutFilter) {
      list = list.filter(c => c.statut.toLowerCase() === statutFilter.toLowerCase() || c.statut_code === statutFilter);
    }

    if (!q) return list;
    return list.filter((c: Ceb) =>
      c.nom.toLowerCase().includes(q) ||
      (c.responsable && c.responsable.toLowerCase().includes(q)) ||
      (c.telephone && c.telephone.toLowerCase().includes(q)) ||
      (c.adresse && c.adresse.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

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

  protected resetAllFilters(): void {
    this.searchQuery.set('');
    this.selectedStatutFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedCeb.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(ceb: Ceb): void {
    this.isEditing.set(true);
    this.selectedCeb.set(ceb);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedCeb.set(null);
  }

  protected handleView(ceb: Ceb): void {
    this.toastService.info(
      `CEB : ${ceb.nom}`,
      `Responsable : ${ceb.responsable || 'Non assigné'} • Tél : ${ceb.telephone || '—'} • ${ceb.total_inscriptions || 0} inscrits`
    );
  }

  protected handleFormSubmit(dto: CreateCebDto | UpdateCebDto): void {
    if (this.isEditing() && this.selectedCeb()) {
      this.cebService.update(this.selectedCeb()!.id, dto as UpdateCebDto).subscribe(() => {
        this.closeFormModal();
      });
    } else {
      this.cebService.create(dto as CreateCebDto).subscribe(() => {
        this.closeFormModal();
      });
    }
  }

  protected handleToggleStatus(ceb: Ceb): void {
    this.cebService.toggleStatus(ceb).subscribe();
  }

  protected openDeleteModal(ceb: Ceb): void {
    this.itemToDelete.set(ceb);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.cebService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
