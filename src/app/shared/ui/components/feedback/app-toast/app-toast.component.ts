import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './app-toast.component.html',
  styleUrl: './app-toast.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppToast {
  protected readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;

  protected closeToast(id: string): void {
    this.toastService.remove(id);
  }
}
