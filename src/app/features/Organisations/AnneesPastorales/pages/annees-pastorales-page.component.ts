import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AnneeCatecheseService } from '../services/annee-catechese.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AnneeCatechese, CreateAnneeCatecheseDto, UpdateAnneeCatecheseDto } from '../models/annee-catechese.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AnneeTableComponent } from '../components/annee-table/annee-table.component';
import { AnneeFormModalComponent } from '../components/annee-form-modal/annee-form-modal.component';
import { AnneeDeleteModalComponent } from '../components/annee-delete-modal/annee-delete-modal.component';

@Component({
  selector: 'app-annees-pastorales-page',
  imports: [
    AppCard,
    AppButton,
    AnneeTableComponent,
    AnneeFormModalComponent,
    AnneeDeleteModalComponent
  ],
  templateUrl: './annees-pastorales-page.component.html',
  styleUrl: './annees-pastorales-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnneesPastoralesPageComponent {
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly toastService = inject(ToastService);

  // Signals from Service
  protected readonly annees = this.anneeService.annees;
  protected readonly isLoading = this.anneeService.isLoading;
  protected readonly activeAnnee = this.anneeService.activeAnnee;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedAnnee = signal<AnneeCatechese | null>(null);
  protected readonly itemToDelete = signal<AnneeCatechese | null>(null);

  protected readonly filteredAnnees = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list: AnneeCatechese[] = this.annees();
    if (!q) return list;
    return list.filter((a: AnneeCatechese) =>
      a.libelle.toLowerCase().includes(q) ||
      a.date_debut.includes(q) ||
      a.date_fin.includes(q)
    );
  });

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedAnnee.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(annee: AnneeCatechese): void {
    this.isEditing.set(true);
    this.selectedAnnee.set(annee);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedAnnee.set(null);
  }

  protected handleView(annee: AnneeCatechese): void {
    this.toastService.info(
      `Détails : ${annee.libelle}`,
      `Période : ${annee.date_debut} au ${annee.date_fin} • Statut : ${annee.est_active ? 'Active' : 'Inactive'} • Inscrits : ${annee.total_inscrits || 0}`
    );
  }

  protected handleFormSubmit(dto: CreateAnneeCatecheseDto | UpdateAnneeCatecheseDto): void {
    if (this.isEditing() && this.selectedAnnee()) {
      this.anneeService.update(this.selectedAnnee()!.id, dto).subscribe(() => {
        this.closeFormModal();
      });
    } else {
      this.anneeService.create(dto).subscribe(() => {
        this.closeFormModal();
      });
    }
  }

  protected handleToggleActive(annee: AnneeCatechese): void {
    this.anneeService.toggleActive(annee).subscribe();
  }

  protected openDeleteModal(annee: AnneeCatechese): void {
    this.itemToDelete.set(annee);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.anneeService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
