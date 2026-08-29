import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { VersementCureService } from '../services/versement.service';
import {
  VersementCureDto,
  CreateVersementDto,
  UpdateVersementDto,
  StatutVersement
} from '../models/versement.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { VersementTableComponent } from '../components/versement-table/versement-table.component';
import { VersementFormModalComponent } from '../components/versement-form-modal/versement-form-modal.component';
import { VersementDeleteModalComponent } from '../components/versement-delete-modal/versement-delete-modal.component';
import { VersementRecuModalComponent } from '../components/versement-recu-modal/versement-recu-modal.component';

@Component({
  selector: 'app-versements-page',
  imports: [
    CommonModule,
    DecimalPipe,
    AppCard,
    AppButton,
    VersementTableComponent,
    VersementFormModalComponent,
    VersementDeleteModalComponent,
    VersementRecuModalComponent
  ],
  templateUrl: './versements-page.component.html',
  styleUrl: './versements-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersementsPageComponent implements OnInit {
  protected readonly versementService = inject(VersementCureService);

  protected readonly versements = this.versementService.versements;
  protected readonly kpis = this.versementService.kpis;
  protected readonly isLoading = this.versementService.isLoading;

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');

  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isRecuModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedVersement = signal<VersementCureDto | null>(null);
  protected readonly selectedVersementForRecu = signal<VersementCureDto | null>(null);

  protected readonly filteredVersements = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.selectedStatutFilter();
    let list = this.versements();

    if (st) {
      list = list.filter(v => v.statut === st);
    }

    if (!q) return list;
    return list.filter(v =>
      v.reference.toLowerCase().includes(q) ||
      v.periode_concernee.toLowerCase().includes(q) ||
      (v.destinataire && v.destinataire.toLowerCase().includes(q)) ||
      (v.effectue_par && v.effectue_par.toLowerCase().includes(q))
    );
  });

  protected readonly hasActiveFilters = computed(() => {
    return !this.searchQuery() === false || !this.selectedStatutFilter() === false;
  });

  public ngOnInit(): void {
    this.versementService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected onStatutFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatutFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatutFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedVersement.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(item: VersementCureDto): void {
    this.isEditing.set(true);
    this.selectedVersement.set(item);
    this.isFormModalOpen.set(true);
  }

  protected openDeleteModal(item: VersementCureDto): void {
    this.selectedVersement.set(item);
    this.isDeleteModalOpen.set(true);
  }

  protected openRecuModal(item: VersementCureDto): void {
    this.selectedVersementForRecu.set(item);
    this.isRecuModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedVersement.set(null);
  }

  protected closeRecuModal(): void {
    this.isRecuModalOpen.set(false);
    this.selectedVersementForRecu.set(null);
  }

  protected handleFormSubmit(dto: CreateVersementDto | UpdateVersementDto): void {
    if (this.isEditing() && this.selectedVersement()) {
      this.versementService.update(this.selectedVersement()!.id, dto as UpdateVersementDto).subscribe(() => {
        this.closeModals();
      });
    } else {
      this.versementService.create(dto as CreateVersementDto).subscribe((created) => {
        this.closeModals();
        if (created) {
          this.openRecuModal(created);
        }
      });
    }
  }

  protected handleDeleteConfirm(): void {
    const item = this.selectedVersement();
    if (item) {
      this.versementService.delete(item.id).subscribe(() => {
        this.closeModals();
      });
    }
  }
}
