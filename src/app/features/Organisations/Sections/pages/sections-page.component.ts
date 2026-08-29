import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { SectionService } from '../services/section.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CreateSectionDto, Section, UpdateSectionDto } from '../models/section.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { SectionTableComponent } from '../components/section-table/section-table.component';
import { SectionFormModalComponent } from '../components/section-form-modal/section-form-modal.component';
import { SectionDeleteModalComponent } from '../components/section-delete-modal/section-delete-modal.component';

@Component({
  selector: 'app-sections-page',
  imports: [
    AppCard,
    AppButton,
    SectionTableComponent,
    SectionFormModalComponent,
    SectionDeleteModalComponent
  ],
  templateUrl: './sections-page.component.html',
  styleUrl: './sections-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionsPageComponent implements OnInit {
  protected readonly sectionService = inject(SectionService);
  protected readonly toastService = inject(ToastService);

  // Signals from Service
  protected readonly sections = this.sectionService.sections;
  protected readonly isLoading = this.sectionService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedSection = signal<Section | null>(null);
  protected readonly itemToDelete = signal<Section | null>(null);

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
  }

  protected readonly filteredSections = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list: Section[] = this.sections();
    if (!q) return list;
    return list.filter((s: Section) =>
      s.nom.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedSection.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(section: Section): void {
    this.isEditing.set(true);
    this.selectedSection.set(section);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedSection.set(null);
    this.isEditing.set(false);
  }

  protected handleView(section: Section): void {
    this.toastService.info(
      `Section : ${section.nom} (${section.code})`,
      `Ordre : ${section.ordre} • Niveaux : ${section.total_niveaux || 0} • Statut : ${section.statut}`
    );
  }

  protected handleFormSubmit(dto: CreateSectionDto | UpdateSectionDto): void {
    const target = this.selectedSection();
    if (this.isEditing() && target) {
      this.sectionService.update(target.id, dto).subscribe(() => {
        this.closeFormModal();
      });
    } else {
      this.sectionService.create(dto as CreateSectionDto).subscribe(() => {
        this.closeFormModal();
      });
    }
  }

  protected handleToggleActive(section: Section): void {
    this.sectionService.toggleActive(section).subscribe();
  }

  protected openDeleteModal(section: Section): void {
    this.itemToDelete.set(section);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.sectionService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}

