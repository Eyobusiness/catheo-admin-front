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

  // Filtres Dynamiques
  public readonly selectedSectionId = signal<string>('tous');
  public readonly selectedNiveauId = signal<string>('tous');
  public readonly selectedClasseId = signal<string>('tous');
  public readonly orientation = signal<'portrait' | 'landscape'>('landscape');

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
    const secId = this.selectedSectionId();
    if (secId && secId !== 'tous') {
      const found = this.sectionService.sections().find(s => s.id === secId);
      if (found) return `Section : ${found.nom}`;
    }
    return 'Toutes les classes';
  });

  // Liste des élèves réels issus de la base de données
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
      telephone: string;
    }[] = [];

    if (inscriptions && inscriptions.length > 0) {
      let filteredInsc = inscriptions;
      if (clId && clId !== 'tous') {
        filteredInsc = filteredInsc.filter(i => i.classe_id === clId || i.classe?.id === clId);
      } else if (nivId && nivId !== 'tous') {
        filteredInsc = filteredInsc.filter(i => i.niveau_id === nivId || i.niveau?.id === nivId);
      } else if (secId && secId !== 'tous') {
        filteredInsc = filteredInsc.filter(i => i.section_id === secId || i.section?.id === secId);
      }

      matchedCats = filteredInsc.map((insc, index) => {
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
    } else if (clId === 'tous' && nivId === 'tous' && secId === 'tous' && allCats.length > 0) {
      matchedCats = allCats.map((c, index) => {
        const rawPhone = c.telephone || c.telephone_pere || c.telephone_mere || c.telephone_tuteur || c.telephone_parrain || '';
        const phoneFormatted = rawPhone ? rawPhone.trim().replace(/\s+/g, '\u00A0') : '-';

        return {
          id: c.id,
          matricule: c.matricule || c.code_catechumene || 'CAT-00',
          nomPrenoms: c.nom_complet || `${c.nom} ${c.prenoms || ''}`.trim(),
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
    window.print();
  }

  public toggleOrientation(mode: 'portrait' | 'landscape'): void {
    this.orientation.set(mode);
  }
}
