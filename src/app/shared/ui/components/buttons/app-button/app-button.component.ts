import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  templateUrl: './app-button.component.html',
  styleUrl: './app-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppButton {
  public readonly variant = input<ButtonVariant>('primary');
  public readonly size = input<ButtonSize>('md');
  public readonly type = input<'button' | 'submit' | 'reset'>('button');
  public readonly disabled = input<boolean>(false);
  public readonly loading = input<boolean>(false);
  public readonly icon = input<string>('');
  public readonly iconPosition = input<'left' | 'right'>('left');
  public readonly fullWidth = input<boolean>(false);

  public readonly clicked = output<MouseEvent>();

  protected handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}
