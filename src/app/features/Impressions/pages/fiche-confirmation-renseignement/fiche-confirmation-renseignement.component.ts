import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImpressionsService } from '../../services/impressions.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { CatechumeneService } from '../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { InscriptionAnnuelleService } from '../../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';
import { PdfService } from '../../../../core/services/pdf.service';

@Component({
  selector: 'app-fiche-confirmation-renseignement-print',
  imports: [CommonModule, FormsModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './fiche-confirmation-renseignement.component.html',
  styleUrl: './fiche-confirmation-renseignement.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FicheConfirmationRenseignementPrintComponent implements OnInit {
  protected readonly service = inject(ImpressionsService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly pdfService = inject(PdfService);

  public readonly modeImpression = signal<'classe' | 'prerempli' | 'vierge'>('prerempli');

  public readonly selectedSectionId = signal<string>('tous');
  public readonly selectedNiveauId = signal<string>('tous');
  public readonly selectedClasseId = signal<string>('tous');
  public readonly selectedCatechumeneId = signal<string>('');

  // Listes réactives
  public readonly sections = this.sectionService.sections;

  public readonly niveauxFiltres = computed(() => {
    const secId = this.selectedSectionId();
    const list = this.niveauService.niveaux();
    if (!secId || secId === 'tous') return list;
    return list.filter(n => n.section_id === secId || n.section?.id === secId);
  });

  public readonly classesFiltrees = computed(() => {
    const nivId = this.selectedNiveauId();
    const secId = this.selectedSectionId();
    let list = this.classeService.classes();

    if (nivId && nivId !== 'tous') {
      list = list.filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
    } else if (secId && secId !== 'tous') {
      const validNiveauIds = new Set(
        this.niveauService.niveaux()
          .filter(n => n.section_id === secId || n.section?.id === secId)
          .map(n => n.id)
      );
      list = list.filter(c => {
        const idToCheck = c.niveau_id || c.niveau?.id;
        return idToCheck ? validNiveauIds.has(idToCheck) : false;
      });
    }
    return list;
  });

  public readonly displayClasseTitle = computed(() => {
    const clId = this.selectedClasseId();
    if (clId && clId !== 'tous') {
      const found = this.classeService.classes().find(c => c.id === clId);
      if (found) return found.nom;
    }
    const nivId = this.selectedNiveauId();
    if (nivId && nivId !== 'tous') {
      const found = this.niveauService.niveaux().find(n => n.id === nivId);
      if (found) return `Niveau : ${found.nom}`;
    }
    return 'Confirmation';
  });

  public readonly filteredCatechumenes = computed(() => {
    const inscriptions = this.inscriptionService.inscriptions();
    const allCats = this.catechumeneService.catechumenes();
    const clId = this.selectedClasseId();
    const nivId = this.selectedNiveauId();
    const secId = this.selectedSectionId();

    if (clId && clId !== 'tous') {
      const filtered = inscriptions.filter(i => i.classe_id === clId || i.classe?.id === clId);
      return filtered
        .map(i => i.catechumene || allCats.find(c => c.id === i.catechumene_id))
        .filter((c): c is any => !!c);
    }

    if (nivId && nivId !== 'tous') {
      const filtered = inscriptions.filter(i => i.niveau_id === nivId || i.niveau?.id === nivId);
      return filtered
        .map(i => i.catechumene || allCats.find(c => c.id === i.catechumene_id))
        .filter((c): c is any => !!c);
    }

    if (secId && secId !== 'tous') {
      const filtered = inscriptions.filter(i => i.section_id === secId || i.section?.id === secId);
      return filtered
        .map(i => i.catechumene || allCats.find(c => c.id === i.catechumene_id))
        .filter((c): c is any => !!c);
    }

    if (inscriptions.length > 0) {
      const list = inscriptions
        .map(i => i.catechumene || allCats.find(c => c.id === i.catechumene_id))
        .filter((c): c is any => !!c);
      if (list.length > 0) return list;
    }

    return allCats;
  });

  public readonly currentCatechumene = computed(() => {
    if (this.modeImpression() === 'vierge') return null;
    const id = this.selectedCatechumeneId();
    const list = this.filteredCatechumenes();
    if (id) {
      const found = list.find(c => c.id === id);
      if (found) return found;
    }
    return list[0] || null;
  });

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.inscriptionService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe(cats => {
      if (cats.length > 0 && !this.selectedCatechumeneId()) {
        this.selectedCatechumeneId.set(cats[0].id);
      }
    });
  }

  public onSectionChange(secId: string): void {
    this.selectedSectionId.set(secId);
    this.selectedNiveauId.set('tous');
    this.selectedClasseId.set('tous');
  }

  public onNiveauChange(nivId: string): void {
    this.selectedNiveauId.set(nivId);
    this.selectedClasseId.set('tous');
  }

  public setMode(mode: 'classe' | 'prerempli' | 'vierge'): void {
    this.modeImpression.set(mode);
  }

  public triggerPrint(): void {
    const cat = this.currentCatechumene();
    const params: any = {};
    if (this.modeImpression() === 'prerempli' && cat) {
      params.catechumene_id = cat.id;
    } else if (this.modeImpression() === 'classe' && this.selectedClasseId() !== 'tous') {
      params.classe_id = this.selectedClasseId();
    }

    const subtitle = cat ? `${cat.nom} ${cat.prenoms || ''}`.trim() : undefined;

    this.pdfService.previewFicheRenseignementConfirmationPdf(params, {
      title: 'Fiche de Renseignements — Confirmation',
      subtitle,
      fileName: 'fiche-confirmation-renseignements.pdf'
    });
  }
}
