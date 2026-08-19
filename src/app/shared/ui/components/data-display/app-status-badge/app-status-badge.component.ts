import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusBadgeType = 'VALIDEE' | 'EN_ATTENTE' | 'A_COMPLETER' | 'EN_COURS' | 'REPORTEE' | 'URGENT' | 'PAYE' | 'ANNULE' | string;

@Component({
  selector: 'app-status-badge',
  templateUrl: './app-status-badge.component.html',
  styleUrl: './app-status-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppStatusBadge {
  public readonly status = input<StatusBadgeType>('EN_ATTENTE');
  public readonly size = input<'sm' | 'md'>('md');

  protected readonly badgeConfig = computed(() => {
    const s = this.status();
    switch (s) {
      case 'VALIDEE':
      case 'VALIDE':
        return { label: 'Validée', styleClass: 'badge-success', dot: true };
      case 'EN_COURS':
        return { label: 'En cours', styleClass: 'badge-warning', dot: true };
      case 'EN_ATTENTE':
        return { label: 'En attente', styleClass: 'badge-neutral', dot: false };
      case 'A_COMPLETER':
        return { label: 'À compléter', styleClass: 'badge-warning', dot: true };
      case 'REPORTEE':
      case 'ANNULE':
        return { label: 'Reportée', styleClass: 'badge-neutral', dot: false };
      case 'URGENT':
      case 'CRITIQUE':
        return { label: 'Urgent', styleClass: 'badge-danger', dot: true };
      case 'PAYE':
        return { label: 'À jour / Payé', styleClass: 'badge-success', dot: false };
      default:
        return { label: s, styleClass: 'badge-neutral', dot: false };
    }
  });
}
