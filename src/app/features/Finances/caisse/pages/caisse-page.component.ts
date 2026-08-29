import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CaisseService } from '../services/caisse.service';
import {
  CaisseMouvementDto,
  CreateMouvementCaisseDto,
  RemboursementCaisseDto,
  TypeMouvementCaisse
} from '../models/caisse.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { CaisseTableComponent } from '../components/caisse-table/caisse-table.component';
import { CaisseMouvementModalComponent } from '../components/caisse-mouvement-modal/caisse-mouvement-modal.component';
import { CaisseRembourserModalComponent } from '../components/caisse-rembourser-modal/caisse-rembourser-modal.component';
import { CaisseDeleteModalComponent } from '../components/caisse-delete-modal/caisse-delete-modal.component';

@Component({
  selector: 'app-caisse-page',
  imports: [
    CommonModule,
    DecimalPipe,
    AppCard,
    AppButton,
    CaisseTableComponent,
    CaisseMouvementModalComponent,
    CaisseRembourserModalComponent,
    CaisseDeleteModalComponent
  ],
  templateUrl: './caisse-page.component.html',
  styleUrl: './caisse-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaissePageComponent implements OnInit {
  protected readonly caisseService = inject(CaisseService);

  protected readonly mouvements = this.caisseService.mouvements;
  protected readonly kpis = this.caisseService.kpis;
  protected readonly isLoading = this.caisseService.isLoading;

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedTypeFilter = signal<string>('');
  protected readonly dateDebutFilter = signal<string>('');
  protected readonly dateFinFilter = signal<string>('');

  protected readonly isMouvementModalOpen = signal<boolean>(false);
  protected readonly isRembourserModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly selectedMouvement = signal<CaisseMouvementDto | null>(null);

  protected readonly filteredMouvements = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const type = this.selectedTypeFilter();
    let list = this.mouvements();

    if (type) {
      if (type === 'entree') {
        list = list.filter(m => m.type_mouvement === 'entree' || m.type_mouvement === 'recette');
      } else if (type === 'sortie') {
        list = list.filter(m => m.type_mouvement === 'sortie' || m.type_mouvement === 'depense');
      } else if (type === 'remboursement') {
        list = list.filter(m => m.type_mouvement === 'remboursement');
      }
    }

    if (!q) return list;
    return list.filter(m =>
      m.libelle.toLowerCase().includes(q) ||
      (m.categorie && m.categorie.toLowerCase().includes(q)) ||
      (m.reference_document && m.reference_document.toLowerCase().includes(q))
    );
  });

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedTypeFilter() || !!this.dateDebutFilter() || !!this.dateFinFilter();
  });

  public ngOnInit(): void {
    this.caisseService.getAll().subscribe();
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected onTypeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedTypeFilter.set(select.value);
  }

  protected onDateDebutChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dateDebutFilter.set(input.value);
    this.reloadWithDateFilters();
  }

  protected onDateFinChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dateFinFilter.set(input.value);
    this.reloadWithDateFilters();
  }

  protected reloadWithDateFilters(): void {
    this.caisseService.getAll(
      undefined,
      undefined,
      this.dateDebutFilter() || undefined,
      this.dateFinFilter() || undefined
    ).subscribe();
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedTypeFilter.set('');
    this.dateDebutFilter.set('');
    this.dateFinFilter.set('');
    this.caisseService.getAll().subscribe();
  }

  protected openMouvementModal(): void {
    this.isMouvementModalOpen.set(true);
  }

  protected openRembourserModal(item: CaisseMouvementDto): void {
    this.selectedMouvement.set(item);
    this.isRembourserModalOpen.set(true);
  }

  protected openDeleteModal(item: CaisseMouvementDto): void {
    this.selectedMouvement.set(item);
    this.isDeleteModalOpen.set(true);
  }

  protected closeModals(): void {
    this.isMouvementModalOpen.set(false);
    this.isRembourserModalOpen.set(false);
    this.isDeleteModalOpen.set(false);
    this.selectedMouvement.set(null);
  }

  protected handleMouvementSubmit(dto: CreateMouvementCaisseDto): void {
    this.caisseService.create(dto).subscribe(() => {
      this.closeModals();
    });
  }

  protected handleRemboursementSubmit(event: { mouvementId: string; dto: RemboursementCaisseDto }): void {
    this.caisseService.rembourser(event.mouvementId, event.dto).subscribe(() => {
      this.closeModals();
    });
  }

  protected handleDeleteConfirm(): void {
    const item = this.selectedMouvement();
    if (item) {
      this.caisseService.delete(item.id).subscribe(() => {
        this.closeModals();
      });
    }
  }
}
