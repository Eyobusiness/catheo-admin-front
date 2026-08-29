import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

@Component({
  selector: 'app-footer-paroisse-print',
  imports: [CommonModule],
  templateUrl: './footer-paroisse-print.component.html',
  styleUrl: './footer-paroisse-print.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterParoissePrintComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly anneePastorale = input<string>('');

  public readonly anneeDisplay = computed(() => {
    if (this.anneePastorale()) return this.anneePastorale();
    return this.anneeService.activeAnnee()?.libelle || '';
  });
}
