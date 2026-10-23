import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapportsService } from '../../services/rapports.service';
import { SectionStat } from '../../models/rapports.model';
import { PdfService } from '../../../../core/services/pdf.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

@Component({
  selector: 'app-statistiques-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './statistiques-page.component.html',
  styleUrl: './statistiques-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatistiquesPageComponent {
  public readonly service = inject(RapportsService);
  private readonly pdfService = inject(PdfService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly annees = this.anneeService.annees;
  public readonly activeAnnee = this.anneeService.activeAnnee;

  // Filtres actifs
  public readonly filterAnnee = signal<string>('');
  public readonly filterSection = signal('tous');

  constructor() {
    effect(() => {
      const active = this.activeAnnee();
      if (active?.libelle && !this.filterAnnee()) {
        this.filterAnnee.set(active.libelle);
      }
    });
  }

  // Stats réactives
  public readonly stats = this.service.stats;

  // Données filtrées par section
  public readonly activeSectionStats = computed<SectionStat[]>(() => {
    const s = this.filterSection();
    const all = this.stats().repartitionSections;
    if (s === 'tous') return all;
    return all.filter(sec => sec.section === s);
  });

  public printDashboard(): void {
    this.pdfService.previewRapportAnnuelPdf({
      anneeLibelle: this.filterAnnee()
    });
  }
}
