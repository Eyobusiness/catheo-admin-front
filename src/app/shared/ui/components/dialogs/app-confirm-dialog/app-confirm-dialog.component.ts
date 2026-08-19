import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

export type ConfirmVariant = 'danger' | 'primary' | 'success' | 'warning';
export type ConfirmIconType = 'danger' | 'warning' | 'info' | 'success';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './app-confirm-dialog.component.html',
  styleUrl: './app-confirm-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppConfirmDialog {
  public readonly isOpen = input<boolean>(false);
  public readonly title = input<string>('Confirmation requise');
  public readonly message = input<string>('Êtes-vous sûr de vouloir effectuer cette action ?');
  public readonly confirmText = input<string>('Confirmer');
  public readonly cancelText = input<string>('Annuler');
  public readonly confirmVariant = input<ConfirmVariant>('danger');
  public readonly icon = input<string>('bi-trash3-fill');
  public readonly iconType = input<ConfirmIconType>('danger');
  public readonly isLoading = input<boolean>(false);
  public readonly warningText = input<string>('');

  public readonly confirmed = output<void>();
  public readonly cancelled = output<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isOpen() && !this.isLoading()) {
      this.onCancel();
    }
  }

  protected getFormattedIcon(): string {
    const ic = this.icon();
    if (!ic) return 'bi bi-trash3-fill';
    if (ic.startsWith('bi ')) return ic;
    if (ic.startsWith('bi-')) return `bi ${ic}`;
    return `bi bi-${ic}`;
  }

  protected onConfirm(): void {
    if (!this.isLoading()) {
      this.confirmed.emit();
    }
  }

  protected onCancel(): void {
    if (!this.isLoading()) {
      this.cancelled.emit();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-modal-backdrop')) {
      this.onCancel();
    }
  }
}
