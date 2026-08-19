import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ClasseService } from '../services/classe.service';
import { NiveauService } from '../../Niveaux/services/niveau.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Classe, CreateClasseDto, UpdateClasseDto } from '../models/classe.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { ClasseTableComponent } from '../components/classe-table/classe-table.component';
import { ClasseFormModalComponent } from '../components/classe-form-modal/classe-form-modal.component';
import { ClasseDeleteModalComponent } from '../components/classe-delete-modal/classe-delete-modal.component';

@Component({
  selector: 'app-classes-page',
  imports: [
    AppCard,
    AppButton,
    ClasseTableComponent,
    ClasseFormModalComponent,
    ClasseDeleteModalComponent
  ],
  templateUrl: './classes-page.component.html',
  styleUrl: './classes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassesPageComponent implements OnInit {
  protected readonly classeService = inject(ClasseService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly toastService = inject(ToastService);

  // Signals from Services
  protected readonly classes = this.classeService.classes;
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly isLoading = this.classeService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedNiveauFilter = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedClasse = signal<Classe | null>(null);
  protected readonly itemToDelete = signal<Classe | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedNiveauFilter();
  });

  public ngOnInit(): void {
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
  }

  protected readonly filteredClasses = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const niveauFilter = this.selectedNiveauFilter();
    let list: Classe[] = this.classes();

    if (niveauFilter) {
      list = list.filter(c => c.niveau_id === niveauFilter || c.niveau?.id === niveauFilter);
    }

    if (!q) return list;
    return list.filter((c: Classe) =>
      c.nom.toLowerCase().includes(q)
    );
  });

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onNiveauFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedNiveauFilter.set(select.value);
  }

  protected resetAllFilters(): void {
    this.searchQuery.set('');
    this.selectedNiveauFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedClasse.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(classe: Classe): void {
    this.isEditing.set(true);
    this.selectedClasse.set(classe);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedClasse.set(null);
  }

  protected handleView(classe: Classe): void {
    const nivId = classe.niveau_id || classe.niveau?.id;
    const niv = this.niveaux().find(n => n.id === nivId);
    const nivName = niv ? niv.nom : (classe.niveau?.nom || 'Niveau');
    this.toastService.info(
      `Classe : ${classe.nom}`,
      `Niveau : ${nivName} • Effectif : ${classe.effectif_actuel || 0}/${classe.capacite_max} • Statut : ${classe.statut}`
    );
  }

  protected handleFormSubmit(dto: CreateClasseDto | UpdateClasseDto): void {
    if (this.isEditing() && this.selectedClasse()) {
      this.classeService.update(this.selectedClasse()!.id, dto as UpdateClasseDto).subscribe(() => {
        this.closeFormModal();
      });
    } else {
      this.classeService.create(dto as CreateClasseDto).subscribe(() => {
        this.closeFormModal();
      });
    }
  }

  protected handleToggleStatus(classe: Classe): void {
    this.classeService.toggleStatus(classe).subscribe();
  }

  protected openDeleteModal(classe: Classe): void {
    this.itemToDelete.set(classe);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.classeService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
