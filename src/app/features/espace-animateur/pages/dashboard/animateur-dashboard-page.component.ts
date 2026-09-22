import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimateurAuthService } from '../../services/animateur-auth.service';
import { AnimateurClasseService } from '../../services/animateur-classe.service';

import { PwaInstallButtonComponent } from '../../../../core/components/pwa-install-button/pwa-install-button.component';

@Component({
  selector: 'app-animateur-dashboard-page',
  imports: [RouterLink, PwaInstallButtonComponent],
  templateUrl: './animateur-dashboard-page.component.html',
  styleUrl: './animateur-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurDashboardPageComponent implements OnInit {
  protected readonly authService = inject(AnimateurAuthService);
  protected readonly classeService = inject(AnimateurClasseService);

  protected readonly profile = this.authService.profile;
  protected readonly displayName = this.authService.displayName;

  protected readonly isLoading = this.classeService.isLoading;
  protected readonly hasNoAffectation = this.classeService.hasNoAffectation;
  protected readonly errorMessage = this.classeService.errorMessage;

  protected readonly classe = this.classeService.classe;
  protected readonly niveau = this.classeService.niveau;
  protected readonly section = this.classeService.section;
  protected readonly anneePastorale = this.classeService.anneePastorale;
  protected readonly effectif = this.classeService.effectif;
  protected readonly classeNomComplet = this.classeService.classeNomComplet;

  public ngOnInit(): void {
    this.authService.getMe().subscribe();
    this.classeService.getMaClasse().subscribe();
  }

  protected reload(): void {
    this.classeService.getMaClasse().subscribe();
  }
}
