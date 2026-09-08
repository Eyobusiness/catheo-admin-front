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
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

@Component({
  selector: 'app-fiche-bapteme-renseignement-print',
  imports: [CommonModule, FormsModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './fiche-bapteme-renseignement.component.html',
  styleUrl: './fiche-bapteme-renseignement.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FicheBaptemeRenseignementPrintComponent implements OnInit {
  protected readonly service = inject(ImpressionsService);
  protected readonly sectionService = inject(SectionService);
  protected readonly niveauService = inject(NiveauService);
  protected readonly classeService = inject(ClasseService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly pdfService = inject(PdfService);

  public readonly anneePastorale = computed(() => {
    return this.anneeService.activeAnnee()?.libelle || '2026-2027';
  });

  public readonly modeImpression = signal<'classe' | 'prerempli' | 'vierge'>('prerempli');

  // Filtres Dynamiques (Sélection obligatoire Section -> Niveau -> Classe)
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly selectedCatechumeneId = signal<string>('');

  // Listes réactives
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

  public readonly displayClasseTitle = computed(() => {
    const clId = this.selectedClasseId();
    if (clId) {
      const found = this.classeService.classes().find(c => String(c.id) === String(clId));
      if (found) return found.nom;
    }
    const nivId = this.selectedNiveauId();
    if (nivId) {
      const found = this.niveauService.niveaux().find(n => String(n.id) === String(nivId));
      if (found) return `Niveau : ${found.nom}`;
    }
    return 'Catéchuménat';
  });

  private isBaptise(c: any): boolean {
    if (!c) return false;
    if (c.est_baptise === true || c.est_baptise === 1 || c.est_baptise === '1' || c.est_baptise === 'true' || c.isBaptise === true) {
      return true;
    }
    if (c.date_bapteme && String(c.date_bapteme).trim() !== '') {
      return true;
    }
    return false;
  }

  private is3emeAnnee(niveau?: any): boolean {
    if (!niveau) return false;
    if (typeof niveau === 'string') {
      const s = niveau.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return s.includes('3') || s.includes('trois');
    }
    if (niveau.ordre === 3 || niveau.ordre_affichage === 3) return true;
    const s = (niveau.nom || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.includes('3') || s.includes('trois');
  }

  public readonly filteredCatechumenes = computed(() => {
    const clId = this.selectedClasseId();
    if (!clId) {
      return [];
    }

    // Récupération de la classe et du niveau
    const cl = this.classeService.classes().find(c => String(c.id) === String(clId));
    const niv = this.niveauService.niveaux().find(n => String(n.id) === String(this.selectedNiveauId()))
      || cl?.niveau
      || this.niveauService.niveaux().find(n => String(n.id) === String(cl?.niveau_id));

    // Condition 1 : Pour afficher dans baptême, il faut être obligatoirement en 3ème Année
    if (!this.is3emeAnnee(niv)) {
      return [];
    }

    const inscriptions = this.inscriptionService.inscriptions();
    const allCats = this.catechumeneService.catechumenes();

    const filtered = inscriptions.filter(i => String(i.classe_id) === String(clId) || String(i.classe?.id) === String(clId));
    let matched = filtered
      .map(i => i.catechumene || allCats.find(c => String(c.id) === String(i.catechumene_id)))
      .filter((c): c is any => !!c);

    if (matched.length === 0 && allCats.length > 0) {
      matched = allCats.filter(c =>
        c.inscriptions_annuelles?.some((i: any) => String(i.classe_id) === String(clId) || String(i.classe?.id) === String(clId)) ||
        String((c as any).classe_id) === String(clId)
      );
    }

    // Condition 1 (suite) : Ne pas avoir coché que tu es baptisé (tu ne dois pas être baptisé)
    matched = matched.filter(c => !this.isBaptise(c));

    return [...matched].sort((a, b) => {
      const nomA = (a.nom_complet || `${a.nom || ''} ${a.prenoms || ''}`).trim();
      const nomB = (b.nom_complet || `${b.nom || ''} ${b.prenoms || ''}`).trim();
      return nomA.localeCompare(nomB, 'fr', { sensitivity: 'base' });
    });
  });

  public readonly currentCatechumene = computed(() => {
    if (this.modeImpression() === 'vierge') return null;
    const list = this.filteredCatechumenes();
    if (list.length === 0) return null;
    const id = this.selectedCatechumeneId();
    if (id) {
      const found = list.find(c => String(c.id) === String(id));
      if (found) return found;
    }
    return list[0] || null;
  });

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.inscriptionService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
  }

  public onSectionChange(secId: string): void {
    this.selectedSectionId.set(secId);
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');
    this.selectedCatechumeneId.set('');
  }

  public onNiveauChange(nivId: string): void {
    this.selectedNiveauId.set(nivId);
    this.selectedClasseId.set('');
    this.selectedCatechumeneId.set('');
  }

  public onClasseChange(clId: string): void {
    this.selectedClasseId.set(clId);
    this.selectedCatechumeneId.set('');
  }

  public setMode(mode: 'classe' | 'prerempli' | 'vierge'): void {
    this.modeImpression.set(mode);
  }

  public getNomPrenoms(c: any): string {
    if (!c) return '';
    return (c.nom_complet || `${c.nom || ''} ${c.prenoms || ''}`).trim();
  }

  public getDateNaissance(c: any): string {
    if (!c) return '';
    const d = c.date_naissance || c.dateNaissance;
    if (!d) return '';
    try {
      const parts = String(d).split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return String(d);
  }

  public getLieuNaissance(c: any): string {
    if (!c) return '';
    return c.lieu_naissance || c.lieuNaissance || '';
  }

  public getProfession(c: any): string {
    if (!c) return '';
    return c.profession || c.classe_scolaire || '';
  }

  public getContact(c: any): string {
    if (!c) return '';
    return c.telephone || c.contact || c.telephone_pere || c.telephone_mere || '';
  }

  public getDomicile(c: any): string {
    if (!c) return '';
    return c.domicile || c.adresse || '';
  }

  public getNomPere(c: any): string {
    if (!c) return '';
    return c.nom_pere || c.nomPere || '';
  }

  public getOriginePere(c: any): string {
    if (!c) return '';
    return c.origine_pere || c.originePere || '';
  }

  public getNomMere(c: any): string {
    if (!c) return '';
    return c.nom_mere || c.nomMere || '';
  }

  public getOrigineMere(c: any): string {
    if (!c) return '';
    return c.origine_mere || c.origineMere || '';
  }

  public getParrain(c: any): any {
    if (!c) return null;
    if (c.parrain) return c.parrain;
    if (c.parrainDetail) return c.parrainDetail;
    if (Array.isArray(c.parrains_marraines)) {
      const p = c.parrains_marraines.find((item: any) => item.type === 'parrain' || item.sexe === 'M');
      if (p) return p;
    }
    if (c.nom_parrain) {
      return {
        nom: c.nom_parrain,
        nom_prenoms: c.nom_parrain,
        telephone: c.telephone_parrain,
        domicile: c.domicile_parrain || '',
        representant_par: c.representant_parrain || '',
        representant_contact: c.contact_representant_parrain || ''
      };
    }
    return null;
  }

  public getMarraine(c: any): any {
    if (!c) return null;
    if (c.marraine) return c.marraine;
    if (c.marraineDetail) return c.marraineDetail;
    if (Array.isArray(c.parrains_marraines)) {
      const m = c.parrains_marraines.find((item: any) => item.type === 'marraine' || item.sexe === 'F');
      if (m) return m;
    }
    if (c.nom_marraine) {
      return {
        nom: c.nom_marraine,
        nom_prenoms: c.nom_marraine,
        telephone: c.telephone_marraine,
        domicile: c.domicile_marraine || '',
        representant_par: c.representant_marraine || '',
        representant_contact: c.contact_representant_marraine || ''
      };
    }
    return null;
  }

  public getPhotoUrl(c: any): string | null {
    if (!c) return null;
    return c.photo_url || c.photo_path || c.photo || null;
  }

  public windowPrint(): void {
    window.print();
  }

  public triggerPrint(): void {
    const cat = this.currentCatechumene();
    const params: any = {};
    if (this.modeImpression() === 'prerempli' && cat) {
      params.catechumene_id = cat.id;
    } else if (this.modeImpression() === 'classe' && this.selectedClasseId() !== 'tous') {
      params.classe_id = this.selectedClasseId();
    }

    const subtitle = cat ? this.getNomPrenoms(cat) : undefined;

    this.pdfService.previewFicheRenseignementBaptemePdf(params, {
      title: 'Fiche de Renseignements — Baptême',
      subtitle,
      formatBadge: 'A4 Portrait',
      fileName: 'fiche-bapteme-renseignements.pdf',
      students: cat ? [{
        ...cat,
        id: cat.id,
        matricule: cat.matricule || cat.code_catechumene,
        nom: cat.nom,
        prenoms: cat.prenoms,
        nom_complet: this.getNomPrenoms(cat),
        date_naissance: this.getDateNaissance(cat),
        lieu_naissance: this.getLieuNaissance(cat),
        profession: this.getProfession(cat),
        telephone: this.getContact(cat),
        domicile: this.getDomicile(cat),
        nom_pere: this.getNomPere(cat),
        origine_pere: this.getOriginePere(cat),
        nom_mere: this.getNomMere(cat),
        origine_mere: this.getOrigineMere(cat),
        parrain: this.getParrain(cat),
        marraine: this.getMarraine(cat),
        photo_url: this.getPhotoUrl(cat)
      }] : []
    });
  }
}
