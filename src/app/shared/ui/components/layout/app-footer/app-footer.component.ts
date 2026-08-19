import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './app-footer.component.html',
  styleUrl: './app-footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFooter {
  protected readonly currentYear = signal<number>(new Date().getFullYear());
}
