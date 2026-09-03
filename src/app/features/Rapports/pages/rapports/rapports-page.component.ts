import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BilanAnnuelService } from '../../services/bilan-annuel.service';
import { AnneeCatecheseService } from '../../../Organisations/AnneesPastorales/services/annee-catechese.service';
import { AppCard } from '../../../../shared/ui/components/layout/app-card/app-card.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';
import { PdfService } from '../../../../core/services/pdf.service';

@Component({
  selector: 'app-rapports-page',
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
    AppCard,
    AppButton
  ],
  templateUrl: './rapports-page.component.html',
  styleUrl: './rapports-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RapportsPageComponent implements OnInit {
  protected readonly bilanService = inject(BilanAnnuelService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  private readonly pdfService = inject(PdfService);

  public readonly bilanData = this.bilanService.bilanData;
  public readonly isLoading = this.bilanService.isLoading;
  public readonly anneesList = this.anneeService.annees;

  public readonly selectedAnneeId = signal<string>('');

  // Active year label helper
  public readonly activeAnneeLibelle = computed(() => {
    return this.bilanData()?.annee?.libelle || 'Année Pastorale en cours';
  });

  public ngOnInit(): void {
    // 1. Charger la liste des années pastorales disponibles
    this.anneeService.getAll().subscribe();

    // 2. Charger le bilan annuel actif
    this.bilanService.getBilanAnnuel().subscribe();
  }

  public onAnneeChange(anneeId: string): void {
    this.selectedAnneeId.set(anneeId);
    this.bilanService.getBilanAnnuel(anneeId || undefined).subscribe();
  }

  public refreshBilan(): void {
    this.bilanService.getBilanAnnuel(this.selectedAnneeId() || undefined).subscribe();
  }

  public printReport(): void {
    const b = this.bilanData();
    this.pdfService.previewRapportAnnuelPdf({
      annee_catechese_id: this.selectedAnneeId() || b?.annee?.id,
      anneeLibelle: b?.annee?.libelle || this.activeAnneeLibelle()
    });
  }
}
