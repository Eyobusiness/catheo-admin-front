import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperationFinanciereService } from '../services/operation.service';
import { CatechumeneService } from '../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { InscriptionAnnuelleService } from '../../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { TarifService } from '../../tarification/services/tarif.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  OperationPaiementDto,
  StorePaiementDto
} from '../models/operation.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { OperationTableComponent } from '../components/operation-table/operation-table.component';
import { OperationEncaisserModalComponent } from '../components/operation-encaisser-modal/operation-encaisser-modal.component';
import { OperationDeleteModalComponent } from '../components/operation-delete-modal/operation-delete-modal.component';
import { RecuThermiqueModalComponent } from '../../../../shared/ui/components/recu-thermique-modal/recu-thermique-modal.component';
import { RecuPaiementData } from '../../../../shared/ui/components/recu-thermique-modal/models/recu-thermique.model';

@Component({
  selector: 'app-operations-page',
  imports: [
    CommonModule,
    AppCard,
    OperationTableComponent,
    OperationEncaisserModalComponent,
    OperationDeleteModalComponent,
    RecuThermiqueModalComponent
  ],
  templateUrl: './operations-page.component.html',
  styleUrl: './operations-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsPageComponent implements OnInit {
  protected readonly operationService = inject(OperationFinanciereService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly tarifService = inject(TarifService);
  protected readonly anneeService = inject(AnneeCatecheseService);

  protected readonly operations = this.operationService.operations;
  protected readonly catechumenes = this.catechumeneService.catechumenes;
  protected readonly tarifs = this.tarifService.tarifs;
  protected readonly annees = this.anneeService.annees;
  protected readonly activeAnnee = this.anneeService.activeAnnee;
  protected readonly isLoading = this.operationService.isLoading;

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');

  protected readonly isEncaisserModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isRecuModalOpen = signal<boolean>(false);
  protected readonly selectedOperation = signal<OperationPaiementDto | null>(null);
  protected readonly selectedRecuData = signal<RecuPaiementData | null>(null);

  // KPIs
  protected readonly totalOperations = computed(() => this.operations().length);
  protected readonly totalEnAttente = computed(() => this.operations().filter(o => o.statut === 'en_attente').length);
  protected readonly totalPartiels = computed(() => this.operations().filter(o => o.statut === 'partiellement_paye').length);
  protected readonly totalPayes = computed(() => this.operations().filter(o => o.statut === 'paye').length);

  protected readonly filteredOperations = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const st = this.selectedStatutFilter();
    let list = this.operations();

    if (st) {
      list = list.filter(o => o.statut === st);
    }

    if (!q) return list;
    return list.filter(o =>
      o.reference.toLowerCase().includes(q) ||
      o.libelle.toLowerCase().includes(q) ||
      (o.catechumene && `${o.catechumene.nom} ${o.catechumene.prenoms}`.toLowerCase().includes(q))
    );
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedStatutFilter();
  });

  public ngOnInit(): void {
    this.operationService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.tarifService.getAll().subscribe();
    this.anneeService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected onStatutFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatutFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatutFilter.set('');
  }

  protected openEncaisserModal(item: OperationPaiementDto): void {
    this.selectedOperation.set(item);
    this.isEncaisserModalOpen.set(true);
  }

  protected readonly authService = inject(AuthService);

  protected openDeleteModal(item: OperationPaiementDto): void {
    this.selectedOperation.set(item);
    this.isDeleteModalOpen.set(true);
  }

  protected openRecuModal(item: OperationPaiementDto, extra?: { montantRecu?: number; montantRendu?: number }): void {
    const raw = item as any;
    const cat = item.catechumene as any;
    const catNom = cat?.nom_complet || (cat ? `${cat.nom || ''} ${cat.prenoms || ''}`.trim() : (raw.catechumene_nom || ''));
    const matricule = cat?.matricule || cat?.code_catechumene || raw.matricule || '';
    const classeNom = cat?.classe_nom || cat?.classe?.nom || raw.classe_nom || '';
    const niveauNom = cat?.niveau_nom || cat?.niveau?.nom || raw.niveau_nom || '';
    const sectionNom = cat?.section_nom || cat?.section?.nom || raw.section_nom || '';

    const montantTotal = item.montant_total ?? item.montant ?? 0;
    const montantPaye = item.montant_paye ?? (item.statut === 'paye' ? montantTotal : (raw.montant_regle ?? 0));
    const montantRestant = item.montant_restant ?? (item.statut === 'paye' ? 0 : Math.max(0, montantTotal - montantPaye));
    const montantRecu = extra?.montantRecu || (montantPaye > 0 ? montantPaye : montantTotal);
    const montantRendu = extra?.montantRendu ?? (montantRecu > montantPaye ? montantRecu - montantPaye : 0);

    const currentUser = this.authService.currentUser();
    const caissierName = raw.caissier_nom ||
      raw.cree_par?.nom ||
      raw.cree_par?.name ||
      raw.user?.name ||
      (currentUser ? (currentUser.nom && currentUser.prenoms ? `${currentUser.nom} ${currentUser.prenoms}` : (currentUser.name || currentUser.nom || '')) : '') ||
      '';

    const rawLignes = raw.lignes || raw.details || raw.lignes_paiement || [];
    const lignes = Array.isArray(rawLignes) && rawLignes.length > 0
      ? rawLignes.map((l: any) => ({
          designation: l.designation || l.tarif_nom || l.nom || item.libelle || 'Prestation',
          quantite: l.quantite || 1,
          montant_unitaire: l.montant_unitaire ?? l.tarif?.montant ?? l.montant ?? 0,
          montant: l.montant !== undefined ? l.montant : ((l.quantite || 1) * (l.montant_unitaire || 0))
        }))
      : [{
          designation: item.libelle || 'Paiement frais de catéchèse',
          quantite: 1,
          montant_unitaire: montantTotal,
          montant: montantTotal
        }];

    this.selectedRecuData.set({
      reference: item.reference || raw.numero_recu || `REC-${item.id}`,
      date: item.updated_at || item.created_at || raw.date_paiement || new Date().toISOString(),
      catechumene_nom: catNom,
      catechumene_matricule: matricule,
      classe_nom: classeNom,
      niveau_nom: niveauNom,
      section_nom: sectionNom,
      annee_pastorale: item.annee_libelle || item.annee_catechese?.libelle || this.activeAnnee()?.libelle || '',
      libelle: item.libelle || 'Reçu de paiement',
      type_operation: item.type_tarif || 'paiement',
      montant_total: montantTotal,
      montant_recu: montantRecu,
      montant_paye: montantPaye,
      montant_restant: montantRestant,
      montant_rendu: montantRendu,
      mode_paiement: raw.mode_paiement || raw.mode_reglement || 'Espèces',
      statut: item.statut,
      caissier_nom: caissierName,
      lignes
    });
    this.isRecuModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isEncaisserModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.isRecuModalOpen.set(false);
    this.selectedOperation.set(null);
  }

  protected handleEncaissementSubmit(event: {
    operationId: string;
    dto: StorePaiementDto;
    montantRecu?: number;
    montantRendu?: number;
  }): void {
    const op = this.selectedOperation();
    this.operationService.encaisser(event.operationId, event.dto).subscribe(() => {
      this.closeModals();

      // Mettre à jour l'état d'inscription immédiatement
      if (op?.inscription_annuelle_id || op?.catechumene_id) {
        this.inscriptionService.inscriptions.update(list =>
          list.map(ins => {
            const match = ins.id === op.inscription_annuelle_id ||
              ins.catechumene_id === op.catechumene_id ||
              ins.catechumene?.id === op.catechumene_id;
            return match ? { ...ins, frais_inscription_payes: true } : ins;
          })
        );
      }
      this.inscriptionService.getAll().subscribe();

      if (op) {
        this.openRecuModal({
          ...op,
          statut: 'paye',
          montant_paye: op.montant_total || op.montant || 0,
          montant_restant: 0
        }, {
          montantRecu: event.montantRecu,
          montantRendu: event.montantRendu
        });
      }
    });
  }

  protected handleDeleteConfirm(): void {
    const item = this.selectedOperation();
    if (item) {
      this.operationService.delete(item.id).subscribe(() => {
        this.closeModals();
      });
    }
  }
}
