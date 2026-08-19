import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CalendrierService } from '../services/calendrier.service';
import { AnneeCatecheseService } from '../../AnneesPastorales/services/annee-catechese.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Calendrier, CreateCalendrierDto, UpdateCalendrierDto } from '../models/calendrier.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { CalendrierTableComponent } from '../components/calendrier-table/calendrier-table.component';
import { CalendrierMonthViewComponent } from '../components/calendrier-month-view/calendrier-month-view.component';
import { CalendrierFormModalComponent } from '../components/calendrier-form-modal/calendrier-form-modal.component';
import { CalendrierDeleteModalComponent } from '../components/calendrier-delete-modal/calendrier-delete-modal.component';

export type CalendarViewMode = 'calendar' | 'table';

@Component({
  selector: 'app-calendrier-page',
  imports: [
    AppCard,
    AppButton,
    CalendrierMonthViewComponent,
    CalendrierTableComponent,
    CalendrierFormModalComponent,
    CalendrierDeleteModalComponent
  ],
  templateUrl: './calendrier-page.component.html',
  styleUrl: './calendrier-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendrierPageComponent implements OnInit {
  protected readonly calendrierService = inject(CalendrierService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly toastService = inject(ToastService);

  // View mode switcher: 'calendar' (Vue Calendrier interactif) ou 'table' (Vue Liste Tableau)
  protected readonly viewMode = signal<CalendarViewMode>('calendar');

  // Signals from Services
  protected readonly calendriers = this.calendrierService.calendriers;
  protected readonly annees = this.anneeService.annees;
  protected readonly isLoading = this.calendrierService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');
  protected readonly selectedCibleFilter = signal<string>('');
  protected readonly selectedAnneeFilter = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly selectedEvent = signal<Calendrier | null>(null);
  protected readonly prefilledDate = signal<string>('');
  protected readonly itemToDelete = signal<Calendrier | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    return (
      !!this.searchQuery() ||
      !!this.selectedStatutFilter() ||
      !!this.selectedCibleFilter() ||
      !!this.selectedAnneeFilter()
    );
  });

  public ngOnInit(): void {
    this.anneeService.getAll().subscribe();
    this.calendrierService.getAll().subscribe();
  }

  protected readonly filteredCalendriers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const statutFilter = this.selectedStatutFilter();
    const cibleFilter = this.selectedCibleFilter();
    const anneeFilter = this.selectedAnneeFilter();
    let list: Calendrier[] = this.calendriers();

    if (statutFilter) {
      list = list.filter(c => c.statut === statutFilter);
    }

    if (cibleFilter) {
      list = list.filter(c => c.cible_type === cibleFilter);
    }

    if (anneeFilter) {
      list = list.filter(c => c.annee_catechese_id === anneeFilter || c.annee_catechese?.id === anneeFilter);
    }

    if (!q) return list;
    return list.filter((c: Calendrier) =>
      c.titre.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      (c.lieu && c.lieu.toLowerCase().includes(q)) ||
      (c.cible_nom && c.cible_nom.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      c.date.includes(q)
    );
  });

  protected setViewMode(mode: CalendarViewMode): void {
    this.viewMode.set(mode);
  }

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

  protected onCibleFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCibleFilter.set(select.value);
  }

  protected onAnneeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedAnneeFilter.set(select.value);
  }

  protected resetAllFilters(): void {
    this.searchQuery.set('');
    this.selectedStatutFilter.set('');
    this.selectedCibleFilter.set('');
    this.selectedAnneeFilter.set('');
  }

  protected openCreateModal(defaultDateStr?: string): void {
    this.isEditing.set(false);
    this.selectedEvent.set(null);
    this.prefilledDate.set(defaultDateStr || new Date().toISOString().split('T')[0]);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(event: Calendrier): void {
    this.isEditing.set(true);
    this.selectedEvent.set(event);
    this.prefilledDate.set(event.date);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedEvent.set(null);
    this.prefilledDate.set('');
    this.isSubmitting.set(false);
  }

  protected handleView(event: Calendrier): void {
    this.toastService.info(
      `Événement : ${event.titre}`,
      `Type : ${event.type} • Date : ${event.date} (${event.heure_debut || '??'} - ${event.heure_fin || '??'}) • Lieu : ${event.lieu || 'Paroisse'}`
    );
  }

  protected handleFormSubmit(payload: {
    dto: CreateCalendrierDto | UpdateCalendrierDto;
    anneeLibelle?: string;
  }): void {
    this.isSubmitting.set(true);
    if (this.isEditing() && this.selectedEvent()) {
      this.calendrierService
        .update(this.selectedEvent()!.id, payload.dto as UpdateCalendrierDto, payload.anneeLibelle)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeFormModal();
          },
          error: () => {
            this.isSubmitting.set(false);
          }
        });
    } else {
      this.calendrierService
        .create(payload.dto as CreateCalendrierDto, payload.anneeLibelle)
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeFormModal();
          },
          error: () => {
            this.isSubmitting.set(false);
          }
        });
    }
  }

  protected handleToggleStatus(payload: { id: string; nextStatus: 'Planifié' | 'Réalisé' | 'Annulé' }): void {
    this.calendrierService.patchStatus(payload.id, payload.nextStatus).subscribe();
  }

  protected openDeleteModal(event: Calendrier): void {
    this.itemToDelete.set(event);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.calendrierService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
