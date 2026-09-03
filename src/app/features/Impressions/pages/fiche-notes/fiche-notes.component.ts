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

  // Filtres Dynamiques
  public readonly selectedSectionId = signal<string>('tous');
  public readonly selectedNiveauId = signal<string>('tous');
  public readonly selectedClasseId = signal<string>('tous');
  public readonly orientation = signal<'portrait' | 'landscape'>('portrait');

  // Listes réactives issues du backend
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
      list = list.filter(c => String(c.niveau_id) === String(nivId) || String(c.niveau?.id) === String(nivId));
    } else if (secId && secId !== 'tous') {
      const validNiveauIds = new Set(
        this.niveauService.niveaux()
          .filter(n => String(n.section_id) === String(secId) || String(n.section?.id) === String(secId))
          .map(n => String(n.id))
      );
      list = list.filter(c => {
        const idToCheck = c.niveau_id || c.niveau?.id;
        return idToCheck ? validNiveauIds.has(String(idToCheck)) : false;
      });
    }
    return list;
  });

  // Noms dynamiques des filtres sélectionnés
  public readonly selectedSectionNom = computed(() => {
    const secId = this.selectedSectionId();
    if (!secId || secId === 'tous') return 'Toutes les sections';
    return this.sectionService.sections().find(s => String(s.id) === String(secId))?.nom || 'Section';
  });

  public readonly selectedNiveauNom = computed(() => {
    const nivId = this.selectedNiveauId();
    if (!nivId || nivId === 'tous') return 'Tous les niveaux';
    return this.niveauService.niveaux().find(n => String(n.id) === String(nivId))?.nom || 'Niveau';
  });

  public readonly selectedClasseNom = computed(() => {
    const clId = this.selectedClasseId();
    if (!clId || clId === 'tous') return 'Toutes les classes';
    return this.classeService.classes().find(c => String(c.id) === String(clId))?.nom || 'Classe';
  });

  public readonly displayClasseTitle = computed(() => {
    const cl = this.selectedClasseNom();
    if (cl !== 'Toutes les classes') return `Classe : ${cl}`;
    const niv = this.selectedNiveauNom();
    if (niv !== 'Tous les niveaux') return `Niveau : ${niv}`;
    const sec = this.selectedSectionNom();
    if (sec !== 'Toutes les sections') return `Section : ${sec}`;
    return 'Toutes les classes';
  });

  // Liste des élèves filtrés depuis la BD
  public readonly studentsList = computed(() => {
    const inscriptions = this.inscriptionService.inscriptions();
    const allCats = this.catechumeneService.catechumenes();
    const clId = this.selectedClasseId();
    const nivId = this.selectedNiveauId();
    const secId = this.selectedSectionId();

    let matchedCats: {
      id: string;
      matricule: string;
      nomPrenoms: string;
      sexe: string;
      telephone: string;
    }[] = [];

    if (inscriptions && inscriptions.length > 0) {
      let filteredInsc = inscriptions;
      if (clId && clId !== 'tous') {
        filteredInsc = filteredInsc.filter(i => String(i.classe_id) === String(clId) || String(i.classe?.id) === String(clId));
      } else if (nivId && nivId !== 'tous') {
        filteredInsc = filteredInsc.filter(i => String(i.niveau_id) === String(nivId) || String(i.niveau?.id) === String(nivId));
      } else if (secId && secId !== 'tous') {
        filteredInsc = filteredInsc.filter(i => String(i.section_id) === String(secId) || String(i.section?.id) === String(secId));
      }

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
      let filteredCats = allCats;
      if (clId && clId !== 'tous') {
        filteredCats = allCats.filter(c =>
          c.inscriptions_annuelles?.some((i: any) => String(i.classe_id) === String(clId) || String(i.classe?.id) === String(clId)) ||
          String((c as any).classe_id) === String(clId)
        );
      } else if (nivId && nivId !== 'tous') {
        filteredCats = allCats.filter(c =>
          c.inscriptions_annuelles?.some((i: any) => String(i.niveau_id) === String(nivId) || String(i.niveau?.id) === String(nivId)) ||
          String((c as any).niveau_id) === String(nivId)
        );
      } else if (secId && secId !== 'tous') {
        filteredCats = allCats.filter(c =>
          c.inscriptions_annuelles?.some((i: any) => String(i.section_id) === String(secId) || String(i.section?.id) === String(secId)) ||
          String((c as any).section_id) === String(secId)
        );
      }

      matchedCats = filteredCats.map((c, index) => {
        const nom = c.nom || '';
        const prenoms = c.prenoms || '';
        const nomComplet = c.nom_complet || `${nom} ${prenoms}`.trim() || `Catéchumène #${index + 1}`;
        const mat = c.matricule || c.code_catechumene || 'CAT-00';
        const rawPhone = c.telephone || c.telephone_pere || c.telephone_mere || c.telephone_tuteur || c.telephone_parrain || '';
        const phoneFormatted = rawPhone ? rawPhone.trim().replace(/\s+/g, '\u00A0') : '-';

        return {
          id: String(c.id || index),
          matricule: mat,
          nomPrenoms: nomComplet,
          sexe: c.sexe || '-',
          telephone: phoneFormatted
        };
      });
    }

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
    this.selectedNiveauId.set('tous');
    this.selectedClasseId.set('tous');
  }

  public onNiveauChange(nivId: string): void {
    this.selectedNiveauId.set(nivId);
    this.selectedClasseId.set('tous');
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
        numero: s.num,
        matricule: s.matricule,
        nom_complet: s.nomPrenoms,
        sexe: s.sexe,
        telephone: s.telephone,
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
