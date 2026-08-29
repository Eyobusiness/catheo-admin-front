import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapportsService } from '../../services/rapports.service';
import { SectionStat } from '../../models/rapports.model';

@Component({
  selector: 'app-statistiques-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './statistiques-page.component.html',
  styleUrl: './statistiques-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatistiquesPageComponent {
  public readonly service = inject(RapportsService);

  // Filtres actifs
  public readonly filterAnnee = signal('2025-2026');
  public readonly filterSection = signal('tous');

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
    window.print();
  }
}
