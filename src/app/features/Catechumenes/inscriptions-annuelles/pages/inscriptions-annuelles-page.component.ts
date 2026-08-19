import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { InscriptionAnnuelleService } from '../services/inscription-annuelle.service';
import { CatechumeneService } from '../../liste-catechumene/services/catechumene.service';
import { AnneeCatecheseService } from '../../../Organisations/AnneesPastorales/services/annee-catechese.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { CebService } from '../../../Organisations/Ceb/services/ceb.service';
import { MouvementService } from '../../../Organisations/Mouvements/services/mouvement.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  InscriptionAnnuelleDto,
  CreateInscriptionAnnuelleDto,
  UpdateInscriptionAnnuelleDto
} from '../models/inscription-annuelle.model';
import { CatechumeneDto } from '../../liste-catechumene/models/catechumene.model';
import { AnneeCatecheseDto } from '../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { Section } from '../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../Organisations/Niveaux/models/niveau.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';
import { Ceb } from '../../../Organisations/Ceb/models/ceb.model';
import { Mouvement } from '../../../Organisations/Mouvements/models/mouvement.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { InscriptionTableComponent } from '../components/inscription-table/inscription-table.component';
import { InscriptionFormModalComponent } from '../components/inscription-form-modal/inscription-form-modal.component';
import { InscriptionDetailModalComponent } from '../components/inscription-detail-modal/inscription-detail-modal.component';
import { InscriptionDeleteModalComponent } from '../components/inscription-delete-modal/inscription-delete-modal.component';

@Component({
  selector: 'app-inscriptions-annuelles-page',
  imports: [
    AppCard,
    AppButton,
    InscriptionTableComponent,
    InscriptionFormModalComponent,
    InscriptionDetailModalComponent,
    InscriptionDeleteModalComponent
  ],
  templateUrl: './inscriptions-annuelles-page.component.html',
  styleUrl: './inscriptions-annuelles-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InscriptionsAnnuellesPageComponent implements OnInit {
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly cebService = inject(CebService);
  protected readonly mouvementService = inject(MouvementService);
  protected readonly toastService = inject(ToastService);

  // Signals
  protected readonly inscriptions = this.inscriptionService.inscriptions;
  protected readonly catechumenes = this.catechumeneService.catechumenes;
  protected readonly annees = this.anneeService.annees;
  protected readonly sections = this.sectionService.sections;
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly classes = this.classeService.classes;
  protected readonly cebs = this.cebService.cebs;
  protected readonly mouvements = this.mouvementService.mouvements;
  protected readonly isLoading = this.inscriptionService.isLoading;

  // Local Page Filters
  protected readonly searchQuery = signal<string>('');
  protected readonly anneeFilter = signal<string>('');
  protected readonly niveauFilter = signal<string>('');
  protected readonly statutFilter = signal<string>('');
  protected readonly fraisFilter = signal<string>(''); // '' | 'paye' | 'impaye'

  // Modals state
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDetailModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedItem = signal<InscriptionAnnuelleDto | null>(null);
  protected readonly itemToDelete = signal<InscriptionAnnuelleDto | null>(null);

  // Stats
  protected readonly stats = computed(() => {
    const list = this.inscriptions();
    return {
      total: list.length,
      valides: list.filter(i => i.statut_inscription === 'valide').length,
      enAttenteClasse: list.filter(i => !i.classe_id && !i.classe?.id).length,
      fraisPayes: list.filter(i => i.frais_inscription_payes).length
    };
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.anneeFilter() || !!this.niveauFilter() || !!this.statutFilter() || !!this.fraisFilter();
  });

  protected readonly filteredInscriptions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const af = this.anneeFilter();
    const nf = this.niveauFilter();
    const sf = this.statutFilter();
    const ff = this.fraisFilter();
    let list = this.inscriptions();

    if (af) {
      list = list.filter(i => i.annee_catechese_id === af || i.annee_catechese?.id === af);
    }

    if (nf) {
      list = list.filter(i => i.niveau_id === nf || i.niveau?.id === nf);
    }

    if (sf) {
      list = list.filter(i => i.statut_inscription === sf);
    }

    if (ff === 'paye') {
      list = list.filter(i => i.frais_inscription_payes);
    } else if (ff === 'impaye') {
      list = list.filter(i => !i.frais_inscription_payes);
    }

    if (!q) return list;
    return list.filter(i =>
      (i.code_inscription && i.code_inscription.toLowerCase().includes(q)) ||
      (i.catechumene && (
        i.catechumene.nom.toLowerCase().includes(q) ||
        i.catechumene.prenoms.toLowerCase().includes(q) ||
        i.catechumene.code_catechumene.toLowerCase().includes(q)
      ))
    );
  });

  public ngOnInit(): void {
    this.inscriptionService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.anneeService.getAll().subscribe();
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.cebService.getAll().subscribe();
    this.mouvementService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onAnneeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.anneeFilter.set(select.value);
  }

  protected onNiveauFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.niveauFilter.set(select.value);
  }

  protected onStatutFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statutFilter.set(select.value);
  }

  protected onFraisFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.fraisFilter.set(select.value);
  }

  protected resetAllFilters(): void {
    this.searchQuery.set('');
    this.anneeFilter.set('');
    this.niveauFilter.set('');
    this.statutFilter.set('');
    this.fraisFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedItem.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(item: InscriptionAnnuelleDto): void {
    this.isEditing.set(true);
    this.selectedItem.set(item);
    this.isFormModalOpen.set(true);
    this.isDetailModalOpen.set(false);
  }

  protected openDetailModal(item: InscriptionAnnuelleDto): void {
    this.selectedItem.set(item);
    this.isDetailModalOpen.set(true);
  }

  protected openDeleteModal(item: InscriptionAnnuelleDto): void {
    this.itemToDelete.set(item);
    this.isDeleteModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isDetailModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedItem.set(null);
    this.itemToDelete.set(null);
  }

  protected handleFormSubmit(event: {
    dto: CreateInscriptionAnnuelleDto | UpdateInscriptionAnnuelleDto;
    catechumene?: CatechumeneDto;
    annee?: AnneeCatecheseDto;
    section?: Section;
    niveau?: NiveauDto;
    classe?: ClasseDto;
    ceb?: Ceb;
    mouvement?: Mouvement;
  }): void {
    if (this.isEditing() && this.selectedItem()) {
      this.inscriptionService.update(this.selectedItem()!.id, event.dto as UpdateInscriptionAnnuelleDto, event).subscribe(() => {
        this.closeModals();
      });
    } else {
      this.inscriptionService.create(event.dto as CreateInscriptionAnnuelleDto, event).subscribe(() => {
        this.closeModals();
      });
    }
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.inscriptionService.delete(target.id).subscribe(() => {
        this.closeModals();
      });
    }
  }
}
