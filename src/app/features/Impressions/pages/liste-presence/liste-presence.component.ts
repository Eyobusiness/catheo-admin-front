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
import { AffectationAnimateurService } from '../../../Organisations/affectation-animateurs/services/affectation-animateur.service';

@Component({
  selector: 'app-liste-presence-print',
  imports: [CommonModule, FormsModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './liste-presence.component.html',
  styleUrl: './liste-presence.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListePresencePrintComponent implements OnInit {
  protected readonly service = inject(ImpressionsService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly pdfService = inject(PdfService);
  protected readonly affectationService = inject(AffectationAnimateurService);

  // Filtres Dynamiques (Sélection obligatoire Section -> Niveau -> Classe)
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');

  // Paramètres d'émargement
  public readonly startDate = signal<string>('2025-10-04');
  public readonly jourCours = signal<string>('Samedi');
  public readonly nbSeances = signal<number>(12);
  public readonly orientation = signal<'portrait' | 'landscape'>('landscape');

  public readonly joursDisponibles = ['Samedi', 'Dimanche', 'Mercredi'];

  // Listes réactives
  public readonly sections = this.sectionService.sections;

  public readonly niveauxFiltres = computed(() => {
    const secId = this.selectedSectionId();
    if (!secId) return [];
    return this.niveauService.niveaux().filter(n => n.section_id === secId || n.section?.id === secId);
  });

  public readonly classesFiltrees = computed(() => {
    const nivId = this.selectedNiveauId();
    if (!nivId) return [];
    return this.classeService.classes().filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
  });

  public readonly displayClasseTitle = computed(() => {
    const clId = this.selectedClasseId();
    if (clId) {
      const found = this.classeService.classes().find(c => c.id === clId);
      if (found) return found.nom;
    }
    return '';
  });

  // Liste des élèves : uniquement chargée lorsqu'une classe précise est sélectionnée
  public readonly studentsList = computed(() => {
    const clId = this.selectedClasseId();
    if (!clId) {
      return [];
    }

    const inscriptions = this.inscriptionService.inscriptions();
    const allCats = this.catechumeneService.catechumenes();

    const filteredInsc = inscriptions.filter(i => i.classe_id === clId || i.classe?.id === clId);

    const matchedCats = filteredInsc.map((insc, index) => {
      const cat = insc.catechumene || allCats.find(c => c.id === insc.catechumene_id);
      const rawPhone = cat?.telephone || cat?.telephone_pere || cat?.telephone_mere || cat?.telephone_tuteur || cat?.telephone_parrain || '';
      const phoneFormatted = rawPhone ? rawPhone.trim().replace(/\s+/g, '\u00A0') : '-';

      return {
        id: insc.id || cat?.id || String(index),
        matricule: cat?.matricule || cat?.code_catechumene || insc.code_inscription || 'CAT-00',
        nomPrenoms: cat?.nom_complet || (cat ? `${cat.nom} ${cat.prenoms || ''}`.trim() : `Catéchumène #${index + 1}`),
        telephone: phoneFormatted
      };
    });

    // Tri alphabétique strict
    matchedCats.sort((a, b) => a.nomPrenoms.trim().localeCompare(b.nomPrenoms.trim(), 'fr', { sensitivity: 'base' }));

    return matchedCats.map((st, idx) => ({
      ...st,
      num: String(idx + 1).padStart(2, '0')
    }));
  });

  public readonly generatedDates = computed(() => {
    const dates: { fullDate: string; shortDate: string }[] = [];
    const count = this.nbSeances();
    const startStr = this.startDate();

    if (!startStr) return dates;

    const base = new Date(startStr);
    if (isNaN(base.getTime())) return dates;

    for (let i = 0; i < count; i++) {
      const current = new Date(base);
      current.setDate(base.getDate() + (i * 7));

      const day = String(current.getDate()).padStart(2, '0');
      const month = String(current.getMonth() + 1).padStart(2, '0');

      dates.push({
        fullDate: `${day}/${month}/${current.getFullYear()}`,
        shortDate: `${day}/${month}`
      });
    }

    return dates;
  });

  public readonly animateursClasse = computed(() => {
    const clId = this.selectedClasseId();
    if (!clId || clId === 'tous') return '';

    const cl = this.classesFiltrees().find(c => c.id === clId) as any;
    if (cl?.animateur) {
      const nom = `${cl.animateur.nom || ''} ${cl.animateur.prenoms || ''}`.trim();
      if (nom) return nom;
    }
    if (cl?.animateur_nom) {
      return cl.animateur_nom.trim();
    }
    if (Array.isArray(cl?.animateurs) && cl.animateurs.length > 0) {
      return cl.animateurs.map((a: any) => `${a.nom || ''} ${a.prenoms || ''}`.trim()).filter(Boolean).join(', ');
    }

    const matches = this.affectationService.affectations().filter(a => a.classe_id === clId || a.classe?.id === clId);
    if (matches.length > 0) {
      return matches.map(m => `${m.animateur?.nom || ''} ${m.animateur?.prenoms || ''}`.trim()).filter(Boolean).join(', ');
    }

    return '';
  });

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.inscriptionService.getAll().subscribe();
    this.affectationService.getAll().subscribe();
  }

  public onSectionChange(secId: string): void {
    this.selectedSectionId.set(secId);
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');

    const found = this.sectionService.sections().find(s => s.id === secId);
    if (found?.nom?.toLowerCase().includes('adulte')) {
      this.jourCours.set('Dimanche');
      this.startDate.set('2025-10-05');
    } else {
      this.jourCours.set('Samedi');
      this.startDate.set('2025-10-04');
    }
  }

  public onNiveauChange(nivId: string): void {
    this.selectedNiveauId.set(nivId);
    this.selectedClasseId.set('');
  }

  public onClasseChange(clId: string): void {
    this.selectedClasseId.set(clId);
  }

  public triggerPrint(): void {
    if (!this.selectedClasseId()) {
      return;
    }

    const filters: any = {
      orientation: this.orientation(),
      date_debut: this.startDate(),
      jour_cours: this.jourCours(),
      nb_seances: this.nbSeances(),
      section_id: this.selectedSectionId(),
      niveau_id: this.selectedNiveauId(),
      classe_id: this.selectedClasseId()
    };

    const subtitle = this.displayClasseTitle();

    this.pdfService.previewListePresencePdf(filters, {
      title: 'Liste de Présence & Émargement',
      subtitle,
      formatBadge: 'A4 Paysage',
      fileName: 'liste-presence.pdf',
      classeNom: this.displayClasseTitle(),
      jourCours: this.jourCours(),
      animateursNom: this.animateursClasse(),
      seancesDates: this.generatedDates(),
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
