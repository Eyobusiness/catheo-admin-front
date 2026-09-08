import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnteteCatecheseComponent } from '../../../../shared/ui/components/entete-catechese/entete-catechese.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';
import { VersementDto } from '../../../Finances/versements/models/versement.model';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

@Component({
  selector: 'app-doc-bordereau-versement',
  imports: [CommonModule, EnteteCatecheseComponent, FooterParoissePrintComponent],
  templateUrl: './bordereau-versement.component.html',
  styleUrl: './bordereau-versement.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BordereauVersementComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<VersementDto | null>(null);
  public readonly activeAnnee = this.anneeService.activeAnnee;

  public readonly anneeLibelle = computed(() => {
    const v = this.data();
    return v?.annee_libelle || this.activeAnnee()?.libelle || '';
  });

  public getModeLabel(mode?: string): string {
    switch (mode?.toLowerCase()) {
      case 'cheque':
        return 'Chèque Paroissial';
      case 'virement':
        return 'Virement Bancaire';
      case 'mobile_money':
        return 'Mobile Money';
      default:
        return 'Espèces';
    }
  }
}
