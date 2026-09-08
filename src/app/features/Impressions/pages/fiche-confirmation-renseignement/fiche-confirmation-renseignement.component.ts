import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImpressionsService } from '../../services/impressions.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { CatechumeneService } from '../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { InscriptionAnnuelleService } from '../../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
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
  protected readonly anneeService = inject(AnneeCatecheseService);
  protected readonly pdfService = inject(PdfService);

  public readonly modeImpression = signal<'classe' | 'prerempli' | 'vierge'>('prerempli');

  // Filtres Dynamiques (Sélection obligatoire Section -> Niveau -> Classe)
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly selectedCatechumeneId = signal<string>('');

  // Listes réactives
  public readonly sections = this.sectionService.sections;

  public readonly anneePastorale = computed(() => {
    return this.anneeService.activeAnnee()?.libelle || '2026-2027';
  });

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
    return 'Confirmation';
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

  private isSectionAdulte(section?: any): boolean {
    if (!section) return false;
    const code = (section.code || '').trim().toUpperCase();
    const nom = (section.nom || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return code === 'SEC-ADULTE' || code.includes('ADULTE') || nom.includes('adulte');
  }

  private is4emeAnnee(niveau?: any): boolean {
    if (!niveau) return false;
    if (typeof niveau === 'string') {
      const s = niveau.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return s.includes('4') || s.includes('quatr');
    }
    if (niveau.ordre === 4 || niveau.ordre_affichage === 4) return true;
    const s = (niveau.nom || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.includes('4') || s.includes('quatr');
  }

  private is5emeAnnee(niveau?: any): boolean {
    if (!niveau) return false;
    if (typeof niveau === 'string') {
      const s = niveau.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return s.includes('5') || s.includes('cinq');
    }
    if (niveau.ordre === 5 || niveau.ordre_affichage === 5) return true;
    const s = (niveau.nom || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.includes('5') || s.includes('cinq');
  }

  public readonly filteredCatechumenes = computed(() => {
    const clId = this.selectedClasseId();
    if (!clId) {
      return [];
    }

    // Récupération de la classe, du niveau et de la section
    const cl = this.classeService.classes().find(c => String(c.id) === String(clId));
    const niv = this.niveauService.niveaux().find(n => String(n.id) === String(this.selectedNiveauId()))
      || cl?.niveau
      || this.niveauService.niveaux().find(n => String(n.id) === String(cl?.niveau_id));

    const sec = this.sectionService.sections().find(s => String(s.id) === String(this.selectedSectionId()))
      || niv?.section
      || this.sectionService.sections().find(s => String(s.id) === String(niv?.section_id));

    // Condition 3 :
    // - si code section est SEC-ADULTE : 4ème ou 5ème Année et être baptisé
    // - sinon : obligatoirement 5ème Année et être baptisé
    const isAdulte = this.isSectionAdulte(sec);
    const isNiveauValide = isAdulte
      ? (this.is4emeAnnee(niv) || this.is5emeAnnee(niv))
      : this.is5emeAnnee(niv);

    if (!isNiveauValide) {
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

    // Condition 3 (suite) : Il faut obligatoirement être baptisé
    matched = matched.filter(c => this.isBaptise(c));

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

  public getNom(c: any): string {
    if (!c) return '';
    return c.nom || '';
  }

  public getPrenoms(c: any): string {
    if (!c) return '';
    return c.prenoms || '';
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

  public getTelephone(c: any): string {
    if (!c) return '';
    return c.telephone || c.telephone_candidat || c.contact || c.parent?.telephone || '';
  }

  public getDomicile(c: any): string {
    if (!c) return '';
    return c.domicile || c.adresse || '';
  }

  public getNumeroCarnetBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.num_carnet || c.num_carnet_bapteme || c.numero_acte_bapteme || c.registre_bapteme || '';
  }

  public getDateBapteme(c: any): string {
    if (!c) return '';
    const d = c.bapteme?.date || c.date_bapteme || c.dateBapteme;
    if (!d) return '';
    try {
      const parts = String(d).split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return String(d);
  }

  public getDioceseBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.diocese || c.diocese_bapteme || '';
  }

  public getVilleBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.ville || c.ville_bapteme || c.bapteme?.lieu || c.lieu_bapteme || '';
  }

  public getParoisseBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.paroisse || c.paroisse_bapteme || c.paroisseBapteme || '';
  }

  public getParrain(c: any): string {
    if (!c) return '';
    return c.bapteme?.parrain || c.nom_parrain || c.parrain_confirmation?.nom || c.parrainDetail?.nom || c.parrain?.nom_prenoms || c.parrain?.nom || (Array.isArray(c.parrains_marraines) && c.parrains_marraines[0]?.nom_prenoms) || '';
  }

  public getDatePremiereCommunion(c: any): string {
    if (!c) return '';
    const d = c.premiere_communion?.date || c.date_premiere_communion || c.datePremiereCommunion;
    if (!d) return '';
    try {
      const parts = String(d).split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return String(d);
  }

  public getParoissePremiereCommunion(c: any): string {
    if (!c) return '';
    return c.premiere_communion?.paroisse || c.paroisse_premiere_communion || '';
  }

  public getDateConfirmation(c: any): string {
    if (!c) return '';
    const d = c.confirmation?.date || c.date_confirmation || c.dateConfirmation;
    if (!d) return '';
    try {
      const parts = String(d).split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return String(d);
  }

  public getParoisseConfirmation(c: any): string {
    if (!c) return '';
    return c.confirmation?.paroisse || c.paroisse_confirmation || c.paroisseConfirmation || '';
  }

  public getMinistreSacrement(c: any): string {
    if (!c) return '';
    return c.confirmation?.ministre || c.ministre_confirmation || c.ministre || '';
  }

  public getTelephoneCandidat(c: any): string {
    return this.getTelephone(c);
  }

  public getNomPere(c: any): string {
    if (!c) return '';
    return c.nom_pere || c.nomPere || c.parent?.nom || c.parentTuteur?.nom || '';
  }

  public getNomMere(c: any): string {
    if (!c) return '';
    return c.nom_mere || c.nomMere || '';
  }

  public getNomParrain(c: any): string {
    return this.getParrain(c);
  }

  public getDomicileParrain(c: any): string {
    if (!c) return '';
    return c.parrain_confirmation?.domicile || c.domicile_parrain || c.parrainDetail?.domicile || '';
  }

  public getContactParrain(c: any): string {
    if (!c) return '';
    return c.parrain_confirmation?.telephone || c.telephone_parrain || c.parrainDetail?.telephone || c.parrainMarraine?.telephone || '';
  }

  public getParoisseParrain(c: any): string {
    if (!c) return '';
    return c.parrain_confirmation?.paroisse || c.paroisse_parrain || c.parrainDetail?.paroisse || c.paroisse_confirmation || '';
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

    this.pdfService.previewFicheRenseignementConfirmationPdf(params, {
      title: 'Fiche de Renseignements — Confirmation',
      subtitle,
      formatBadge: 'A4 Portrait',
      fileName: 'fiche-confirmation-renseignements.pdf',
      students: cat ? [{
        ...cat,
        id: cat.id,
        matricule: cat.matricule || cat.code_catechumene,
        nom: this.getNom(cat),
        prenoms: this.getPrenoms(cat),
        nom_complet: this.getNomPrenoms(cat),
        date_naissance: this.getDateNaissance(cat),
        lieu_naissance: this.getLieuNaissance(cat),
        profession: this.getProfession(cat),
        telephone: this.getTelephone(cat),
        domicile: this.getDomicile(cat),
        paroisse_bapteme: this.getParoisseBapteme(cat),
        date_bapteme: this.getDateBapteme(cat),
        numero_registre_bapteme: this.getNumeroCarnetBapteme(cat),
        diocese_bapteme: this.getDioceseBapteme(cat),
        ville_bapteme: this.getVilleBapteme(cat),
        parrain: this.getParrain(cat),
        date_premiere_communion: this.getDatePremiereCommunion(cat),
        paroisse_premiere_communion: this.getParoissePremiereCommunion(cat),
        date_confirmation: this.getDateConfirmation(cat),
        paroisse_confirmation: this.getParoisseConfirmation(cat),
        ministre_sacrement: this.getMinistreSacrement(cat),
        nom_pere: this.getNomPere(cat),
        nom_mere: this.getNomMere(cat),
        photo_url: this.getPhotoUrl(cat)
      }] : []
    });
  }
}
