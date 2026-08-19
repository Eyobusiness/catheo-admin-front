import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Calendrier } from '../../models/calendrier.model';
import { AnneeCatechese } from '../../../AnneesPastorales/models/annee-catechese.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-calendrier-table',
  imports: [AppIconButton, AppButton, AppPagination],
  templateUrl: './calendrier-table.component.html',
  styleUrl: './calendrier-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendrierTableComponent {
  public readonly calendriers = input<Calendrier[]>([]);
  public readonly annees = input<AnneeCatechese[]>([]);

  public readonly viewRequested = output<Calendrier>();
  public readonly editRequested = output<Calendrier>();
  public readonly deleteRequested = output<Calendrier>();
  public readonly toggleStatusRequested = output<{ id: string; nextStatus: 'Planifié' | 'Réalisé' | 'Annulé' }>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  protected readonly paginatedCalendriers = computed(() => {
    const list = this.calendriers();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getAnneeLibelle(item: Calendrier): string {
    if (item.annee_catechese?.libelle) return item.annee_catechese.libelle;
    const anneeId = item.annee_catechese_id || item.annee_catechese?.id;
    if (anneeId) {
      const a = this.annees().find(an => an.id === anneeId);
      if (a) return a.libelle;
    }
    return 'Année pastorale';
  }

  protected getNextStatus(current: 'Planifié' | 'Réalisé' | 'Annulé'): 'Planifié' | 'Réalisé' | 'Annulé' {
    if (current === 'Planifié') return 'Réalisé';
    if (current === 'Réalisé') return 'Annulé';
    return 'Planifié';
  }

  protected getDay(dateStr: string): string {
    if (!dateStr) return '01';
    const clean = dateStr.split('T')[0].split(' ')[0];
    const parts = clean.split('-');
    return parts.length >= 3 ? parts[2] : clean;
  }

  protected getMonthName(dateStr: string): string {
    if (!dateStr) return 'OCT';
    const clean = dateStr.split('T')[0].split(' ')[0];
    const parts = clean.split('-');
    if (parts.length >= 2) {
      const monthNum = parseInt(parts[1], 10);
      const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEP', 'OCT', 'NOV', 'DÉC'];
      return months[monthNum - 1] || 'OCT';
    }
    return 'OCT';
  }

  protected onView(event: Calendrier): void {
    this.viewRequested.emit(event);
  }

  protected onEdit(event: Calendrier): void {
    this.editRequested.emit(event);
  }

  protected onDelete(event: Calendrier): void {
    this.deleteRequested.emit(event);
  }

  protected onToggleStatus(event: Calendrier): void {
    const nextStatus = this.getNextStatus(event.statut);
    this.toggleStatusRequested.emit({ id: event.id, nextStatus });
  }

  protected onCreate(): void {
    this.createRequested.emit();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }
}

