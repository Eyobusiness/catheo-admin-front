import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImpressionsService } from '../../services/impressions.service';
import { SacramentType } from '../../models/impressions.model';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { CatechumeneService } from '../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { InscriptionAnnuelleService } from '../../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';
import { PdfService } from '../../../../core/services/pdf.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

@Component({
  selector: 'app-suivi-sacramentel-print',
  imports: [CommonModule, FormsModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './suivi-sacramentel.component.html',
  styleUrl: './suivi-sacramentel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuiviSacramentelPrintComponent implements OnInit {
  protected readonly service = inject(ImpressionsService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly pdfService = inject(PdfService);
  protected readonly anneeService = inject(AnneeCatecheseService);

  public readonly selectedSacrament = signal<SacramentType>('bapteme');
  // Filtres Dynamiques (Sélection obligatoire Section -> Niveau -> Classe)
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly orientation = signal<'portrait' | 'landscape'>('landscape');

  // Listes réactives
  public readonly sections = this.sectionService.sections;
  public readonly anneePastorale = computed(() => this.anneeService.activeAnnee()?.libelle || '');

  public readonly niveauxFiltres = computed(() => {
    const secId = this.selectedSectionId();
    if (!secId) return [];
    return this.niveauService.niveaux().filter(n => String(n.section_id) === String(secId) || String(n.section?.id) === String(secId));
  });

  public readonly classesFiltrees = computed(() => {
    const nivId = this.selectedNiveauId();
    if (!nivId) return [];
    return this.classeService.classes().filter(c => String(c.niveau_id) === String(nivId) || String(c.niveau?.id) === String(nivId));
  });

  public readonly selectedSectionNom = computed(() => {
    const secId = this.selectedSectionId();
    if (secId && secId !== 'tous') {
      const found = this.sectionService.sections().find(s => s.id === secId);
      if (found) return found.nom;
    }
    const clId = this.selectedClasseId();
    if (clId && clId !== 'tous') {
      const cl = this.classesFiltrees().find(c => c.id === clId) as any;
      if (cl?.niveau?.section?.nom) return cl.niveau.section.nom;
      if (cl?.section?.nom) return cl.section.nom;
      const nivId = cl?.niveau_id || cl?.niveau?.id;
      const niv = this.niveauService.niveaux().find(n => n.id === nivId);
      const sec = this.sectionService.sections().find(s => s.id === niv?.section_id || s.id === niv?.section?.id);
      if (sec) return sec.nom;
    }
    const nivId = this.selectedNiveauId();
    if (nivId && nivId !== 'tous') {
      const niv = this.niveauService.niveaux().find(n => n.id === nivId);
      const sec = this.sectionService.sections().find(s => s.id === niv?.section_id || s.id === niv?.section?.id);
      if (sec) return sec.nom;
    }
    return '';
  });

  public readonly selectedNiveauNom = computed(() => {
    const nivId = this.selectedNiveauId();
    if (nivId && nivId !== 'tous') {
      const found = this.niveauService.niveaux().find(n => n.id === nivId);
      if (found) return found.nom;
    }
    const clId = this.selectedClasseId();
    if (clId && clId !== 'tous') {
      const cl = this.classesFiltrees().find(c => c.id === clId) as any;
      if (cl?.niveau?.nom) return cl.niveau.nom;
      const niv = this.niveauService.niveaux().find(n => n.id === cl?.niveau_id);
      if (niv) return niv.nom;
    }
    return '';
  });

  public readonly selectedClasseNom = computed(() => {
    const clId = this.selectedClasseId();
    if (!clId || clId === 'tous') return '';
    const found = this.classesFiltrees().find(c => c.id === clId);
    return found ? found.nom : '';
  });

  public readonly displaySubTitle = computed(() => {
    const clNom = this.selectedClasseNom();
    const nivNom = this.selectedNiveauNom();
    const secNom = this.selectedSectionNom();

    if (clNom) {
      const parts: string[] = [];
      if (secNom) parts.push(`SECTION : ${secNom.toUpperCase()}`);
      if (nivNom) parts.push(`NIVEAU : ${nivNom.toUpperCase()}`);
      parts.push(`CLASSE : ${clNom.toUpperCase()}`);
      return parts.join('   •   ');
    }

    if (nivNom) {
      const parts: string[] = [];
      if (secNom) parts.push(`SECTION : ${secNom.toUpperCase()}`);
      parts.push(`NIVEAU : ${nivNom.toUpperCase()}`);
      parts.push('TOUTES LES CLASSES');
      return parts.join('   •   ');
    }

    if (secNom) {
      return `SECTION : ${secNom.toUpperCase()}   •   TOUTES LES CLASSES`;
    }

    return 'TOUTES LES CLASSES';
  });

  public readonly documentTitle = computed(() => {
    switch (this.selectedSacrament()) {
      case 'bapteme':
        return 'FICHE DE SUIVI DES CANDIDATS AU BAPTÊME';
      case 'communion':
        return 'FICHE DE SUIVI DES CANDIDATS À LA PREMIÈRE COMMUNION';
      case 'confirmation':
        return 'FICHE DE SUIVI DES CANDIDATS À LA CONFIRMATION';
      default:
        return 'FICHE DE SUIVI SACRAMENTEL';
    }
  });

  // Liste des candidats réels depuis la BD : Uniquement si une classe est sélectionnée
  public readonly studentsList = computed(() => {
    const clId = this.selectedClasseId();
    if (!clId) {
      return [];
    }

    const inscriptions = this.inscriptionService.inscriptions();
    const allCats = this.catechumeneService.catechumenes();

    const filteredInsc = inscriptions.filter(i => String(i.classe_id) === String(clId) || String(i.classe?.id) === String(clId));

    let matchedCats: {
      id: string;
      matricule: string;
      nomPrenoms: string;
      telephone: string;
    }[] = [];

    if (filteredInsc.length > 0) {
      matchedCats = filteredInsc.map((insc, index) => {
        const cat = insc.catechumene || allCats.find(c => String(c.id) === String(insc.catechumene_id));
        const nom = cat?.nom || (insc as any).nom || '';
        const prenoms = cat?.prenoms || (insc as any).prenoms || '';
        const nomComplet = cat?.nom_complet || `${nom} ${prenoms}`.trim() || `Catéchumène #${index + 1}`;
        const mat = cat?.matricule || cat?.code_catechumene || (insc as any).matricule || insc.code_inscription || 'CAT-00';
        const rawPhone = cat?.telephone || cat?.telephone_pere || cat?.telephone_mere || cat?.telephone_tuteur || cat?.telephone_parrain || '';
        const phoneFormatted = rawPhone ? rawPhone.trim().replace(/\s+/g, '\u00A0') : '-';

        return {
          id: String(insc.id || cat?.id || index),
          matricule: mat,
          nomPrenoms: nomComplet,
          telephone: phoneFormatted
        };
      });
    }

    if (matchedCats.length === 0 && allCats.length > 0) {
      const filteredCats = allCats.filter(c =>
        c.inscriptions_annuelles?.some((i: any) => String(i.classe_id) === String(clId) || String(i.classe?.id) === String(clId)) ||
        String((c as any).classe_id) === String(clId)
      );

      matchedCats = filteredCats.map((cat, index) => {
        const nom = cat?.nom || '';
        const prenoms = cat?.prenoms || '';
        const nomComplet = cat?.nom_complet || `${nom} ${prenoms}`.trim() || `Catéchumène #${index + 1}`;
        const mat = cat?.matricule || cat?.code_catechumene || 'CAT-00';
        const rawPhone = cat?.telephone || cat?.telephone_pere || cat?.telephone_mere || cat?.telephone_tuteur || cat?.telephone_parrain || '';
        const phoneFormatted = rawPhone ? rawPhone.trim().replace(/\s+/g, '\u00A0') : '-';

        return {
          id: String(cat.id || index),
          matricule: mat,
          nomPrenoms: nomComplet,
          telephone: phoneFormatted
        };
      });
    }

    // Tri alphabétique strict
    matchedCats.sort((a, b) => a.nomPrenoms.trim().localeCompare(b.nomPrenoms.trim(), 'fr', { sensitivity: 'base' }));

    return matchedCats.map((st, idx) => ({
      ...st,
      num: String(idx + 1).padStart(2, '0')
    }));
  });

  public readonly emptyPaddingRows = computed(() => {
    const currentCount = this.studentsList().length;
    if (currentCount === 0) return [];
    const minRows = 12;
    if (currentCount >= minRows) return [];
    const needed = minRows - currentCount;
    const rows = [];
    for (let i = 0; i < needed; i++) {
      rows.push({
        num: String(currentCount + i + 1).padStart(2, '0')
      });
    }
    return rows;
  });

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.inscriptionService.getAll().subscribe();
  }

  public onSectionChange(secId: string): void {
    this.selectedSectionId.set(secId);
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');
  }

  public onNiveauChange(nivId: string): void {
    this.selectedNiveauId.set(nivId);
    this.selectedClasseId.set('');
  }

  public onClasseChange(clId: string): void {
    this.selectedClasseId.set(clId);
  }

  public triggerPrint(): void {
    const filters: any = {
      orientation: this.orientation(),
      sacrement: this.selectedSacrament()
    };
    if (this.selectedSectionId() !== 'tous') filters.section_id = this.selectedSectionId();
    if (this.selectedNiveauId() !== 'tous') filters.niveau_id = this.selectedNiveauId();
    if (this.selectedClasseId() !== 'tous') filters.classe_id = this.selectedClasseId();

    this.pdfService.previewSuiviSacramentalPdf(filters, {
      title: this.documentTitle(),
      subtitle: this.displaySubTitle(),
      formatBadge: 'A4 Paysage',
      fileName: `suivi-sacramental-${this.selectedSacrament()}.pdf`,
      sectionNom: this.selectedSectionNom(),
      niveauNom: this.selectedNiveauNom(),
      classeNom: this.selectedClasseNom(),
      students: this.studentsList().map(s => ({
        id: s.id,
        num: s.num,
        numero: s.num,
        matricule: s.matricule,
        nom_complet: s.nomPrenoms,
        nomPrenoms: s.nomPrenoms,
        telephone: s.telephone,
        contact: s.telephone
      }))
    });
  }

  public toggleOrientation(mode: 'portrait' | 'landscape'): void {
    this.orientation.set(mode);
  }
}
