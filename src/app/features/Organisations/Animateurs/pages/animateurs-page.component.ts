import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AnimateurService } from '../services/animateur.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Animateur, CreateAnimateurDto, UpdateAnimateurDto } from '../models/animateur.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AnimateurTableComponent } from '../components/animateur-table/animateur-table.component';
import { AnimateurFormModalComponent } from '../components/animateur-form-modal/animateur-form-modal.component';
import { AnimateurDeleteModalComponent } from '../components/animateur-delete-modal/animateur-delete-modal.component';

@Component({
  selector: 'app-animateurs-page',
  imports: [
    AppCard,
    AppButton,
    AnimateurTableComponent,
    AnimateurFormModalComponent,
    AnimateurDeleteModalComponent
  ],
  templateUrl: './animateurs-page.component.html',
  styleUrl: './animateurs-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateursPageComponent implements OnInit {
  protected readonly animateurService = inject(AnimateurService);
  protected readonly toastService = inject(ToastService);

  // Signals from Service
  protected readonly animateurs = this.animateurService.animateurs;
  protected readonly isLoading = this.animateurService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedSexeFilter = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedAnimateur = signal<Animateur | null>(null);
  protected readonly itemToDelete = signal<Animateur | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedSexeFilter() || !!this.selectedStatutFilter();
  });

  public ngOnInit(): void {
    this.animateurService.getAll().subscribe();
  }

  protected readonly filteredAnimateurs = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sexeFilter = this.selectedSexeFilter();
    const statutFilter = this.selectedStatutFilter();
    let list: Animateur[] = this.animateurs();

    if (sexeFilter) {
      list = list.filter(a => a.sexe === sexeFilter);
    }

    if (statutFilter) {
      list = list.filter(a => a.statut === statutFilter);
    }

    if (!q) return list;
    return list.filter((a: Animateur) =>
      a.nom.toLowerCase().includes(q) ||
      a.prenoms.toLowerCase().includes(q) ||
      (a.matricule && a.matricule.toLowerCase().includes(q)) ||
      (a.telephone && a.telephone.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.profession && a.profession.toLowerCase().includes(q))
    );
  });

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onSexeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedSexeFilter.set(select.value);
  }

  protected onStatutFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatutFilter.set(select.value);
  }

  protected resetAllFilters(): void {
    this.searchQuery.set('');
    this.selectedSexeFilter.set('');
    this.selectedStatutFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedAnimateur.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(animateur: Animateur): void {
    this.isEditing.set(true);
    this.selectedAnimateur.set(animateur);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedAnimateur.set(null);
  }

  protected handleView(animateur: Animateur): void {
    this.toastService.info(
      `Catéchiste : ${animateur.nom} ${animateur.prenoms}`,
      `Matricule : ${animateur.matricule || 'Non assigné'} • Téléphone : ${animateur.telephone || '—'} • Statut : ${animateur.statut}`
    );
  }

  protected handleFormSubmit(dto: CreateAnimateurDto | UpdateAnimateurDto): void {
    if (this.isEditing() && this.selectedAnimateur()) {
      this.animateurService.update(this.selectedAnimateur()!.id, dto as UpdateAnimateurDto).subscribe(() => {
        this.closeFormModal();
      });
    } else {
      this.animateurService.create(dto as CreateAnimateurDto).subscribe(() => {
        this.closeFormModal();
      });
    }
  }

  protected handleToggleStatus(animateur: Animateur): void {
    this.animateurService.toggleStatus(animateur).subscribe();
  }

  protected openDeleteModal(animateur: Animateur): void {
    this.itemToDelete.set(animateur);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.animateurService.delete(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
