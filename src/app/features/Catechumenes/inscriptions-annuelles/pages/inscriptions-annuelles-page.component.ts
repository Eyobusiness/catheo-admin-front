import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { InscriptionAnnuelleService } from '../services/inscription-annuelle.service';
import { CatechumeneService } from '../../liste-catechumene/services/catechumene.service';
import { AnneeCatecheseService } from '../../../Organisations/AnneesPastorales/services/annee-catechese.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { CebService } from '../../../Organisations/Ceb/services/ceb.service';
import { MouvementService } from '../../../Organisations/Mouvements/services/mouvement.service';
import { OperationFinanciereService } from '../../../Finances/operation-financiere/services/operation.service';
import { AuthService } from '../../../../core/services/auth.service';
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
  protected readonly operationService = inject(OperationFinanciereService);
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
  protected readonly isSaving = signal<boolean>(false);
  protected readonly isFormLoading = computed(() =>
    this.isSaving() ||
    this.inscriptionService.isLoading() ||
    this.catechumeneService.isLoading()
  );

  // Inscriptions synchronisées avec l'état réel des opérations financières
  protected readonly enrichedInscriptions = computed(() => {
    const list = this.inscriptions();
    const ops = this.operationService.operations();
    if (ops.length === 0) return list;

    return list.map(ins => {
      if (ins.frais_inscription_payes) return ins;
      const catId = ins.catechumene_id || ins.catechumene?.id;
      const insId = ins.id;
      const hasPaidOp = ops.some(op => {
        const matchId = (op.inscription_annuelle_id && op.inscription_annuelle_id === insId) ||
          (catId && (op.catechumene_id === catId || (op.catechumene as any)?.id === catId));
        if (!matchId) return false;
        return op.statut === 'paye' || op.montant_restant === 0 || (op.montant_paye > 0 && op.montant_paye >= (op.montant_total || op.montant || 0));
      });

      return hasPaidOp ? { ...ins, frais_inscription_payes: true } : ins;
    });
  });

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
    const list = this.enrichedInscriptions();
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
    let list = this.enrichedInscriptions();

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
    this.operationService.getAll().subscribe();
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

  protected readonly authService = inject(AuthService);

  protected openRecuModal(item: InscriptionAnnuelleDto): void {
    const raw = item as any;
    const cat = item.catechumene as any;
    const catId = item.catechumene_id || cat?.id;
    const insId = item.id;

    // Chercher l'opération financière réelle associée
    const ops = this.operationService.operations();
    const op = ops.find(o =>
      (o.inscription_annuelle_id && o.inscription_annuelle_id === insId) ||
      (catId && (o.catechumene_id === catId || o.catechumene?.id === catId))
    );

    const catNom = cat?.nom_complet || (cat ? `${cat.nom || ''} ${cat.prenoms || ''}`.trim() : ((op as any)?.catechumene_nom || raw.catechumene_nom || ''));
    const matricule = cat?.matricule || cat?.code_catechumene || (op as any)?.matricule || raw.matricule || '';
    const classeNom = item.classe?.nom || raw.classe_nom || (op as any)?.classe_nom || '';
    const niveauNom = item.niveau?.nom || raw.niveau_nom || (op as any)?.niveau_nom || '';
    const sectionNom = item.section?.nom || raw.section_nom || (op as any)?.section_nom || '';
    const anneeLib = item.annee_catechese?.libelle || raw.annee_libelle || op?.annee_libelle || this.anneeService.activeAnnee()?.libelle || '';

    const isPaye = op?.statut === 'paye' || raw.frais_payes === true || item.frais_inscription_payes === true;
    const montantTotal = op ? (op.montant_total ?? op.montant ?? 0) : (raw.frais_inscription ?? raw.montant ?? raw.montant_paye ?? 0);
    const montantPaye = op ? (op.montant_paye ?? (isPaye ? montantTotal : 0)) : (isPaye ? montantTotal : (raw.montant_paye ?? 0));
    const montantRestant = op ? (op.montant_restant ?? (isPaye ? 0 : Math.max(0, montantTotal - montantPaye))) : (isPaye ? 0 : Math.max(0, montantTotal - montantPaye));

    const currentUser = this.authService.currentUser();
    const caissierName = (op as any)?.caissier_nom ||
      (op as any)?.cree_par?.nom ||
      (op as any)?.cree_par?.name ||
      raw.caissier_nom ||
      (currentUser ? (currentUser.nom && currentUser.prenoms ? `${currentUser.nom} ${currentUser.prenoms}` : (currentUser.name || currentUser.nom || '')) : '') ||
      '';

    const rawLignes = (op as any)?.lignes || (op as any)?.details || raw.lignes || [];
    const lignes = Array.isArray(rawLignes) && rawLignes.length > 0
      ? rawLignes.map((l: any) => ({
          designation: l.designation || l.tarif_nom || l.nom || `Frais de catéchèse - ${niveauNom || 'Inscription'}`,
          quantite: l.quantite || 1,
          montant_unitaire: l.montant_unitaire ?? l.tarif?.montant ?? l.montant ?? 0,
          montant: l.montant !== undefined ? l.montant : ((l.quantite || 1) * (l.montant_unitaire || 0))
        }))
      : [{
          designation: op?.libelle || `Frais d'inscription & scolarité - ${niveauNom || 'Année pastorale'}`,
          quantite: 1,
          montant_unitaire: montantTotal,
          montant: montantTotal
        }];

    this.selectedRecuData.set({
      reference: op?.reference || item.code_inscription || raw.numero_recu || `INS-${(item.id || '').substring(0, 8).toUpperCase()}`,
      date: (op?.updated_at || op?.created_at || item.date_inscription || item.created_at || new Date().toISOString()),
      catechumene_nom: catNom,
      catechumene_matricule: matricule,
      classe_nom: classeNom,
      niveau_nom: niveauNom,
      section_nom: sectionNom,
      annee_pastorale: anneeLib,
      libelle: op?.libelle || `Frais d'inscription & scolarité - ${niveauNom || 'Année pastorale'}`,
      type_operation: op?.type_tarif || 'inscription',
      montant_total: montantTotal,
      montant_paye: montantPaye,
      montant_restant: montantRestant,
      mode_paiement: (op as any)?.mode_paiement || raw.mode_paiement || 'Espèces',
      statut: isPaye ? 'paye' : (op?.statut || 'en_attente'),
      caissier_nom: caissierName,
      lignes
    });
    this.isRecuModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isFormModalOpen.set(false);
    this.isDetailModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.isRecuModalOpen.set(false);
    this.isSaving.set(false);
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
    this.isSaving.set(true);
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
        }).subscribe({
          next: () => {
            this.isSaving.set(false);
            this.closeModals();
          },
          error: () => {
            this.isSaving.set(false);
          }
        });
      },
      error: () => {
        this.isSaving.set(false);
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
    this.isSaving.set(true);
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
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModals();
      },
      error: () => {
        this.isSaving.set(false);
      }
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
    this.isSaving.set(true);
    if (this.isEditing() && this.selectedItem()) {
      this.inscriptionService.update(this.selectedItem()!.id, event.dto as UpdateInscriptionAnnuelleDto, event).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModals();
        },
        error: () => {
          this.isSaving.set(false);
        }
      });
    } else {
      this.inscriptionService.create(event.dto as CreateInscriptionAnnuelleDto, event).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModals();
        },
        error: () => {
          this.isSaving.set(false);
        }
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
