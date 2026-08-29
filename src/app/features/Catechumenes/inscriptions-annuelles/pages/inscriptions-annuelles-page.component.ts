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
import {
  CatechumeneDto,
  CreateCatechumeneDto,
  UpdateCatechumeneDto
} from '../../liste-catechumene/models/catechumene.model';
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
import { RecuThermiqueModalComponent } from '../../../../shared/ui/components/recu-thermique-modal/recu-thermique-modal.component';
import { RecuPaiementData } from '../../../../shared/ui/components/recu-thermique-modal/models/recu-thermique.model';

@Component({
  selector: 'app-inscriptions-annuelles-page',
  imports: [
    AppCard,
    AppButton,
    InscriptionTableComponent,
    InscriptionFormModalComponent,
    InscriptionDetailModalComponent,
    InscriptionDeleteModalComponent,
    RecuThermiqueModalComponent
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
  protected readonly sectionFilter = signal<string>('');
  protected readonly niveauFilter = signal<string>('');
  protected readonly classeFilter = signal<string>('');
  protected readonly statutFilter = signal<string>('');
  protected readonly fraisFilter = signal<string>(''); // '' | 'paye' | 'impaye'

  // Dynamic filter helpers
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
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDetailModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isRecuModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedItem = signal<InscriptionAnnuelleDto | null>(null);
  protected readonly itemToDelete = signal<InscriptionAnnuelleDto | null>(null);
  protected readonly selectedRecuData = signal<RecuPaiementData | null>(null);

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
    return !!this.searchQuery() || !!this.sectionFilter() || !!this.niveauFilter() || !!this.classeFilter() || !!this.statutFilter() || !!this.fraisFilter();
  });

  protected readonly filteredInscriptions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const secId = this.sectionFilter();
    const nf = this.niveauFilter();
    const clf = this.classeFilter();
    const sf = this.statutFilter();
    const ff = this.fraisFilter();
    let list = this.inscriptions();

    if (secId) {
      list = list.filter(i => i.section_id === secId || i.section?.id === secId || (i.niveau && (i.niveau.section_id === secId || i.niveau.section?.id === secId)));
    }

    if (nf) {
      list = list.filter(i => i.niveau_id === nf || i.niveau?.id === nf);
    }

    if (clf) {
      list = list.filter(i => i.classe_id === clf || i.classe?.id === clf);
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
        (i.catechumene.matricule && i.catechumene.matricule.toLowerCase().includes(q)) ||
        (i.catechumene.code_catechumene && i.catechumene.code_catechumene.toLowerCase().includes(q))
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
    this.sectionFilter.set('');
    this.niveauFilter.set('');
    this.classeFilter.set('');
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

  protected openRecuModal(item: InscriptionAnnuelleDto): void {
    const raw = item as any;
    const cat = item.catechumene as any;
    const catNom = cat?.nom_complet || (cat ? `${cat.nom || ''} ${cat.prenoms || ''}`.trim() : 'Catéchumène');
    const matricule = cat?.matricule || cat?.code_catechumene;
    const classeNom = item.classe?.nom || raw.classe_nom;
    const niveauNom = item.niveau?.nom || raw.niveau_nom;
    const sectionNom = item.section?.nom || raw.section_nom;
    const anneeLib = item.annee_catechese?.libelle || raw.annee_libelle;
    const montantFrais = raw.frais_inscription ?? raw.montant_paye ?? raw.montant ?? 15000;
    const isPaye = raw.frais_payes === true || item.frais_inscription_payes === true || item.statut_inscription === 'valide';

    this.selectedRecuData.set({
      reference: item.code_inscription || raw.numero_recu || `INS-${(item.id || 'AUTO').substring(0, 8).toUpperCase()}`,
      date: item.date_inscription || item.created_at || new Date().toISOString(),
      catechumene_nom: catNom,
      catechumene_matricule: matricule,
      classe_nom: classeNom,
      niveau_nom: niveauNom,
      section_nom: sectionNom,
      annee_pastorale: anneeLib,
      libelle: `Frais d'inscription & scolarité - ${niveauNom || 'Année pastorale'}`,
      type_operation: 'inscription',
      montant_total: montantFrais,
      montant_paye: isPaye ? montantFrais : (raw.montant_paye || 0),
      montant_restant: isPaye ? 0 : Math.max(0, montantFrais - (raw.montant_paye || 0)),
      mode_paiement: raw.mode_paiement || 'Espèces',
      statut: isPaye ? 'paye' : 'en_attente',
      caissier_nom: 'Secrétariat Catéchèse'
    });
    this.isRecuModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isDetailModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.isRecuModalOpen.set(false);
    this.selectedItem.set(null);
    this.itemToDelete.set(null);
  }

  protected handleNouvelleInscription(event: {
    catechumeneData: CreateCatechumeneDto;
    inscriptionData: CreateInscriptionAnnuelleDto;
    section?: Section;
    niveau?: NiveauDto;
    classe?: ClasseDto;
    ceb?: Ceb;
    mouvement?: Mouvement;
  }): void {
    this.catechumeneService.create(event.catechumeneData, event.ceb).subscribe({
      next: (createdCat) => {
        const currentAnnee = this.annees().find(a => a.est_active) || (this.annees().length > 0 ? this.annees()[0] : undefined);
        event.inscriptionData.catechumene_id = createdCat.id;
        event.inscriptionData.annee_catechese_id = currentAnnee ? currentAnnee.id : '';

        this.inscriptionService.create(event.inscriptionData, {
          catechumene: createdCat,
          annee: currentAnnee,
          section: event.section,
          niveau: event.niveau,
          classe: event.classe,
          ceb: event.ceb,
          mouvement: event.mouvement
        }).subscribe(() => {
          this.closeModals();
        });
      },
      error: () => {
        this.toastService.error('Erreur', "La création du catéchumène n'a pas pu aboutir.");
      }
    });
  }

  protected handleReinscription(event: {
    catechumeneId: string;
    updateCatechumeneData?: UpdateCatechumeneDto;
    inscriptionData: CreateInscriptionAnnuelleDto;
    catechumene?: CatechumeneDto;
    section?: Section;
    niveau?: NiveauDto;
    classe?: ClasseDto;
    ceb?: Ceb;
    mouvement?: Mouvement;
  }): void {
    const currentAnnee = this.annees().find(a => a.est_active) || (this.annees().length > 0 ? this.annees()[0] : undefined);
    event.inscriptionData.annee_catechese_id = currentAnnee ? currentAnnee.id : '';

    if (event.updateCatechumeneData) {
      this.catechumeneService.update(event.catechumeneId, event.updateCatechumeneData, event.ceb).subscribe();
    }

    this.inscriptionService.create(event.inscriptionData, {
      catechumene: event.catechumene,
      annee: currentAnnee,
      section: event.section,
      niveau: event.niveau,
      classe: event.classe,
      ceb: event.ceb,
      mouvement: event.mouvement
    }).subscribe(() => {
      this.closeModals();
    });
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
