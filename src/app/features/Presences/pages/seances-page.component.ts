import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeanceService } from '../services/seance.service';
import { SectionService } from '../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../Organisations/Classe/services/classe.service';
import { InscriptionAnnuelleService } from '../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { AffectationAnimateurService } from '../../Organisations/affectation-animateurs/services/affectation-animateur.service';
import { SeanceDto, CreateSeanceDto, UpdateSeanceDto, RecordPresencesBatchDto } from '../models/seance.model';
import { ClasseDto } from '../../Organisations/Classe/models/classe.model';
import { AppCard } from '../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../shared/ui/components/buttons/app-button/app-button.component';
import { SeanceTableComponent } from '../components/seance-table/seance-table.component';
import { SeanceFormModalComponent } from '../components/seance-form-modal/seance-form-modal.component';
import { SeancePresencesModalComponent } from '../components/seance-presences-modal/seance-presences-modal.component';
import { SeanceDeleteModalComponent } from '../components/seance-delete-modal/seance-delete-modal.component';

@Component({
  selector: 'app-seances-page',
  imports: [
    CommonModule,
    AppCard,
    AppButton,
    SeanceTableComponent,
    SeanceFormModalComponent,
    SeancePresencesModalComponent,
    SeanceDeleteModalComponent
  ],
  templateUrl: './seances-page.component.html',
  styleUrl: './seances-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeancesPageComponent implements OnInit {
  protected readonly seanceService = inject(SeanceService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly affectationService = inject(AffectationAnimateurService);

  // Signals
  protected readonly seances = this.seanceService.seances;
  protected readonly sections = this.sectionService.sections;
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly classes = this.classeService.classes;
  protected readonly inscriptions = this.inscriptionService.inscriptions;
  protected readonly isLoading = this.seanceService.isLoading;

  // Filters
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedSectionFilter = signal<string>('');
  protected readonly selectedNiveauFilter = signal<string>('');
  protected readonly selectedClasseFilter = signal<string>('');
  protected readonly selectedDateFilter = signal<string>('');

  // Modals state
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isPresencesModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedSeance = signal<SeanceDto | null>(null);

  // Cascading niveaux based on selected section
  protected readonly niveauxFiltres = computed(() => {
    const secId = this.selectedSectionFilter();
    const all = this.niveaux();
    if (!secId) return all;
    return all.filter(n => n.section_id === secId || n.section?.id === secId);
  });

  // Cascading classes based on selected section & niveau
  protected readonly classesFiltrees = computed(() => {
    const secId = this.selectedSectionFilter();
    const nivId = this.selectedNiveauFilter();
    let all = this.classes();

    if (secId) {
      all = all.filter(c => c.niveau?.section_id === secId || c.niveau?.section?.id === secId);
    }
    if (nivId) {
      all = all.filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
    }
    return all;
  });

  // Computed KPI Stats (basés sur la classe sélectionnée)
  protected readonly totalSeances = computed(() => this.filteredSeances().length);
  protected readonly classesCouvertes = computed(() => {
    return this.selectedClasseFilter() ? 1 : 0;
  });
  protected readonly totalPresencesCount = computed(() => {
    return this.filteredSeances().reduce((acc, s) => acc + (s.total_presences || 0), 0);
  });
  protected readonly seancesRecentes = computed(() => {
    const today = new Date().toISOString().substring(0, 7); // Current month YYYY-MM
    return this.filteredSeances().filter(s => s.date_seance && s.date_seance.startsWith(today)).length;
  });

  // Filtered séances list : UNIQUEMENT après avoir sélectionné une classe via les filtres
  protected readonly filteredSeances = computed(() => {
    const classeId = this.selectedClasseFilter();
    // Sans les filtres effectués, la liste des séances ne doit pas s'afficher
    if (!classeId) {
      return [];
    }

    const q = this.searchQuery().toLowerCase().trim();
    const date = this.selectedDateFilter();
    let list = this.seances().filter(s => s.classe_id === classeId || s.classe?.id === classeId);

    if (date) {
      list = list.filter(s => s.date_seance && s.date_seance.startsWith(date));
    }

    if (!q) return list;
    return list.filter(s =>
      (s.titre || s.titre_lecon || '').toLowerCase().includes(q) ||
      (s.classe?.nom && s.classe.nom.toLowerCase().includes(q)) ||
      (s.animateur && `${s.animateur.nom} ${s.animateur.prenoms}`.toLowerCase().includes(q))
    );
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedSectionFilter() || !!this.selectedNiveauFilter() || !!this.selectedClasseFilter() || !!this.selectedDateFilter();
  });

  public ngOnInit(): void {
    this.seanceService.getAll().subscribe();
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.inscriptionService.getAll().subscribe();
    this.affectationService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected onSectionFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const secId = select.value;
    this.selectedSectionFilter.set(secId);
    this.selectedNiveauFilter.set('');
    this.selectedClasseFilter.set('');
  }

  protected onNiveauFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nivId = select.value;
    this.selectedNiveauFilter.set(nivId);
    this.selectedClasseFilter.set('');
  }

  protected onClasseFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedClasseFilter.set(select.value);
  }

  protected onDateFilterChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDateFilter.set(input.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedSectionFilter.set('');
    this.selectedNiveauFilter.set('');
    this.selectedClasseFilter.set('');
    this.selectedDateFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedSeance.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(item: SeanceDto): void {
    this.isEditing.set(true);
    this.selectedSeance.set(item);
    this.isFormModalOpen.set(true);
  }

  protected openPresencesModal(item: SeanceDto): void {
    this.selectedSeance.set(item);
    this.isPresencesModalOpen.set(true);
  }

  protected openDeleteModal(item: SeanceDto): void {
    this.selectedSeance.set(item);
    this.isDeleteModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isPresencesModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedSeance.set(null);
  }

  protected handleFormSubmit(event: {
    dto: CreateSeanceDto | UpdateSeanceDto;
    classe?: ClasseDto;
  }): void {
    if (this.isEditing() && this.selectedSeance()) {
      this.seanceService.update(this.selectedSeance()!.id, event.dto as UpdateSeanceDto, event.classe).subscribe(() => {
        this.closeModals();
      });
    } else {
      this.seanceService.create(event.dto as CreateSeanceDto, event.classe).subscribe(() => {
        this.closeModals();
      });
    }
  }

  protected handlePresencesSubmit(event: { seanceId: string; dto: RecordPresencesBatchDto }): void {
    this.seanceService.recordPresences(event.seanceId, event.dto).subscribe(() => {
      this.closeModals();
    });
  }

  protected handleDeleteConfirm(): void {
    const item = this.selectedSeance();
    if (item) {
      this.seanceService.delete(item.id).subscribe(() => {
        this.closeModals();
      });
    }
  }
}
