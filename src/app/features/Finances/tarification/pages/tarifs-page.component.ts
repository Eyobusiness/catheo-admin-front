import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TarifService } from '../services/tarif.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { TarifDto, CreateTarifDto, UpdateTarifDto, TypeTarif } from '../models/tarif.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { TarifTableComponent } from '../components/tarif-table/tarif-table.component';
import { TarifFormModalComponent } from '../components/tarif-form-modal/tarif-form-modal.component';
import { TarifDeleteModalComponent } from '../components/tarif-delete-modal/tarif-delete-modal.component';

@Component({
  selector: 'app-tarifs-page',
  imports: [
    CommonModule,
    AppCard,
    AppButton,
    TarifTableComponent,
    TarifFormModalComponent,
    TarifDeleteModalComponent
  ],
  templateUrl: './tarifs-page.component.html',
  styleUrl: './tarifs-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarifsPageComponent implements OnInit {
  protected readonly tarifService = inject(TarifService);
  protected readonly niveauService = inject(NiveauService);

  protected readonly tarifs = this.tarifService.tarifs;
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly isLoading = this.tarifService.isLoading;

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedTypeFilter = signal<string>('');

  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedTarif = signal<TarifDto | null>(null);

  protected readonly totalTarifs = computed(() => this.tarifs().length);
  protected readonly tarifsObligatoires = computed(() => this.tarifs().filter(t => t.est_obligatoire).length);
  protected readonly totalMontantInscriptions = computed(() => {
    return this.tarifs()
      .filter(t => t.type_tarif === 'inscription')
      .reduce((sum, t) => sum + t.montant, 0);
  });
  protected readonly typesTarifsCount = computed(() => {
    const set = new Set(this.tarifs().map(t => t.type_tarif));
    return set.size;
  });

  protected readonly filteredTarifs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const type = this.selectedTypeFilter();
    let list = this.tarifs();

    if (type) {
      list = list.filter(t => t.type_tarif === type);
    }

    if (!q) return list;
    return list.filter(t =>
      t.intitule.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.niveau?.nom && t.niveau.nom.toLowerCase().includes(q))
    );
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedTypeFilter();
  });

  public ngOnInit(): void {
    this.tarifService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected onTypeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedTypeFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedTypeFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedTarif.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(item: TarifDto): void {
    this.isEditing.set(true);
    this.selectedTarif.set(item);
    this.isFormModalOpen.set(true);
  }

  protected openDeleteModal(item: TarifDto): void {
    this.selectedTarif.set(item);
    this.isDeleteModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedTarif.set(null);
  }

  protected handleFormSubmit(dto: CreateTarifDto | UpdateTarifDto): void {
    if (this.isEditing() && this.selectedTarif()) {
      this.tarifService.update(this.selectedTarif()!.id, dto as UpdateTarifDto).subscribe(() => {
        this.closeModals();
      });
    } else {
      this.tarifService.create(dto as CreateTarifDto).subscribe(() => {
        this.closeModals();
      });
    }
  }

  protected handleToggleStatus(item: TarifDto): void {
    this.tarifService.toggleStatus(item.id).subscribe();
  }

  protected handleGenererOperations(item: TarifDto): void {
    this.tarifService.genererOperations(item.id).subscribe();
  }

  protected handleDeleteConfirm(): void {
    const item = this.selectedTarif();
    if (item) {
      this.tarifService.delete(item.id).subscribe(() => {
        this.closeModals();
      });
    }
  }
}
