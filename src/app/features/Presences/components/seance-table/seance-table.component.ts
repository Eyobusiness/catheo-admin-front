import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SeanceDto } from '../../models/seance.model';
import { AffectationAnimateurService } from '../../../Organisations/affectation-animateurs/services/affectation-animateur.service';
import { AppIconButton } from '../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../shared/ui/components/tables/app-pagination/app-pagination.component';

@Component({
  selector: 'app-seance-table',
  imports: [CommonModule, DatePipe, AppIconButton, AppButton, AppPagination],
  templateUrl: './seance-table.component.html',
  styleUrl: './seance-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeanceTableComponent {
  private readonly affectationService = inject(AffectationAnimateurService);

  public readonly seances = input<SeanceDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly createRequested = output<void>();
  public readonly editRequested = output<SeanceDto>();
  public readonly deleteRequested = output<SeanceDto>();
  public readonly presencesRequested = output<SeanceDto>();

  protected readonly affectations = this.affectationService.affectations;

  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(10);

  protected readonly paginatedSeances = computed(() => {
    const list = this.seances();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  protected getAnimateurName(item: SeanceDto): string {
    // 1. Direct on séance
    if (item.animateur) {
      return `${item.animateur.nom} ${item.animateur.prenoms}`;
    }
    // 2. Direct on classe
    const classeObj = item.classe as any;
    if (classeObj?.animateur) {
      return `${classeObj.animateur.nom} ${classeObj.animateur.prenoms}`;
    }
    if (classeObj?.animateur_nom) {
      return classeObj.animateur_nom;
    }
    // 3. Fallback from affectations list
    const classeId = item.classe_id || item.classe?.id;
    if (classeId) {
      const match = this.affectations().find(a => a.classe_id === classeId || a.classe?.id === classeId);
      if (match?.animateur) {
        return `${match.animateur.nom} ${match.animateur.prenoms}`;
      }
    }
    return '';
  }

  protected isAppelEffectue(item: SeanceDto): boolean {
    return (item.total_presences || 0) > 0 || (item.presences && item.presences.length > 0) || item.statut === 'effectuee';
  }

  protected getAbsentCount(item: SeanceDto): number {
    if (typeof item.total_absents === 'number') {
      return item.total_absents;
    }
    if (item.presences && item.presences.length > 0) {
      return item.presences.filter(p => !p.est_present || p.statut_presence === 'absent').length;
    }
    if (typeof item.total_presences === 'number' && typeof item.total_presents === 'number') {
      return Math.max(0, item.total_presences - item.total_presents);
    }
    return 0;
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  protected onPresences(item: SeanceDto): void {
    this.presencesRequested.emit(item);
  }

  protected onEdit(item: SeanceDto): void {
    this.editRequested.emit(item);
  }

  protected onDelete(item: SeanceDto): void {
    this.deleteRequested.emit(item);
  }
}
