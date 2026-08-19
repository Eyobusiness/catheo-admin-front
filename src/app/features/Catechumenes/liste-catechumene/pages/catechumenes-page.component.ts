import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CatechumeneService } from '../services/catechumene.service';
import { CebService } from '../../../Organisations/Ceb/services/ceb.service';
import { AnneeCatecheseService } from '../../../Organisations/AnneesPastorales/services/annee-catechese.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { InscriptionAnnuelleService } from '../../inscriptions-annuelles/services/inscription-annuelle.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  CatechumeneDto,
  CreateCatechumeneDto,
  UpdateCatechumeneDto,
  CreateParrainMarraineDto,
  StatutCatechumene
} from '../models/catechumene.model';
import { Ceb } from '../../../Organisations/Ceb/models/ceb.model';
import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { Section } from '../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../Organisations/Niveaux/models/niveau.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { CatechumeneTableComponent } from '../components/catechumene-table/catechumene-table.component';
import { CatechumeneFormModalComponent } from '../components/catechumene-form-modal/catechumene-form-modal.component';
import { CatechumeneDetailModalComponent } from '../components/catechumene-detail-modal/catechumene-detail-modal.component';
import { ParrainModalComponent } from '../components/parrain-modal/parrain-modal.component';
import { CatechumeneDeleteModalComponent } from '../components/catechumene-delete-modal/catechumene-delete-modal.component';

@Component({
  selector: 'app-catechumenes-page',
  imports: [
    AppCard,
    AppButton,
    CatechumeneTableComponent,
    CatechumeneFormModalComponent,
    CatechumeneDetailModalComponent,
    ParrainModalComponent,
    CatechumeneDeleteModalComponent
  ],
  templateUrl: './catechumenes-page.component.html',
  styleUrl: './catechumenes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatechumenesPageComponent implements OnInit {
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly cebService = inject(CebService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly toastService = inject(ToastService);

  // Signals
  protected readonly catechumenes = this.catechumeneService.catechumenes;
  protected readonly cebs = this.cebService.cebs;
  protected readonly annees = this.anneeService.annees;
  protected readonly sections = this.sectionService.sections;
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly classes = this.classeService.classes;
  protected readonly parrains = this.catechumeneService.parrains;
  protected readonly isLoading = this.catechumeneService.isLoading;

  // Local Page Filters
  protected readonly searchQuery = signal<string>('');
  protected readonly statusFilter = signal<string>('');
  protected readonly sexeFilter = signal<string>('');
  protected readonly sacramentFilter = signal<string>(''); // '' | 'baptise' | 'non_baptise' | 'communie' | 'confirme'

  // Modals state
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDetailModalOpen = signal<boolean>(false);
  protected readonly isParrainModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
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
    return !!this.searchQuery() || !!this.statusFilter() || !!this.sexeFilter() || !!this.sacramentFilter();
  });

  protected readonly filteredCatechumenes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sf = this.statusFilter();
    const sexef = this.sexeFilter();
    const sacrf = this.sacramentFilter();
    let list = this.catechumenes();

    if (sf) {
      list = list.filter(c => c.statut === sf);
    }

    if (sexef) {
      list = list.filter(c => c.sexe === sexef);
    }

    if (sacrf) {
      if (sacrf === 'baptise') list = list.filter(c => c.est_baptise);
      if (sacrf === 'non_baptise') list = list.filter(c => !c.est_baptise);
      if (sacrf === 'communie') list = list.filter(c => !!c.date_premiere_communion);
      if (sacrf === 'confirme') list = list.filter(c => !!c.date_confirmation);
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
    this.cebService.getAll().subscribe();
    this.anneeService.getAll().subscribe();
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

  protected onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value);
  }

  protected onSexeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sexeFilter.set(select.value);
  }

  protected onSacramentFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sacramentFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.sexeFilter.set('');
    this.sacramentFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedItem.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(item: CatechumeneDto): void {
    this.isEditing.set(true);
    this.selectedItem.set(item);
    this.isFormModalOpen.set(true);
    this.isDetailModalOpen.set(false);
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
    this.isFormModalOpen.set(false);
    this.isDetailModalOpen.set(false);
    this.isParrainModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedItem.set(null);
    this.itemToDelete.set(null);
  }

  protected handleFormSubmit(event: {
    dto: CreateCatechumeneDto | UpdateCatechumeneDto;
    ceb?: Ceb;
    inscriptionData?: {
      annee_catechese_id?: string;
      section_id?: string;
      niveau_id?: string;
      classe_id?: string;
    };
  }): void {
    if (this.isEditing() && this.selectedItem()) {
      this.catechumeneService.update(this.selectedItem()!.id, event.dto as UpdateCatechumeneDto, event.ceb).subscribe(() => {
        this.closeModals();
      });
    } else {
      this.catechumeneService.create(event.dto as CreateCatechumeneDto, event.ceb).subscribe(created => {
        if (created?.id && event.inscriptionData?.annee_catechese_id && event.inscriptionData?.niveau_id) {
          this.inscriptionService.create({
            catechumene_id: created.id,
            annee_catechese_id: event.inscriptionData.annee_catechese_id,
            section_id: event.inscriptionData.section_id,
            niveau_id: event.inscriptionData.niveau_id,
            classe_id: event.inscriptionData.classe_id,
            ceb_id: (event.dto as CreateCatechumeneDto).ceb_id,
            statut_inscription: event.inscriptionData.classe_id ? 'valide' : 'inscrit',
            frais_inscription_payes: false
          }).subscribe();
        }
        this.closeModals();
      });
    }
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
