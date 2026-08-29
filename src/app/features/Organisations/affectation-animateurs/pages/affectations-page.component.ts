import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AffectationAnimateurService } from '../services/affectation-animateur.service';
import { AnimateurService } from '../../Animateurs/services/animateur.service';
import { ClasseService } from '../../Classe/services/classe.service';
import { AnneeCatecheseService } from '../../AnneesPastorales/services/annee-catechese.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  AffectationAnimateur,
  CreateAffectationAnimateurDto,
  UpdateAffectationAnimateurDto
} from '../models/affectation-animateur.model';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AffectationTableComponent } from '../components/affectation-table/affectation-table.component';
import { AffectationFormModalComponent } from '../components/affectation-form-modal/affectation-form-modal.component';
import { AffectationDeleteModalComponent } from '../components/affectation-delete-modal/affectation-delete-modal.component';

@Component({
  selector: 'app-affectations-page',
  imports: [
    AppCard,
    AppButton,
    AffectationTableComponent,
    AffectationFormModalComponent,
    AffectationDeleteModalComponent
  ],
  templateUrl: './affectations-page.component.html',
  styleUrl: './affectations-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AffectationsPageComponent implements OnInit {
  protected readonly affectationService = inject(AffectationAnimateurService);
  protected readonly animateurService = inject(AnimateurService);
  protected readonly classeService = inject(ClasseService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly toastService = inject(ToastService);

  // Signals from Services
  protected readonly affectations = this.affectationService.affectations;
  protected readonly animateurs = this.animateurService.animateurs;
  protected readonly classes = this.classeService.classes;
  protected readonly isLoading = this.affectationService.isLoading;

  // Local Page Signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedRoleFilter = signal<string>('');
  protected readonly selectedClasseFilter = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedAffectation = signal<AffectationAnimateur | null>(null);
  protected readonly itemToDelete = signal<AffectationAnimateur | null>(null);

  protected readonly hasActiveFilters = computed(() => {
    return !!this.searchQuery() || !!this.selectedRoleFilter() || !!this.selectedClasseFilter();
  });

  public ngOnInit(): void {
    this.anneeService.getAll().subscribe();
    this.animateurService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.affectationService.getAll().subscribe();
  }

  protected readonly filteredAffectations = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const roleFilter = this.selectedRoleFilter();
    const classeFilter = this.selectedClasseFilter();
    let list: AffectationAnimateur[] = this.affectations();

    if (roleFilter) {
      list = list.filter(a => a.role === roleFilter);
    }

    if (classeFilter) {
      list = list.filter(a => a.classe_id === classeFilter || a.classe?.id === classeFilter);
    }

    if (!q) return list;
    return list.filter((a: AffectationAnimateur) => {
      const animName = `${a.animateur?.nom || ''} ${a.animateur?.prenoms || ''}`.toLowerCase();
      const classeName = (a.classe?.nom || '').toLowerCase();
      const matricule = (a.animateur?.matricule || '').toLowerCase();
      return animName.includes(q) || classeName.includes(q) || matricule.includes(q);
    });
  });

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onRoleFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedRoleFilter.set(select.value);
  }

  protected onClasseFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedClasseFilter.set(select.value);
  }

  protected resetAllFilters(): void {
    this.searchQuery.set('');
    this.selectedRoleFilter.set('');
    this.selectedClasseFilter.set('');
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedAffectation.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(aff: AffectationAnimateur): void {
    this.isEditing.set(true);
    this.selectedAffectation.set(aff);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedAffectation.set(null);
    this.isEditing.set(false);
  }

  protected handleView(aff: AffectationAnimateur): void {
    this.toastService.info(
      `Affectation : ${aff.animateur?.nom} ${aff.animateur?.prenoms}`,
      `Classe : ${aff.classe?.nom} • Rôle : ${aff.role} • Date : ${aff.date_affectation}`
    );
  }

  protected handleFormSubmit(event: {
    dto: CreateAffectationAnimateurDto | UpdateAffectationAnimateurDto;
    animateurLabel: string;
    classeLabel: string;
  }): void {
    if (this.isEditing() && this.selectedAffectation()) {
      this.affectationService
        .update(
          this.selectedAffectation()!.id,
          event.dto as UpdateAffectationAnimateurDto,
          event.animateurLabel,
          event.classeLabel
        )
        .subscribe({
          next: () => this.closeFormModal(),
          error: () => {}
        });
    } else {
      const activeAnnee = this.anneeService.activeAnnee();
      const payload: CreateAffectationAnimateurDto = {
        ...(event.dto as CreateAffectationAnimateurDto),
        annee_catechese_id: activeAnnee?.id
      };
      this.affectationService
        .create(
          payload,
          event.animateurLabel,
          event.classeLabel
        )
        .subscribe({
          next: () => this.closeFormModal(),
          error: () => {}
        });
    }
  }

  protected handleToggleRole(event: { id: string; nextRole: string }): void {
    this.affectationService.patchRole(event.id, event.nextRole).subscribe({
      error: () => {}
    });
  }

  protected openDeleteModal(aff: AffectationAnimateur): void {
    this.itemToDelete.set(aff);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.affectationService.delete(target.id).subscribe({
        next: () => this.closeDeleteModal(),
        error: () => {}
      });
    }
  }
}
