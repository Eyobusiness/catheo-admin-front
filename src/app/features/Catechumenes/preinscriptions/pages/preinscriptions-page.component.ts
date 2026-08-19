import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { PreinscriptionService } from '../services/preinscription.service';
import { CampagnePreinscriptionService } from '../../campagnes/services/campagne.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  PreinscriptionDto,
  SubmitPreinscriptionDto,
  UpdatePreinscriptionDto,
  ValiderPreinscriptionDto,
  RejeterPreinscriptionDto,
  StatutPreinscription
} from '../models/preinscription.model';
import { CampagnePreinscriptionDto } from '../../campagnes/models/campagne.model';
import { Section } from '../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../Organisations/Niveaux/models/niveau.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { PreinscriptionTableComponent } from '../components/preinscription-table/preinscription-table.component';
import { PreinscriptionFormModalComponent } from '../components/preinscription-form-modal/preinscription-form-modal.component';
import { PreinscriptionDetailModalComponent } from '../components/preinscription-detail-modal/preinscription-detail-modal.component';
import { PreinscriptionValiderModalComponent } from '../components/preinscription-valider-modal/preinscription-valider-modal.component';
import { PreinscriptionRejeterModalComponent } from '../components/preinscription-rejeter-modal/preinscription-rejeter-modal.component';

@Component({
  selector: 'app-preinscriptions-page',
  imports: [
    AppCard,
    AppButton,
    PreinscriptionTableComponent,
    PreinscriptionFormModalComponent,
    PreinscriptionDetailModalComponent,
    PreinscriptionValiderModalComponent,
    PreinscriptionRejeterModalComponent
  ],
  templateUrl: './preinscriptions-page.component.html',
  styleUrl: './preinscriptions-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreinscriptionsPageComponent implements OnInit {
  protected readonly preinscriptionService = inject(PreinscriptionService);
  protected readonly campagneService = inject(CampagnePreinscriptionService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly toastService = inject(ToastService);

  // Signals
  protected readonly preinscriptions = this.preinscriptionService.preinscriptions;
  protected readonly campagnes = this.campagneService.campagnes;
  protected readonly sections = this.sectionService.sections;
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly classes = this.classeService.classes;
  protected readonly isLoading = this.preinscriptionService.isLoading;

  // Local Page Filters
  protected readonly searchQuery = signal<string>('');
  protected readonly statusFilter = signal<string>('');
  protected readonly typeFilter = signal<string>('');

  // Modals state
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDetailModalOpen = signal<boolean>(false);
  protected readonly isValiderModalOpen = signal<boolean>(false);
  protected readonly isRejeterModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedItem = signal<PreinscriptionDto | null>(null);

  // Computed Statistics
  protected readonly stats = computed(() => {
    const list = this.preinscriptions();
    return {
      total: list.length,
      enAttente: list.filter(p => p.statut === 'en_attente').length,
      validees: list.filter(p => p.statut === 'validee').length,
      rejetees: list.filter(p => p.statut === 'rejetee').length
    };
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.statusFilter() || !!this.typeFilter();
  });

  protected readonly filteredPreinscriptions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sf = this.statusFilter();
    const tf = this.typeFilter();
    let list = this.preinscriptions();

    if (sf) {
      list = list.filter(p => p.statut === sf);
    }
    if (tf) {
      list = list.filter(p => p.type_demande === tf);
    }

    if (!q) return list;
    return list.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      p.prenoms.toLowerCase().includes(q) ||
      p.code_dossier.toLowerCase().includes(q) ||
      (p.telephone && p.telephone.includes(q))
    );
  });

  public ngOnInit(): void {
    this.preinscriptionService.getAll().subscribe();
    this.campagneService.getAll().subscribe();
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

  protected onTypeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.typeFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.typeFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedItem.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(item: PreinscriptionDto): void {
    this.isEditing.set(true);
    this.selectedItem.set(item);
    this.isFormModalOpen.set(true);
    this.isDetailModalOpen.set(false);
  }

  protected openDetailModal(item: PreinscriptionDto): void {
    this.selectedItem.set(item);
    this.isDetailModalOpen.set(true);
  }

  protected openValiderModal(item: PreinscriptionDto): void {
    this.selectedItem.set(item);
    this.isValiderModalOpen.set(true);
    this.isDetailModalOpen.set(false);
  }

  protected openRejeterModal(item: PreinscriptionDto): void {
    this.selectedItem.set(item);
    this.isRejeterModalOpen.set(true);
    this.isDetailModalOpen.set(false);
  }

  protected closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isDetailModalOpen.set(false);
    this.isValiderModalOpen.set(false);
    this.isRejeterModalOpen.set(false);
    this.selectedItem.set(null);
  }

  protected handleFormSubmit(event: {
    dto: SubmitPreinscriptionDto | UpdatePreinscriptionDto;
    campagne?: CampagnePreinscriptionDto;
    section?: Section;
    niveau?: NiveauDto;
  }): void {
    if (this.isEditing() && this.selectedItem()) {
      this.preinscriptionService.update(this.selectedItem()!.id, event.dto as UpdatePreinscriptionDto).subscribe(() => {
        this.closeModals();
      });
    } else {
      this.preinscriptionService.create(event.dto as SubmitPreinscriptionDto, event.campagne, event.section, event.niveau).subscribe(() => {
        this.closeModals();
      });
    }
  }

  protected handleValider(dto: ValiderPreinscriptionDto): void {
    const item = this.selectedItem();
    if (item) {
      const selectedNiveau = this.niveaux().find(n => n.id === dto.niveau_id);
      const selectedClasse = this.classes().find(c => c.id === dto.classe_id);
      this.preinscriptionService.valider(item.id, dto, selectedNiveau, selectedClasse).subscribe(() => {
        this.closeModals();
      });
    }
  }

  protected handleRejeter(dto: RejeterPreinscriptionDto): void {
    const item = this.selectedItem();
    if (item) {
      this.preinscriptionService.rejeter(item.id, dto).subscribe(() => {
        this.closeModals();
      });
    }
  }

  protected handleDelete(item: PreinscriptionDto): void {
    if (confirm(`Confirmez-vous la suppression du dossier ${item.code_dossier} (${item.nom} ${item.prenoms}) ?`)) {
      this.preinscriptionService.delete(item.id).subscribe();
    }
  }
}
