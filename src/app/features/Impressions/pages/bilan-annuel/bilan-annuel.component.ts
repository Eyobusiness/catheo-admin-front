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
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { SeanceService } from '../../../Presences/services/seance.service';
import { BilanAnnuelService } from '../../../Evaluations/bilan-annuel/services/bilan-annuel.service';
import { EvaluationService } from '../../../Evaluations/evaluation/services/evaluation.service';
import { ClasseMoyennesResponse } from '../../../Evaluations/evaluation/models/evaluation.model';

@Component({
  selector: 'app-bilan-annuel-print',
  imports: [CommonModule, FormsModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './bilan-annuel.component.html',
  styleUrl: './bilan-annuel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BilanAnnuelPrintComponent implements OnInit {
  protected readonly service = inject(ImpressionsService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly pdfService = inject(PdfService);
  protected readonly seanceService = inject(SeanceService);
  protected readonly affectationService = inject(AffectationAnimateurService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly bilanService = inject(BilanAnnuelService);
  protected readonly evalService = inject(EvaluationService);

  // Filtres Dynamiques (Sélection obligatoire Section -> Niveau -> Classe)
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly orientation = signal<'portrait' | 'landscape'>('landscape');
  public readonly classAverages = signal<any>(null);

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
    const anim = this.animateursClasse();

    if (clNom) {
      const parts: string[] = [];
      if (secNom) parts.push(`SECTION : ${secNom.toUpperCase()}`);
      if (nivNom) parts.push(`NIVEAU : ${nivNom.toUpperCase()}`);
      parts.push(`CLASSE : ${clNom.toUpperCase()}`);
      if (anim) parts.push(`ANIMATEUR(S) : ${anim.toUpperCase()}`);
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

  // Liste des élèves réels issus de la base de données : Uniquement si classe sélectionnée
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

    // Tri alphabétique strict pour le bilan
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
    this.affectationService.getAll().subscribe();
    this.seanceService.getAll().subscribe();
  }

  public onSectionChange(secId: string): void {
    this.selectedSectionId.set(secId);
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');
    this.classAverages.set(null);
  }

  public onNiveauChange(nivId: string): void {
    this.selectedNiveauId.set(nivId);
    this.selectedClasseId.set('');
    this.classAverages.set(null);
  }

  public onClasseChange(clId: string): void {
    this.selectedClasseId.set(clId);
    if (clId) {
      this.seanceService.getAll(clId).subscribe();
      this.evalService.getClassAverages(clId, this.anneeService.activeAnnee()?.id).subscribe({
        next: (res: ClasseMoyennesResponse) => this.classAverages.set(res),
        error: () => this.classAverages.set(null)
      });
    } else {
      this.classAverages.set(null);
    }
  }

  public triggerPrint(): void {
    const filters: any = {
      orientation: this.orientation()
    };
    if (this.selectedSectionId() !== 'tous') filters.section_id = this.selectedSectionId();
    if (this.selectedNiveauId() !== 'tous') filters.niveau_id = this.selectedNiveauId();
    if (this.selectedClasseId() !== 'tous') filters.classe_id = this.selectedClasseId();

    const clId = this.selectedClasseId();
    const allSeances = this.seanceService.seances();
    const savedBilan = (clId && clId !== 'tous') ? this.bilanService.getBilanData(this.anneePastorale(), clId) : null;
    const averages = this.classAverages();

    this.pdfService.previewBilanAnnuelPdf(filters, {
      title: "Bilan Annuel de Fin d'Année",
      subtitle: this.displaySubTitle(),
      formatBadge: 'A4 Paysage',
      fileName: 'bilan-annuel-catechese.pdf',
      sectionNom: this.selectedSectionNom(),
      niveauNom: this.selectedNiveauNom(),
      classeNom: this.selectedClasseNom(),
      animateursNom: this.animateursClasse(),
      students: this.studentsList().map(s => {
        const saved = savedBilan?.find(b =>
          (b.matricule && s.matricule && b.matricule.trim().toLowerCase() === s.matricule.trim().toLowerCase()) ||
          b.catechumeneId === s.id
        );

        const eleveAvg = averages?.eleves?.find((e: any) =>
          (s.matricule && e.matricule && String(e.matricule).toLowerCase().trim() === String(s.matricule).toLowerCase().trim()) ||
          String(e.catechumene_id) === String(s.id)
        );

        let presCours = '';
        if (saved?.presenceCoursNb !== undefined && saved?.presenceCoursNb !== null) {
          presCours = String(saved.presenceCoursNb);
        } else if (clId && clId !== 'tous') {
          const nb = allSeances.filter(seance =>
            (seance.classe_id === clId || seance.classe?.id === clId) &&
            seance.presences?.some(p =>
              (p.catechumene_id === s.id || (p.catechumene && p.catechumene.id === s.id)) &&
              (p.statut_presence === 'present' || p.statut_presence === 'retard' || p.est_present === true)
            )
          ).length;
          presCours = String(nb);
        }

        const presMesse = saved?.presenceMesse !== undefined && saved?.presenceMesse !== null ? saved.presenceMesse : 0;
        const presMouv = saved?.presenceMouvement !== undefined && saved?.presenceMouvement !== null ? saved.presenceMouvement : 0;
        const presCeb = saved?.presenceCEB !== undefined && saved?.presenceCEB !== null ? saved.presenceCEB : 0;

        const evalMoy = eleveAvg?.moyenne ?? eleveAvg?.moyenne_generale ?? eleveAvg?.moyenne_annuelle;
        const realMoyenne = saved?.moyenneGenerale !== undefined && saved?.moyenneGenerale !== null
          ? saved.moyenneGenerale
          : (evalMoy !== undefined && evalMoy !== null && evalMoy !== '' ? Number(evalMoy) : null);

        const moy = realMoyenne !== null ? `${realMoyenne} / 20` : '';

        let dec = saved?.decision || '';
        if (!dec && realMoyenne !== null) {
          if (realMoyenne >= 10) dec = 'Admis';
          else if (realMoyenne >= 8.5) dec = 'Ajourné';
          else dec = 'Non admis';
        }

        return {
          id: s.id,
          num: s.num,
          numero: s.num,
          matricule: s.matricule,
          nom_complet: s.nomPrenoms,
          nomPrenoms: s.nomPrenoms,
          telephone: s.telephone,
          contact: s.telephone,
          moyenne: moy,
          moyenne_generale: realMoyenne,
          moyenne_annuelle: realMoyenne,
          presences_cours: presCours,
          presences_messe: presMesse,
          presences_mouvement: presMouv,
          presences_ceb: presCeb,
          decision: dec
        };
      })
    });
  }

  public toggleOrientation(mode: 'portrait' | 'landscape'): void {
    this.orientation.set(mode);
  }
}
