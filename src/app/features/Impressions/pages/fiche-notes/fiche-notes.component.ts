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
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-fiche-notes-print',
  imports: [CommonModule, FormsModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './fiche-notes.component.html',
  styleUrl: './fiche-notes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FicheNotesPrintComponent implements OnInit {
  protected readonly service = inject(ImpressionsService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly pdfService = inject(PdfService);
  private readonly toastService = inject(ToastService);

  // Filtres Dynamiques (Sélection obligatoire Section -> Niveau -> Classe)
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly orientation = signal<'portrait' | 'landscape'>('portrait');

  // Listes réactives issues du backend
  public readonly sections = this.sectionService.sections;

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

  // Noms dynamiques des filtres sélectionnés
  public readonly selectedSectionNom = computed(() => {
    const secId = this.selectedSectionId();
    if (!secId) return '';
    return this.sectionService.sections().find(s => String(s.id) === String(secId))?.nom || '';
  });

  public readonly selectedNiveauNom = computed(() => {
    const nivId = this.selectedNiveauId();
    if (!nivId) return '';
    return this.niveauService.niveaux().find(n => String(n.id) === String(nivId))?.nom || '';
  });

  public readonly selectedClasseNom = computed(() => {
    const clId = this.selectedClasseId();
    if (!clId) return '';
    return this.classeService.classes().find(c => String(c.id) === String(clId))?.nom || '';
  });

  public readonly displayClasseTitle = computed(() => {
    const cl = this.selectedClasseNom();
    if (cl) return `Classe : ${cl}`;
    const niv = this.selectedNiveauNom();
    if (niv) return `Niveau : ${niv}`;
    const sec = this.selectedSectionNom();
    if (sec) return `Section : ${sec}`;
    return '';
  });

  // Liste des élèves filtrés depuis la BD : Uniquement si une classe est sélectionnée
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
      sexe: string;
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
          sexe: cat?.sexe || '-',
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
          sexe: cat?.sexe || '-',
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
      orientation: this.orientation()
    };
    if (this.selectedSectionId() !== 'tous') filters.section_id = this.selectedSectionId();
    if (this.selectedNiveauId() !== 'tous') filters.niveau_id = this.selectedNiveauId();
    if (this.selectedClasseId() !== 'tous') filters.classe_id = this.selectedClasseId();

    const secNom = this.selectedSectionNom();
    const nivNom = this.selectedNiveauNom();
    const clNom = this.selectedClasseNom();

    this.pdfService.previewFicheNotesPdf(filters, {
      title: 'Fiche de Notes & Évaluations',
      subtitle: clNom !== 'Toutes les classes' ? `Classe : ${clNom}` : undefined,
      fileName: clNom !== 'Toutes les classes' ? `fiche-notes-${clNom.toLowerCase().replace(/\s+/g, '-')}.pdf` : 'fiche-de-notes.pdf',
      sectionNom: secNom,
      niveauNom: nivNom,
      classeNom: clNom,
      students: this.studentsList().map(s => ({
        id: s.id,
        num: s.num,
        numero: s.num,
        matricule: s.matricule,
        nom_complet: s.nomPrenoms,
        nomPrenoms: s.nomPrenoms,
        sexe: s.sexe,
        telephone: s.telephone,
        contact: s.telephone,
        note_1: '',
        note_2: '',
        note_3: '',
        moyenne: '',
        decision: ''
      }))
    });
  }

  public toggleOrientation(mode: 'portrait' | 'landscape'): void {
    this.orientation.set(mode);
  }
}
