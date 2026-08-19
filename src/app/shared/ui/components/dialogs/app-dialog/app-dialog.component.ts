import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-dialog',
  templateUrl: './app-dialog.component.html',
  styleUrl: './app-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'onEscape()'
  }
})
export class AppDialog {
  public readonly isOpen = input<boolean>(false);
  public readonly title = input<string>('');
  public readonly subtitle = input<string>('');
  public readonly size = input<DialogSize>('md');
  public readonly showCloseButton = input<boolean>(true);
  public readonly closeOnBackdrop = input<boolean>(true);

  public readonly closed = output<void>();

  protected handleClose(): void {
    this.closed.emit();
  }

  protected handleBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.handleClose();
    }
  }

  protected onEscape(): void {
    if (this.isOpen()) {
      this.handleClose();
    }
  }
}
