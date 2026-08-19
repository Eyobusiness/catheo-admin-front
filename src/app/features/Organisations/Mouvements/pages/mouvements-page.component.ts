import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MouvementService } from '../services/mouvement.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CreateMouvementDto, Mouvement, UpdateMouvementDto } from '../models/mouvement.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { MouvementTableComponent } from '../components/mouvement-table/mouvement-table.component';
import { MouvementFormModalComponent } from '../components/mouvement-form-modal/mouvement-form-modal.component';
import { MouvementDeleteModalComponent } from '../components/mouvement-delete-modal/mouvement-delete-modal.component';

@Component({
  selector: 'app-mouvements-page',
  imports: [
    AppCard,
    AppButton,
    MouvementTableComponent,
    MouvementFormModalComponent,
    MouvementDeleteModalComponent
  ],
  templateUrl: './mouvements-page.component.html',
  styleUrl: './mouvements-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MouvementsPageComponent implements OnInit {
  protected readonly mouvementService = inject(MouvementService);
  protected readonly toastService = inject(ToastService);

  // Signals from Service
  protected readonly mouvements = this.mouvementService.mouvements;
  protected readonly isLoading = this.mouvementService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedMouvement = signal<Mouvement | null>(null);
  protected readonly itemToDelete = signal<Mouvement | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedStatutFilter();
  });

  public ngOnInit(): void {
    this.mouvementService.getAll().subscribe();
  }

  protected readonly filteredMouvements = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const statutFilter = this.selectedStatutFilter();
    let list: Mouvement[] = this.mouvements();

    if (statutFilter) {
      list = list.filter(m => m.statut.toLowerCase() === statutFilter.toLowerCase() || m.statut_code === statutFilter);
    }

    if (!q) return list;
    return list.filter((m: Mouvement) =>
      m.nom.toLowerCase().includes(q) ||
      (m.responsable && m.responsable.toLowerCase().includes(q)) ||
      (m.telephone && m.telephone.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q))
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
    this.selectedMouvement.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(mouvement: Mouvement): void {
    this.isEditing.set(true);
    this.selectedMouvement.set(mouvement);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedMouvement.set(null);
  }

  protected handleView(mouvement: Mouvement): void {
    this.toastService.info(
      `Mouvement : ${mouvement.nom}`,
      `Responsable : ${mouvement.responsable || 'Non assigné'} • Tél : ${mouvement.telephone || '—'} • ${mouvement.total_inscriptions || 0} adhérent(s)`
    );
  }

  protected handleFormSubmit(dto: CreateMouvementDto | UpdateMouvementDto): void {
    if (this.isEditing() && this.selectedMouvement()) {
      this.mouvementService.update(this.selectedMouvement()!.id, dto as UpdateMouvementDto).subscribe(() => {
        this.closeFormModal();
      });
    } else {
      this.mouvementService.create(dto as CreateMouvementDto).subscribe(() => {
        this.closeFormModal();
      });
    }
  }

  protected handleToggleStatus(mouvement: Mouvement): void {
    this.mouvementService.toggleStatus(mouvement).subscribe();
  }

  protected openDeleteModal(mouvement: Mouvement): void {
    this.itemToDelete.set(mouvement);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.mouvementService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
