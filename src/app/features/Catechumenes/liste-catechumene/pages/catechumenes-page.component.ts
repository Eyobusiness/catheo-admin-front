import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CatechumeneService } from '../services/catechumene.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import {
  CatechumeneDto,
  CreateParrainMarraineDto
} from '../models/catechumene.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { CatechumeneTableComponent } from '../components/catechumene-table/catechumene-table.component';
import { CatechumeneDetailModalComponent } from '../components/catechumene-detail-modal/catechumene-detail-modal.component';
import { ParrainModalComponent } from '../components/parrain-modal/parrain-modal.component';
import { CatechumeneDeleteModalComponent } from '../components/catechumene-delete-modal/catechumene-delete-modal.component';

@Component({
  selector: 'app-catechumenes-page',
  imports: [
    AppCard,
    CatechumeneTableComponent,
    CatechumeneDetailModalComponent,
    ParrainModalComponent,
    CatechumeneDeleteModalComponent
  ],
  templateUrl: './catechumenes-page.component.html',
  styleUrl: './catechumenes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatechumenesPageComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);

  // Signals
  protected readonly catechumenes = this.catechumeneService.catechumenes;
  protected readonly sections = this.sectionService.sections;
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly classes = this.classeService.classes;
  protected readonly parrains = this.catechumeneService.parrains;
  protected readonly isLoading = this.catechumeneService.isLoading;

  // Local Page Filters
  protected readonly searchQuery = signal<string>('');
  protected readonly sectionFilter = signal<string>('');
  protected readonly niveauFilter = signal<string>('');
  protected readonly classeFilter = signal<string>('');

  // Dynamic cascading lists
  protected readonly filteredNiveauxList = computed(() => {
    const secId = this.sectionFilter();
    if (!secId) return this.niveaux();
    return this.niveaux().filter(n => n.section_id === secId || n.section?.id === secId);
  });

  protected readonly filteredClassesList = computed(() => {
    const nivId = this.niveauFilter();
    if (!nivId) return this.classes();
    return this.classes().filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
  });

  // Modals state
  protected readonly isDetailModalOpen = signal<boolean>(false);
  protected readonly isParrainModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly selectedItem = signal<CatechumeneDto | null>(null);
  protected readonly itemToDelete = signal<CatechumeneDto | null>(null);

  // Stats
  protected readonly stats = computed(() => {
    const list = this.catechumenes();
    return {
      total: list.length,
      actifs: list.filter(c => c.statut === 'actif').length,
      baptises: list.filter(c => c.est_baptise).length,
      confirmes: list.filter(c => !!c.date_confirmation).length,
      avecParrain: list.filter(c => (c.parrains_marraines && c.parrains_marraines.length > 0) || !!c.nom_parrain).length
    };
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.sectionFilter() || !!this.niveauFilter() || !!this.classeFilter();
  });

  protected readonly filteredCatechumenes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const secId = this.sectionFilter();
    const nivId = this.niveauFilter();
    const claId = this.classeFilter();
    let list = this.catechumenes();

    if (secId) {
      list = list.filter(c => {
        if ((c as any).section_id === secId || (c as any).section?.id === secId) return true;
        return c.inscriptions_annuelles?.some((i: any) => i.section_id === secId || i.section?.id === secId);
      });
    }

    if (nivId) {
      list = list.filter(c => {
        if ((c as any).niveau_id === nivId || (c as any).niveau?.id === nivId) return true;
        return c.inscriptions_annuelles?.some((i: any) => i.niveau_id === nivId || i.niveau?.id === nivId);
      });
    }

    if (claId) {
      list = list.filter(c => {
        if ((c as any).classe_id === claId || (c as any).classe?.id === claId) return true;
        return c.inscriptions_annuelles?.some((i: any) => i.classe_id === claId || i.classe?.id === claId);
      });
    }

    if (!q) return list;
    return list.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.prenoms.toLowerCase().includes(q) ||
      (c.matricule && c.matricule.toLowerCase().includes(q)) ||
      (c.code_catechumene && c.code_catechumene.toLowerCase().includes(q)) ||
      (c.telephone && c.telephone.includes(q)) ||
      (c.ceb?.nom && c.ceb.nom.toLowerCase().includes(q))
    );
  });

  public ngOnInit(): void {
    this.catechumeneService.getAll().subscribe();
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onSectionFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sectionFilter.set(select.value);
    this.niveauFilter.set('');
    this.classeFilter.set('');
  }

  protected onNiveauFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.niveauFilter.set(select.value);
    this.classeFilter.set('');
  }

  protected onClasseFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.classeFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.sectionFilter.set('');
    this.niveauFilter.set('');
    this.classeFilter.set('');
  }

  protected redirectToInscription(): void {
    this.router.navigate(['/inscriptions-annuelles']);
  }

  protected openDetailModal(item: CatechumeneDto): void {
    this.selectedItem.set(item);
    this.isDetailModalOpen.set(true);
  }

  protected openParrainModal(item: CatechumeneDto): void {
    this.selectedItem.set(item);
    this.catechumeneService.getParrains(item.id).subscribe();
    this.isParrainModalOpen.set(true);
    this.isDetailModalOpen.set(false);
  }

  protected openDeleteModal(item: CatechumeneDto): void {
    this.itemToDelete.set(item);
    this.isDeleteModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isDetailModalOpen.set(false);
    this.isParrainModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedItem.set(null);
    this.itemToDelete.set(null);
  }

  protected handleAddParrain(event: CreateParrainMarraineDto): void {
    this.catechumeneService.addParrain(event).subscribe(() => {
      this.closeModals();
    });
  }

  protected handleDeleteParrain(parrainId: string): void {
    this.catechumeneService.deleteParrain(parrainId).subscribe();
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.catechumeneService.delete(target.id).subscribe(() => {
        this.closeModals();
      });
    }
  }
}
