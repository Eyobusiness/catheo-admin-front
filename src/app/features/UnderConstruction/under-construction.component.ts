import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { AppButton } from '../../shared/ui/components/buttons/app-button/app-button.component';
import { AppCard } from '../../shared/ui/components/layout/app-card/app-card.component';
import { AppDialog } from '../../shared/ui/components/dialogs/app-dialog/app-dialog.component';

@Component({
  selector: 'app-under-construction',
  imports: [
    RouterLink,
    AppButton,
    AppCard,
    AppDialog
  ],
  templateUrl: './under-construction.component.html',
  styleUrl: './under-construction.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnderConstructionComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);

  public readonly pageTitle = signal<string>('Tableau de Bord');
  public readonly isFeedbackModalOpen = signal<boolean>(false);

  constructor() {
    this.route.data.subscribe(data => {
      if (data['title']) {
        this.pageTitle.set(data['title']);
      }
    });
  }

  protected notifyTeam(): void {
    this.toastService.info('Notification enregistrée', 'Vous recevrez une alerte dès que ce module sera disponible.');
  }

  protected testToast(): void {
    this.toastService.success('Système Toast Actif', 'Les notifications Cathéo CIM fonctionnent parfaitement.');
  }

  protected openFeedbackModal(): void {
    this.isFeedbackModalOpen.set(true);
  }

  protected closeFeedbackModal(): void {
    this.isFeedbackModalOpen.set(false);
  }

  protected sendFeedback(): void {
    this.isFeedbackModalOpen.set(false);
    this.toastService.success('Suggestion enregistrée', 'Merci ! Votre suggestion pour ce module a été prise en compte.');
  }
}
