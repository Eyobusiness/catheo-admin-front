import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BilanAnnuelService } from '../../services/bilan-annuel.service';
import { AnneeCatecheseService } from '../../../Organisations/AnneesPastorales/services/annee-catechese.service';
import { DashboardService } from '../../../Dashboard/services/dashboard.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
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
  protected readonly dashboardService = inject(DashboardService);
  protected readonly classeService = inject(ClasseService);
  private readonly pdfService = inject(PdfService);

  public readonly bilanData = this.bilanService.bilanData;
  public readonly isLoading = this.bilanService.isLoading;
  public readonly anneesList = this.anneeService.annees;

  public readonly selectedAnneeId = signal<string>('');
  public readonly showAllClasses = signal<boolean>(false);

  // Active year label helper
  public readonly activeAnneeLibelle = computed(() => {
    return this.bilanData()?.annee?.libelle || this.dashboardService.dashboardData()?.annee_active?.libelle || 'Année Pastorale en cours';
  });

  // EXACTEMENT comme dans Dashboard (AdminDashboardViewComponent):
  public readonly allClasses = computed(() => {
    // 1. Source Dashboard (qui affiche déjà les 14 classes avec succès)
    const dashClasses = this.dashboardService.dashboardData()?.effectifs?.par_classe;
    if (dashClasses && dashClasses.length > 0) {
      return dashClasses;
    }
    // 2. Source BilanAnnuel
    const bClasses = this.bilanData()?.effectifs?.par_classe;
    if (bClasses && bClasses.length > 0) {
      return bClasses;
    }
    // 3. Source directe ClasseService
    const clList = this.classeService.classes();
    if (clList && clList.length > 0) {
      return clList.map(c => ({
        classe_id: String(c.id),
        classe_nom: c.nom,
        niveau_nom: c.niveau_nom || c.niveau?.nom || '',
        section_nom: (c.niveau as any)?.section?.nom || '',
        effectif: c.effectif_actuel ?? 0,
        capacite_max: c.capacite_max || 30,
        pourcentage: Math.min(100, Math.round(((c.effectif_actuel ?? 0) / (c.capacite_max || 30)) * 100))
      }));
    }
    return [];
  });

  public readonly totalClassesCount = computed(() => {
    return this.allClasses().length ||
           this.dashboardService.dashboardData()?.summary?.classes ||
           this.bilanData()?.synthese?.classes || 0;
  });

  public readonly displayedClasses = computed(() => {
    const list = this.allClasses();
    if (this.showAllClasses() || list.length <= 5) {
      return list;
    }
    return list.slice(0, 5);
  });

  public toggleShowAllClasses(): void {
    this.showAllClasses.update(val => !val);
  }

  public getClassOccupancy(effectif: number, capaciteMax?: number): number {
    if (!capaciteMax || capaciteMax <= 0) {
      return effectif > 0 ? 100 : 0;
    }
    return Math.min(100, Math.round((effectif / capaciteMax) * 100));
  }

  public ngOnInit(): void {
    // 1. Charger la liste des années pastorales disponibles
    this.anneeService.getAll().subscribe();

    // 2. Charger les données du Dashboard (exactement comme le fait le tableau de bord)
    this.dashboardService.getSummary().subscribe();
    this.classeService.getAll().subscribe();

    // 3. Charger le bilan annuel
    this.bilanService.getBilanAnnuel().subscribe();
  }

  public onAnneeChange(anneeId: string): void {
    this.selectedAnneeId.set(anneeId);
    this.dashboardService.getSummary(anneeId || undefined).subscribe();
    this.classeService.getAll(anneeId ? { annee_catechese_id: String(anneeId) } : undefined).subscribe();
    this.bilanService.getBilanAnnuel(anneeId || undefined).subscribe();
  }

  public refreshBilan(): void {
    const annee = this.selectedAnneeId() || undefined;
    this.dashboardService.getSummary(annee).subscribe();
    this.classeService.getAll(annee ? { annee_catechese_id: String(annee) } : undefined).subscribe();
    this.bilanService.getBilanAnnuel(annee).subscribe();
  }

  public printReport(): void {
    const b = this.bilanData();
    this.pdfService.previewRapportAnnuelPdf({
      annee_catechese_id: this.selectedAnneeId() || b?.annee?.id,
      anneeLibelle: b?.annee?.libelle || this.activeAnneeLibelle(),
      bilanData: b
    });
  }
}
