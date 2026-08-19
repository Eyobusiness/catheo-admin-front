import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CampagnePreinscriptionService } from '../services/campagne.service';
import { AnneeCatecheseService } from '../../../Organisations/AnneesPastorales/services/annee-catechese.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  CampagnePreinscriptionDto,
  CreateCampagnePreinscriptionDto,
  UpdateCampagnePreinscriptionDto,
  StatutCampagne
} from '../models/campagne.model';
import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { CampagneTableComponent } from '../components/campagne-table/campagne-table.component';
import { CampagneFormModalComponent } from '../components/campagne-form-modal/campagne-form-modal.component';
import { CampagneDetailModalComponent } from '../components/campagne-detail-modal/campagne-detail-modal.component';
import { CampagneDeleteModalComponent } from '../components/campagne-delete-modal/campagne-delete-modal.component';
import { CampagneQrModalComponent } from '../components/campagne-qr-modal/campagne-qr-modal.component';

@Component({
  selector: 'app-campagnes-page',
  imports: [
    AppCard,
    AppButton,
    CampagneTableComponent,
    CampagneFormModalComponent,
    CampagneDetailModalComponent,
    CampagneDeleteModalComponent,
    CampagneQrModalComponent
  ],
  templateUrl: './campagnes-page.component.html',
  styleUrl: './campagnes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampagnesPageComponent implements OnInit {
  protected readonly campagneService = inject(CampagnePreinscriptionService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly sectionService = inject(SectionService);
  protected readonly toastService = inject(ToastService);

  // Signals from Service
  protected readonly campagnes = this.campagneService.campagnes;
  protected readonly annees = this.anneeService.annees;
  protected readonly sections = this.sectionService.sections;
  protected readonly isLoading = this.campagneService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly statusFilter = signal<string>(''); // '' | 'ouverte' | 'fermee' | 'suspendue'

  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDetailModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isQrModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedCampagne = signal<CampagnePreinscriptionDto | null>(null);
  protected readonly itemToDelete = signal<CampagnePreinscriptionDto | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.statusFilter();
  });

  protected readonly filteredCampagnes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sf = this.statusFilter();
    let list = this.campagnes();

    if (sf) {
      list = list.filter(c => c.statut === sf);
    }

    if (!q) return list;
    return list.filter(c =>
      c.titre.toLowerCase().includes(q) ||
      (c.annee_catechese?.libelle && c.annee_catechese.libelle.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  public ngOnInit(): void {
    this.campagneService.getAll().subscribe();
    this.anneeService.getAll().subscribe();
    this.sectionService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedCampagne.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(campagne: CampagnePreinscriptionDto): void {
    this.isEditing.set(true);
    this.selectedCampagne.set(campagne);
    this.isFormModalOpen.set(true);
    this.isDetailModalOpen.set(false);
  }

  protected openDetailModal(campagne: CampagnePreinscriptionDto): void {
    this.selectedCampagne.set(campagne);
    this.isDetailModalOpen.set(true);
  }

  protected openQrModal(campagne: CampagnePreinscriptionDto): void {
    this.selectedCampagne.set(campagne);
    this.isQrModalOpen.set(true);
  }

  protected openDeleteModal(campagne: CampagnePreinscriptionDto): void {
    this.itemToDelete.set(campagne);
    this.isDeleteModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isDetailModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.isQrModalOpen.set(false);
    this.selectedCampagne.set(null);
    this.itemToDelete.set(null);
  }

  protected handleFormSubmit(event: {
    dto: CreateCampagnePreinscriptionDto | UpdateCampagnePreinscriptionDto;
    annee?: AnneeCatecheseDto;
  }): void {
    if (this.isEditing() && this.selectedCampagne()) {
      this.campagneService.update(this.selectedCampagne()!.id, event.dto as UpdateCampagnePreinscriptionDto, event.annee).subscribe(() => {
        this.closeModals();
      });
    } else {
      this.campagneService.create(event.dto as CreateCampagnePreinscriptionDto, event.annee).subscribe(() => {
        this.closeModals();
      });
    }
  }

  protected handleToggleStatus(campagne: CampagnePreinscriptionDto): void {
    const nextStatus: StatutCampagne = campagne.statut === 'ouverte' ? 'fermee' : 'ouverte';
    this.campagneService.updateStatus(campagne.id, nextStatus).subscribe();
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.campagneService.delete(target.id).subscribe(() => {
        this.closeModals();
      });
    }
  }
}
