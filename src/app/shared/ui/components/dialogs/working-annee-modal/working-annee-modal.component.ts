import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { WorkingAnneeService } from '../../../../../core/services/working-annee.service';
import { AnneeCatechese } from '../../../../../core/models/annee-catechese.model';
import { AppDialog } from '../app-dialog/app-dialog.component';
import { AppButton } from '../../buttons/app-button/app-button.component';

@Component({
  selector: 'app-working-annee-modal',
  imports: [AppDialog, AppButton],
  templateUrl: './working-annee-modal.component.html',
  styleUrl: './working-annee-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkingAnneeModalComponent {
  protected readonly workingAnneeService = inject(WorkingAnneeService);

  // Search filter query inside the modal
  protected readonly searchQuery = signal<string>('');

  protected readonly isOpen = this.workingAnneeService.isModalOpen;
  protected readonly currentWorkingAnnee = this.workingAnneeService.workingAnnee;
  protected readonly availableAnnees = this.workingAnneeService.availableAnnees;
  protected readonly isLoading = this.workingAnneeService.isLoading;

  protected readonly filteredAnnees = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.availableAnnees();
    if (!query) return list;
    return list.filter(a =>
      a.libelle.toLowerCase().includes(query) ||
      (a.statut && a.statut.toLowerCase().includes(query)) ||
      (a.date_debut && a.date_debut.includes(query)) ||
      (a.date_fin && a.date_fin.includes(query))
    );
  });

  protected onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  protected selectAnnee(annee: AnneeCatechese): void {
    this.workingAnneeService.setWorkingAnnee(annee);
  }

  protected onClose(): void {
    this.searchQuery.set('');
    this.workingAnneeService.closeModal();
  }
}
