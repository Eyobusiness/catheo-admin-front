import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  templateUrl: './app-icon-button.component.html',
  styleUrl: './app-icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppIconButton {
  public readonly variant = input<'ghost' | 'primary' | 'secondary' | 'danger' | 'info' | 'success'>('ghost');
  public readonly size = input<'sm' | 'md' | 'lg'>('md');
  public readonly ariaLabel = input<string>('Bouton');
  public readonly title = input<string>('');
  public readonly disabled = input<boolean>(false);

  public readonly clicked = output<MouseEvent>();

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.disabled()) {
      this.clicked.emit(event);
    }
  }
}
