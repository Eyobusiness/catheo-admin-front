import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimateurClasseService } from '../../services/animateur-classe.service';

@Component({
  selector: 'app-animateur-ma-classe-page',
  imports: [RouterLink],
  templateUrl: './animateur-ma-classe-page.component.html',
  styleUrl: './animateur-ma-classe-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurMaClassePageComponent implements OnInit {
  protected readonly classeService = inject(AnimateurClasseService);

  protected readonly isLoading = this.classeService.isLoading;
  protected readonly hasNoAffectation = this.classeService.hasNoAffectation;
  protected readonly errorMessage = this.classeService.errorMessage;

  protected readonly classe = this.classeService.classe;
  protected readonly niveau = this.classeService.niveau;
  protected readonly section = this.classeService.section;
  protected readonly anneePastorale = this.classeService.anneePastorale;
  protected readonly affectation = this.classeService.affectation;
  protected readonly catechumenes = this.classeService.catechumenes;
  protected readonly effectif = this.classeService.effectif;

  public ngOnInit(): void {
    this.classeService.getMaClasse().subscribe();
  }

  protected reload(): void {
    this.classeService.getMaClasse().subscribe();
  }
}
