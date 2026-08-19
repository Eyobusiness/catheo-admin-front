import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NiveauService } from '../services/niveau.service';
import { SectionService } from '../../Sections/services/section.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CreateNiveauDto, Niveau, UpdateNiveauDto } from '../models/niveau.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { NiveauTableComponent } from '../components/niveau-table/niveau-table.component';
import { NiveauFormModalComponent } from '../components/niveau-form-modal/niveau-form-modal.component';
import { NiveauDeleteModalComponent } from '../components/niveau-delete-modal/niveau-delete-modal.component';

@Component({
  selector: 'app-niveaux-page',
  imports: [
    AppCard,
    AppButton,
    NiveauTableComponent,
    NiveauFormModalComponent,
    NiveauDeleteModalComponent
  ],
  templateUrl: './niveaux-page.component.html',
  styleUrl: './niveaux-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NiveauxPageComponent implements OnInit {
  protected readonly niveauService = inject(NiveauService);
  protected readonly sectionService = inject(SectionService);
  protected readonly toastService = inject(ToastService);

  // Signals from Services
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly sections = this.sectionService.sections;
  protected readonly isLoading = this.niveauService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedSectionFilter = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedNiveau = signal<Niveau | null>(null);
  protected readonly itemToDelete = signal<Niveau | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedSectionFilter();
  });

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
  }

  protected readonly filteredNiveaux = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sectionFilter = this.selectedSectionFilter();
    let list: Niveau[] = this.niveaux();

    if (sectionFilter) {
      list = list.filter(n => n.section_id === sectionFilter || n.section?.id === sectionFilter);
    }

    if (!q) return list;
    return list.filter((n: Niveau) =>
      n.nom.toLowerCase().includes(q) ||
      (n.description && n.description.toLowerCase().includes(q))
    );
  });

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onSectionFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedSectionFilter.set(select.value);
  }

  protected resetAllFilters(): void {
    this.searchQuery.set('');
    this.selectedSectionFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedNiveau.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(niveau: Niveau): void {
    this.isEditing.set(true);
    this.selectedNiveau.set(niveau);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedNiveau.set(null);
  }

  protected handleView(niveau: Niveau): void {
    const secId = niveau.section_id || niveau.section?.id;
    const sec = this.sections().find(s => s.id === secId);
    const secName = sec ? sec.nom : (niveau.section?.nom || 'Section');
    this.toastService.info(
      `Niveau : ${niveau.nom}`,
      `Section : ${secName} • Statut : ${niveau.statut}`
    );
  }

  protected handleFormSubmit(dto: CreateNiveauDto | UpdateNiveauDto): void {
    if (this.isEditing() && this.selectedNiveau()) {
      this.niveauService.update(this.selectedNiveau()!.id, dto as UpdateNiveauDto).subscribe(() => {
        this.closeFormModal();
      });
    } else {
      this.niveauService.create(dto as CreateNiveauDto).subscribe(() => {
        this.closeFormModal();
      });
    }
  }

  protected handleToggleStatus(niveau: Niveau): void {
    this.niveauService.toggleStatus(niveau).subscribe();
  }

  protected openDeleteModal(niveau: Niveau): void {
    this.itemToDelete.set(niveau);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.niveauService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
