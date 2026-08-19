import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './app-card.component.html',
  styleUrl: './app-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCard {
  public readonly title = input<string>('');
  public readonly subtitle = input<string>('');
  public readonly padding = input<'none' | 'sm' | 'md' | 'lg'>('md');
  public readonly hoverEffect = input<boolean>(false);
  public readonly bordered = input<boolean>(true);
}
