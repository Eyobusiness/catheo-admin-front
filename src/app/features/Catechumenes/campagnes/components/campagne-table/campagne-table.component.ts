import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CampagnePreinscriptionDto } from '../../models/campagne.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';
import { AppPagination } from '../../../../../shared/ui/components/tables/app-pagination/app-pagination.component';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-campagne-table',
  imports: [CommonModule, DatePipe, AppIconButton, AppButton, AppPagination],
  templateUrl: './campagne-table.component.html',
  styleUrl: './campagne-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampagneTableComponent {
  private readonly toastService = inject(ToastService);

  public readonly campagnes = input<CampagnePreinscriptionDto[]>([]);

  public readonly viewRequested = output<CampagnePreinscriptionDto>();
  public readonly editRequested = output<CampagnePreinscriptionDto>();
  public readonly deleteRequested = output<CampagnePreinscriptionDto>();
  public readonly toggleStatusRequested = output<CampagnePreinscriptionDto>();
  public readonly qrRequested = output<CampagnePreinscriptionDto>();
  public readonly createRequested = output<void>();

  // Local Pagination
  public readonly currentPage = signal<number>(1);
  public readonly pageSize = signal<number>(10);

  // Copied state for visual feedback
  public readonly copiedId = signal<string | null>(null);

  protected readonly paginatedCampagnes = computed(() => {
    const list = this.campagnes();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  public getPublicUrl(campagne: CampagnePreinscriptionDto): string {
    if (campagne.public_url) return campagne.public_url;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/preinscription-publique/${campagne.id}`;
  }

  public copyPublicUrl(event: MouseEvent, campagne: CampagnePreinscriptionDto): void {
    event.stopPropagation();
    const url = this.getPublicUrl(campagne);
    if (navigator?.clipboard && url) {
      navigator.clipboard.writeText(url).then(() => {
        this.copiedId.set(campagne.id);
        this.toastService.success('Lien Copié !', `Le lien public pour "${campagne.titre}" a été copié.`);
        setTimeout(() => {
          if (this.copiedId() === campagne.id) {
            this.copiedId.set(null);
          }
        }, 2200);
      }).catch(() => {
        this.toastService.info('Lien Public', url);
      });
    } else if (url) {
      this.toastService.info('Lien Public', url);
    }
  }

  public getDaysRemainingInfo(dateFinStr: string): { label: string; class: string } {
    if (!dateFinStr) return { label: 'Non définie', class: 'neutral' };
    const now = new Date();
    const fin = new Date(dateFinStr);
    fin.setHours(23, 59, 59, 999);
    const diffMs = fin.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Échue', class: 'expired' };
    }
    if (diffDays === 0) {
      return { label: "Aujourd'hui", class: 'urgent' };
    }
    if (diffDays === 1) {
      return { label: 'Demain', class: 'urgent' };
    }
    if (diffDays <= 7) {
      return { label: `${diffDays}j restants`, class: 'warning' };
    }
    return { label: `${diffDays} jours`, class: 'normal' };
  }

  protected isCampagneEnCours(campagne: CampagnePreinscriptionDto): boolean {
    if (!campagne.est_ouverte) return false;
    const now = new Date();
    const fin = new Date(campagne.date_fin);
    return fin >= now;
  }

  protected onView(item: CampagnePreinscriptionDto): void {
    this.viewRequested.emit(item);
  }

  protected onEdit(item: CampagnePreinscriptionDto): void {
    this.editRequested.emit(item);
  }

  protected onDelete(item: CampagnePreinscriptionDto): void {
    this.deleteRequested.emit(item);
  }

  protected onToggleStatus(item: CampagnePreinscriptionDto): void {
    this.toggleStatusRequested.emit(item);
  }

  protected onQr(item: CampagnePreinscriptionDto): void {
    this.qrRequested.emit(item);
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
