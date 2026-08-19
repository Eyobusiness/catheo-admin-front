import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { InscriptionAnnuelleService } from '../../inscriptions-annuelles/services/inscription-annuelle.service';
import { AffectationService } from '../services/affectation.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ToastService } from '../../../../core/services/toast.service';
import { InscriptionAnnuelleDto } from '../../inscriptions-annuelles/models/inscription-annuelle.model';
import { ClasseDto } from '../../../Organisations/Classe/models/classe.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AffectationTableComponent } from '../components/affectation-table/affectation-table.component';
import { AffectationBulkModalComponent } from '../components/affectation-bulk-modal/affectation-bulk-modal.component';

@Component({
  selector: 'app-affectations-page',
  imports: [
    AppCard,
    AppButton,
    AffectationTableComponent,
    AffectationBulkModalComponent
  ],
  templateUrl: './affectations-page.component.html',
  styleUrl: './affectations-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AffectationsPageComponent implements OnInit {
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly affectationService = inject(AffectationService);
  protected readonly classeService = inject(ClasseService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly toastService = inject(ToastService);

  // Signals
  protected readonly inscriptions = this.inscriptionService.inscriptions;
  protected readonly classes = this.classeService.classes;
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly isLoading = this.affectationService.isLoading;

  // Local Page Filters & Selection
  protected readonly searchQuery = signal<string>('');
  protected readonly niveauFilter = signal<string>('');
  protected readonly affectationFilter = signal<string>(''); // '' | 'non_affecte' | 'affecte'
  protected readonly selectedInscriptionIds = signal<string[]>([]);

  protected readonly isBulkModalOpen = signal<boolean>(false);

  // Stats
  protected readonly stats = computed(() => {
    const list = this.inscriptions();
    const affectes = list.filter(i => !!i.classe_id || !!i.classe?.id).length;
    return {
      total: list.length,
      affectes,
      nonAffectes: list.length - affectes
    };
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.niveauFilter() || !!this.affectationFilter();
  });

  protected readonly filteredInscriptions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const nf = this.niveauFilter();
    const af = this.affectationFilter();
    let list = this.inscriptions();

    if (nf) {
      list = list.filter(i => i.niveau_id === nf || i.niveau?.id === nf);
    }

    if (af === 'non_affecte') {
      list = list.filter(i => !i.classe_id && !i.classe?.id);
    } else if (af === 'affecte') {
      list = list.filter(i => !!i.classe_id || !!i.classe?.id);
    }

    if (!q) return list;
    return list.filter(i =>
      (i.catechumene?.nom && i.catechumene.nom.toLowerCase().includes(q)) ||
      (i.catechumene?.prenoms && i.catechumene.prenoms.toLowerCase().includes(q)) ||
      (i.code_inscription && i.code_inscription.toLowerCase().includes(q)) ||
      (i.classe?.nom && i.classe.nom.toLowerCase().includes(q))
    );
  });

  public ngOnInit(): void {
    this.inscriptionService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onNiveauFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.niveauFilter.set(select.value);
  }

  protected onAffectationFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.affectationFilter.set(select.value);
  }

  protected resetAllFilters(): void {
    this.searchQuery.set('');
    this.niveauFilter.set('');
    this.affectationFilter.set('');
  }

  protected handleSelectionToggle(id: string): void {
    const current = this.selectedInscriptionIds();
    if (current.includes(id)) {
      this.selectedInscriptionIds.set(current.filter(i => i !== id));
    } else {
      this.selectedInscriptionIds.set([...current, id]);
    }
  }

  protected handleSelectAllToggle(selectAll: boolean): void {
    if (selectAll) {
      this.selectedInscriptionIds.set(this.filteredInscriptions().map(i => i.id));
    } else {
      this.selectedInscriptionIds.set([]);
    }
  }

  protected handleClassChanged(event: { inscriptionId: string; classeId: string }): void {
    this.affectationService.assignClasse(event.inscriptionId, event.classeId || null).subscribe();
  }

  protected openBulkModal(): void {
    if (this.selectedInscriptionIds().length === 0) {
      this.toastService.warning('Sélection requise', 'Veuillez sélectionner au moins un catéchumène.');
      return;
    }
    this.isBulkModalOpen.set(true);
  }

  protected closeBulkModal(): void {
    this.isBulkModalOpen.set(false);
  }

  protected handleBulkAssigned(classeId: string): void {
    const ids = this.selectedInscriptionIds();
    this.affectationService.bulkAssign(ids, classeId).subscribe(() => {
      this.selectedInscriptionIds.set([]);
      this.closeBulkModal();
    });
  }
}
