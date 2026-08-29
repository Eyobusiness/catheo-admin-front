import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ConfigurationService } from '../../services/configuration.service';
import { AppCard } from '../../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { ResponsableFormModalComponent } from '../responsable-form-modal/responsable-form-modal.component';
import { ResponsableDeleteModalComponent } from '../responsable-delete-modal/responsable-delete-modal.component';
import {
  CreateResponsableParoisseDto,
  ResponsableParoisse,
  UpdateResponsableParoisseDto
} from '../../models/configuration.model';

@Component({
  selector: 'app-tab-responsables-config',
  imports: [
    AppCard,
    AppButton,
    AppIconButton,
    ResponsableFormModalComponent,
    ResponsableDeleteModalComponent
  ],
  templateUrl: './tab-responsables-config.component.html',
  styleUrl: './tab-responsables-config.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabResponsablesConfigComponent {
  protected readonly configService = inject(ConfigurationService);
  protected readonly responsables = this.configService.responsables;
  protected readonly isSaving = this.configService.isSaving;

  // Local state signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedStatutFilter = signal<string>('');
  protected readonly isFormModalOpen = signal<boolean>(false);
  protected readonly isDeleteModalOpen = signal<boolean>(false);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly selectedResponsable = signal<ResponsableParoisse | null>(null);
  protected readonly itemToDelete = signal<ResponsableParoisse | null>(null);

  protected readonly filteredResponsables = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatutFilter();
    let list = this.responsables();

    if (status) {
      list = list.filter(r => r.statut === status);
    }

    if (!q) return list;
    return list.filter(r =>
      (r.nom_prenoms && r.nom_prenoms.toLowerCase().includes(q)) ||
      (r.fonction && r.fonction.toLowerCase().includes(q)) ||
      (r.titre_fonction && r.titre_fonction.toLowerCase().includes(q)) ||
      (r.telephone && r.telephone.includes(q))
    );
  });

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
  }

  protected onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatutFilter.set(select.value);
  }

  protected resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatutFilter.set('');
  }

  protected getInitials(nomPrenoms: string): string {
    if (!nomPrenoms) return 'RP';
    const parts = nomPrenoms.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return nomPrenoms.substring(0, 2).toUpperCase() || 'RP';
  }

  protected openCreateModal(): void {
    this.isEditing.set(false);
    this.selectedResponsable.set(null);
    this.isFormModalOpen.set(true);
  }

  protected openEditModal(resp: ResponsableParoisse): void {
    this.isEditing.set(true);
    this.selectedResponsable.set(resp);
    this.isFormModalOpen.set(true);
  }

  protected closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.selectedResponsable.set(null);
  }

  protected handleFormSubmit(dto: CreateResponsableParoisseDto | UpdateResponsableParoisseDto): void {
    if (this.isEditing() && this.selectedResponsable()) {
      this.configService
        .updateResponsable(this.selectedResponsable()!.id, dto as UpdateResponsableParoisseDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    } else {
      this.configService
        .createResponsable(dto as CreateResponsableParoisseDto)
        .subscribe(() => {
          this.closeFormModal();
        });
    }
  }

  protected handleToggleStatus(resp: ResponsableParoisse): void {
    const nextStatus: 'actif' | 'inactif' = resp.statut === 'actif' ? 'inactif' : 'actif';
    this.configService.patchResponsableStatus(resp.id, nextStatus).subscribe();
  }

  protected openDeleteModal(resp: ResponsableParoisse): void {
    this.itemToDelete.set(resp);
    this.isDeleteModalOpen.set(true);
  }

  protected closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected handleDeleteConfirm(): void {
    const target = this.itemToDelete();
    if (target) {
      this.configService.deleteResponsable(target.id).subscribe(() => {
        this.closeDeleteModal();
      });
    }
  }
}
