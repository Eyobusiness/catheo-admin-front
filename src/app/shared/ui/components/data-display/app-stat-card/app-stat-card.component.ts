import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatColor = 'primary' | 'success' | 'warning' | 'danger' | 'accent';

@Component({
  selector: 'app-stat-card',
  templateUrl: './app-stat-card.component.html',
  styleUrl: './app-stat-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppStatCard {
  public readonly title = input<string>('');
  public readonly value = input<string | number>('');
  public readonly change = input<string>('');
  public readonly isPositive = input<boolean>(true);
  public readonly period = input<string>('');
  public readonly icon = input<string>('activity');
  public readonly color = input<StatColor>('primary');
}
