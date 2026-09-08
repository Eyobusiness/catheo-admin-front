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
  selector: 'app-fiche-communion-renseignement-print',
  imports: [CommonModule, FormsModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './fiche-communion-renseignement.component.html',
  styleUrl: './fiche-communion-renseignement.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FicheCommunionRenseignementPrintComponent implements OnInit {
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
    return 'Première Communion';
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

    // Condition 2 : Pour afficher dans Première Communion, il faut être obligatoirement en 3ème Année
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

    // Condition 2 (suite) : Il faut obligatoirement être baptisé
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
    return c.telephone || c.contact || c.telephone_pere || c.telephone_mere || c.parent?.telephone || '';
  }

  public getDomicile(c: any): string {
    if (!c) return '';
    return c.domicile || c.adresse || '';
  }

  public getNumeroCarnetBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.num_carnet || c.num_carnet_bapteme || c.numero_acte_bapteme || c.registre_bapteme || c.numeroRegistreBapteme || '';
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
    return c.bapteme?.diocese || c.diocese_bapteme || c.diocese || '';
  }

  public getVilleBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.ville || c.ville_bapteme || c.ville || c.bapteme?.lieu || c.lieu_bapteme || '';
  }

  public getParoisseBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.paroisse || c.paroisse_bapteme || c.paroisseBapteme || '';
  }

  public getParrainMarraineOrigine(c: any): string {
    if (!c) return '';
    if (c.parrain_marraine_origine) return c.parrain_marraine_origine;
    if (c.parrain_origine) return c.parrain_origine;
    if (c.nom_parrain) return c.nom_parrain;
    if (c.parrain?.nom_prenoms || c.parrain?.nom) return c.parrain.nom_prenoms || c.parrain.nom;
    if (c.marraine?.nom_prenoms || c.marraine?.nom) return c.marraine.nom_prenoms || c.marraine.nom;
    if (Array.isArray(c.parrains_marraines) && c.parrains_marraines.length > 0) {
      return c.parrains_marraines[0]?.nom_prenoms || c.parrains_marraines[0]?.nom || '';
    }
    return '';
  }

  public getRepresentant(c: any): string {
    if (!c) return '';
    if (c.representant_par || c.representant) return c.representant_par || c.representant;
    if (c.parrain?.representant_nom || c.parrain?.representant_par) return c.parrain.representant_nom || c.parrain.representant_par;
    if (c.marraine?.representant_nom || c.marraine?.representant_par) return c.marraine.representant_nom || c.marraine.representant_par;
    if (c.representant_parrain) return c.representant_parrain;
    if (Array.isArray(c.parrains_marraines) && c.parrains_marraines.length > 0) {
      return c.parrains_marraines[0]?.representant_nom || c.parrains_marraines[0]?.representant_par || '';
    }
    return '';
  }

  public getContactParrainMarraine(c: any): string {
    if (!c) return '';
    if (c.contact_representant || c.representant_contact) return c.contact_representant || c.representant_contact;
    if (c.parrain?.representant_contact || c.parrain?.telephone) return c.parrain.representant_contact || c.parrain.telephone;
    if (c.marraine?.representant_contact || c.marraine?.telephone) return c.marraine.representant_contact || c.marraine.telephone;
    if (c.telephone_parrain) return c.telephone_parrain;
    if (Array.isArray(c.parrains_marraines) && c.parrains_marraines.length > 0) {
      return c.parrains_marraines[0]?.representant_contact || c.parrains_marraines[0]?.telephone || '';
    }
    return '';
  }

  public getNumeroRegistreBapteme(c: any): string {
    return this.getNumeroCarnetBapteme(c);
  }

  public getLieuDioceseBapteme(c: any): string {
    if (!c) return '';
    const l = this.getVilleBapteme(c);
    const d = this.getDioceseBapteme(c);
    if (l && d) return `${l} (${d})`;
    return l || d;
  }

  public getContact(c: any): string {
    return this.getTelephone(c);
  }

  public getNomPere(c: any): string {
    if (!c) return '';
    return c.nom_pere || c.nomPere || c.parentTuteur?.nom || '';
  }

  public getNomMere(c: any): string {
    if (!c) return '';
    return c.nom_mere || c.nomMere || '';
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

    this.pdfService.previewFicheRenseignementPremiereCommunionPdf(params, {
      title: 'Fiche de Renseignements — Première Communion',
      subtitle,
      formatBadge: 'A4 Portrait',
      fileName: 'fiche-communion-renseignements.pdf',
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
        lieu_diocese_bapteme: this.getLieuDioceseBapteme(cat),
        diocese_bapteme: this.getDioceseBapteme(cat),
        ville_bapteme: this.getVilleBapteme(cat),
        parrain_marraine_origine: this.getParrainMarraineOrigine(cat),
        representant_par: this.getRepresentant(cat),
        contact_parrain_marraine: this.getContactParrainMarraine(cat),
        nom_pere: this.getNomPere(cat),
        nom_mere: this.getNomMere(cat),
        photo_url: this.getPhotoUrl(cat)
      }] : []
    });
  }
}
