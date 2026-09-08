import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SacrementsService } from '../../services/sacrements.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import {
  CatechumeneSacrement,
  MotifException
} from '../../models/sacrements.model';
import { PdfService } from '../../../../core/services/pdf.service';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { ToastService } from '../../../../core/services/toast.service';

import { HeaderParoissePrintComponent } from '../../../Impressions/components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../../Impressions/components/footer-paroisse-print/footer-paroisse-print.component';

@Component({
  selector: 'app-premiere-communion-page',
  imports: [CommonModule, FormsModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './premiere-communion-page.component.html',
  styleUrl: './premiere-communion-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiereCommunionPageComponent implements OnInit {
  public readonly service = inject(SacrementsService);
  public readonly sectionService = inject(SectionService);
  public readonly niveauService = inject(NiveauService);
  public readonly classeService = inject(ClasseService);
  private readonly pdfService = inject(PdfService);
  public readonly configService = inject(ConfigurationService);
  public readonly anneeService = inject(AnneeCatecheseService);
  private readonly toastService = inject(ToastService);

  public readonly currentDate = new Date();
  public readonly activeAnneeLibelle = computed(() => this.anneeService.activeAnnee()?.libelle || '');
  public readonly nomParoisse = computed(() => this.configService.paroisseConfig()?.nom_paroisse || '');
  public readonly diocese = computed(() => this.configService.paroisseConfig()?.diocese || '');

  public ngOnInit(): void {
    this.service.loadCatechumenesFromApi();
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
  }

  // Signaux de données de la BD
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.classeService.classes;

  // Filtres
  public readonly searchQuery = signal('');
  public readonly filterSection = signal<string>('');
  public readonly filterNiveau = signal<string>('');
  public readonly filterClasse = signal<string>('');
  public readonly filterStatut = signal<'tous' | 'en_attente' | 'valide'>('tous');

  private is3emeAnnee(niveauObj?: any): boolean {
    if (!niveauObj) return false;
    if (typeof niveauObj === 'object' && (niveauObj.ordre === 3 || niveauObj.ordre_affichage === 3)) return true;
    const nom = (typeof niveauObj === 'string' ? niveauObj : (niveauObj.nom || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return nom.includes('3') || nom.includes('trois') || nom.includes('communion');
  }

  // Listes dynamiques en cascade selon la BD (verrouillées tant que la section n'est pas choisie)
  public readonly filteredNiveauxList = computed(() => {
    const secId = this.filterSection();
    if (!secId) return [];
    return this.niveaux().filter(n => String(n.section_id) === String(secId) || String(n.section?.id) === String(secId) || n.section?.nom === secId);
  });

  public readonly filteredClassesList = computed(() => {
    const nivId = this.filterNiveau();
    const secId = this.filterSection();
    if (!secId || !nivId) return [];
    return this.classes().filter(c => String(c.niveau_id) === String(nivId) || String(c.niveau?.id) === String(nivId) || c.niveau?.nom === nivId);
  });

  public onSectionChange(val: string): void {
    this.filterSection.set(val);
    this.filterNiveau.set('');
    this.filterClasse.set('');
  }

  public onNiveauChange(val: string): void {
    this.filterNiveau.set(val);
    this.filterClasse.set('');
  }

  // Sélection multiple
  public readonly selectedIds = signal<Set<string>>(new Set<string>());

  // Modals
  public readonly isViewModalOpen = signal(false);
  public readonly isValidationModalOpen = signal(false);
  public readonly isExceptionModalOpen = signal(false);
  public readonly isDeleteModalOpen = signal(false);
  public readonly isPrintModalOpen = signal(false);

  public readonly selectedCatechumene = signal<CatechumeneSacrement | null>(null);

  // Formulaire d'enregistrement sacrement
  public readonly sacrementFormData = signal({
    date: new Date().toISOString().split('T')[0],
    lieu: '',
    celebrant: '',
    parrain: '',
    marraine: '',
    numRegistre: '',
    observations: ''
  });

  // Formulaire d'exception pastorale
  public readonly exceptionSearchQuery = signal('');
  public readonly selectedCatechumeneForException = signal<CatechumeneSacrement | null>(null);
  public readonly exceptionFormData = signal({
    motif: 'Décision du Curé' as MotifException,
    autorisePar: '',
    observation: ''
  });

  public readonly motifsException: MotifException[] = [
    'Décision du Curé',
    'Préparation au mariage',
    'Cas pastoral',
    'Rattrapage',
    'Autre'
  ];



  // Liste des candidats à la Première Communion (3ème année baptisés ou exceptions)
  public readonly candidatsList = computed(() => {
    let list = this.service.candidatsPremiereCommunion();
    const q = this.searchQuery().toLowerCase().trim();
    const sec = this.filterSection();
    const niv = this.filterNiveau();
    const cla = this.filterClasse();
    const st = this.filterStatut();

    if (q) {
      list = list.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.prenoms.toLowerCase().includes(q) ||
        c.matricule.toLowerCase().includes(q) ||
        c.classe.toLowerCase().includes(q) ||
        c.niveau.toLowerCase().includes(q)
      );
    }

    if (sec) {
      list = list.filter(c => String(c.section_id) === String(sec) || c.section === sec);
    }

    if (niv) {
      const selectedNiveau = this.niveaux().find(n => String(n.id) === String(niv));
      if (selectedNiveau && !this.is3emeAnnee(selectedNiveau)) {
        return [];
      }
      list = list.filter(c => String(c.niveau_id) === String(niv) || c.niveau === niv || (selectedNiveau && c.niveau === selectedNiveau.nom));
    }

    if (cla) {
      const selectedClasse = this.classes().find(c => String(c.id) === String(cla));
      const nivObj = this.niveaux().find(n => String(n.id) === String(selectedClasse?.niveau_id || selectedClasse?.niveau?.id)) || selectedClasse?.niveau;
      if (selectedClasse && !this.is3emeAnnee(nivObj) && !this.is3emeAnnee(selectedClasse.nom)) {
        return [];
      }
      list = list.filter(c => String(c.classe_id) === String(cla) || c.classe === cla || (selectedClasse && c.classe === selectedClasse.nom));
    }

    // Condition 2 : Être obligatoirement baptisé
    list = list.filter(c => c.isBaptise);

    if (st === 'en_attente') {
      list = list.filter(c => !c.isPremiereCommunion);
    } else if (st === 'valide') {
      list = list.filter(c => c.isPremiereCommunion);
    }

    return list;
  });

  public readonly stats = computed(() => {
    const all = this.service.candidatsPremiereCommunion();
    const total = all.length;
    const valides = all.filter(c => c.isPremiereCommunion).length;
    const nonValides = all.filter(c => !c.isPremiereCommunion).length;
    const enAttente = nonValides;

    const dbSections = this.sections();
    const sectionsStats = dbSections.map(s => {
      const count = all.filter(c => c.section_id === s.id || c.section === s.nom).length;
      return { id: s.id, nom: s.nom, count };
    });

    return {
      total,
      valides,
      nonValides,
      enAttente,
      sectionsStats
    };
  });

  public readonly searchedCatechumenesForException = computed(() => {
    const q = this.exceptionSearchQuery().toLowerCase().trim();
    const all = this.service.catechumenes().filter(c => !this.service.candidatsPremiereCommunion().some(cb => cb.id === c.id));
    if (!q) return all.slice(0, 5);
    return all.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.prenoms.toLowerCase().includes(q) ||
      c.classe.toLowerCase().includes(q)
    );
  });

  public isAllSelected = computed(() => {
    const list = this.candidatsList();
    if (list.length === 0) return false;
    return list.every(c => this.selectedIds().has(c.id));
  });

  public toggleSelectAll(): void {
    const list = this.candidatsList();
    const current = new Set(this.selectedIds());

    if (this.isAllSelected()) {
      list.forEach(c => current.delete(c.id));
    } else {
      list.forEach(c => current.add(c.id));
    }

    this.selectedIds.set(current);
  }

  public toggleSelectOne(id: string): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  // --- ACTIONS MODALS ---

  public openViewModal(cat: CatechumeneSacrement): void {
    this.selectedCatechumene.set(cat);
    this.isViewModalOpen.set(true);
  }

  public openValidationModal(cat: CatechumeneSacrement): void {
    this.selectedCatechumene.set(cat);
    this.sacrementFormData.set({
      date: cat.premiereCommunionRecord?.date || new Date().toISOString().split('T')[0],
      lieu: cat.premiereCommunionRecord?.lieu || this.configService.paroisseConfig()?.nom_paroisse || '',
      celebrant: cat.premiereCommunionRecord?.celebrant || '',
      parrain: '',
      marraine: '',
      numRegistre: '',
      observations: ''
    });
    this.isValidationModalOpen.set(true);
  }

  public saveSacrementValidation(): void {
    const cat = this.selectedCatechumene();
    if (!cat) return;

    const data = this.sacrementFormData();
    this.service.enregistrerSacrement(cat.id, {
      type: 'Première Communion',
      date: data.date,
      lieu: data.lieu,
      celebrant: data.celebrant,
      parrain: data.parrain || undefined,
      marraine: data.marraine || undefined,
      numRegistre: data.numRegistre || undefined,
      observations: data.observations || undefined
    });

    this.isValidationModalOpen.set(false);
    this.toastService.success('Première Communion validée', `La Première Communion de ${cat.nom} ${cat.prenoms} a été validée et enregistrée !`);
  }

  public validerSelectionBulk(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.service.validerSacrementsBulk(ids, 'Première Communion');
    this.selectedIds.set(new Set());
    this.toastService.success('Premières Communions validées', `${ids.length} première(s) communion(s) validée(s) avec succès !`);
  }

  public openExceptionModal(): void {
    this.exceptionSearchQuery.set('');
    this.selectedCatechumeneForException.set(null);
    this.exceptionFormData.set({
      motif: 'Décision du Curé',
      autorisePar: 'Père Curé',
      observation: ''
    });
    this.isExceptionModalOpen.set(true);
  }

  public selectCatechumeneForException(c: CatechumeneSacrement): void {
    this.selectedCatechumeneForException.set(c);
  }

  public saveExceptionForm(): void {
    const target = this.selectedCatechumeneForException();
    if (!target) return;

    const f = this.exceptionFormData();
    this.service.addException(target.id, 'Première Communion', f.motif, f.autorisePar, f.observation).subscribe({
      next: () => {
        this.isExceptionModalOpen.set(false);
        this.toastService.success('Exception pastorale', `Exception ajoutée pour ${target.nom} ${target.prenoms} (Première Communion).`);
      },
      error: () => {
        this.toastService.error('Erreur', "Impossible d'enregistrer l'exception pastorale.");
      }
    });
  }

  public openDeleteModal(cat: CatechumeneSacrement): void {
    this.selectedCatechumene.set(cat);
    this.isDeleteModalOpen.set(true);
  }

  public confirmDelete(): void {
    const cat = this.selectedCatechumene();
    if (cat) {
      this.service.removeCandidate(cat.id);
      this.toastService.info('Candidat retiré', `Candidat retiré du registre de préparation à la Première Communion.`);
    }
    this.isDeleteModalOpen.set(false);
  }

  public printList(): void {
    window.print();
  }

  public openPdfReader(): void {
    this.pdfService.previewRegistreSacrementPdf({
      sacrement: 'communion',
      title: 'Registre Officiel de Première Communion',
      customTitle: 'REGISTRE PASTORAL DES CANDIDATS À LA PREMIÈRE COMMUNION',
      candidats: this.candidatsList(),
      anneePastorale: this.activeAnneeLibelle(),
      fileName: 'registre-premiere-communion.pdf'
    });
  }
}
