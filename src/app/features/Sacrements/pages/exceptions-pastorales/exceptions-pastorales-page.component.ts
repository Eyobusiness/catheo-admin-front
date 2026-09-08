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
  ExceptionSacrement,
  MotifException,
  TypeSacrement
} from '../../models/sacrements.model';
import { PdfService } from '../../../../core/services/pdf.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { ToastService } from '../../../../core/services/toast.service';
import { HeaderParoissePrintComponent } from '../../../Impressions/components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../../Impressions/components/footer-paroisse-print/footer-paroisse-print.component';

@Component({
  selector: 'app-exceptions-pastorales-page',
  imports: [
    CommonModule,
    FormsModule,
    HeaderParoissePrintComponent,
    FooterParoissePrintComponent
  ],
  templateUrl: './exceptions-pastorales-page.component.html',
  styleUrl: './exceptions-pastorales-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExceptionsPastoralesPageComponent implements OnInit {
  public readonly service = inject(SacrementsService);
  public readonly sectionService = inject(SectionService);
  public readonly niveauService = inject(NiveauService);
  public readonly classeService = inject(ClasseService);
  private readonly pdfService = inject(PdfService);
  private readonly anneeService = inject(AnneeCatecheseService);
  private readonly toastService = inject(ToastService);

  public ngOnInit(): void {
    this.service.fetchExceptions().subscribe();
    this.service.loadCatechumenesFromApi();
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
  }

  // Données BD
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.classeService.classes;

  // Filtres
  public readonly searchQuery = signal('');
  public readonly filterSection = signal<string>('');
  public readonly filterNiveau = signal<string>('');
  public readonly filterClasse = signal<string>('');
  public readonly filterSacrement = signal<string>('tous');
  public readonly filterMotif = signal<string>('tous');

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

  // Modals
  public readonly isAddModalOpen = signal(false);
  public readonly isEditModalOpen = signal(false);
  public readonly isDeleteModalOpen = signal(false);
  public readonly isPrintModalOpen = signal(false);
  public readonly selectedException = signal<ExceptionSacrement | null>(null);
  public readonly currentDate = new Date();
  public readonly activeAnneeLibelle = computed(() => this.anneeService.activeAnnee()?.libelle || '');

  // Formulaire d'ajout
  public readonly catSearchQuery = signal('');
  public readonly selectedCatechumene = signal<CatechumeneSacrement | null>(null);
  public readonly selectedSacrementForAdd = signal<TypeSacrement>('Baptême');
  public readonly newExceptionForm = signal({
    sacrementType: 'Baptême' as TypeSacrement,
    motif: 'Décision du Curé' as MotifException,
    autorisePar: '',
    observation: ''
  });

  // Formulaire d'édition
  public readonly editExceptionForm = signal({
    id: '',
    catechumeneNomComplet: '',
    sacrementType: 'Baptême' as TypeSacrement,
    motif: 'Décision du Curé' as MotifException,
    autorisePar: '',
    observation: ''
  });

  public readonly sacrementsTypes: TypeSacrement[] = ['Baptême', 'Première Communion', 'Confirmation'];
  public readonly motifsList: MotifException[] = [
    'Décision du Curé',
    'Préparation au mariage',
    'Cas pastoral',
    'Rattrapage',
    'Autre'
  ];



  // Liste filtrée des exceptions
  public readonly filteredExceptions = computed(() => {
    let list = this.service.allExceptions();
    const q = this.searchQuery().toLowerCase().trim();
    const sec = this.filterSection();
    const niv = this.filterNiveau();
    const cla = this.filterClasse();
    const sac = this.filterSacrement();
    const mot = this.filterMotif();

    if (q) {
      list = list.filter(e =>
        e.catechumeneNomComplet?.toLowerCase().includes(q) ||
        e.autorisePar.toLowerCase().includes(q) ||
        e.classe?.toLowerCase().includes(q) ||
        e.niveau?.toLowerCase().includes(q)
      );
    }

    if (sec) {
      list = list.filter(e => e.section_id === sec || e.section === sec);
    }

    if (niv) {
      list = list.filter(e => e.niveau_id === niv || e.niveau === niv);
    }

    if (cla) {
      list = list.filter(e => e.classe_id === cla || e.classe === cla);
    }

    if (sac !== 'tous') {
      list = list.filter(e => e.sacrementType === sac);
    }

    if (mot !== 'tous') {
      list = list.filter(e => e.motif === mot);
    }

    return list;
  });

  // Statistiques
  public readonly stats = computed(() => {
    const list = this.service.allExceptions();
    return {
      total: list.length,
      bapteme: list.filter(e => e.sacrementType === 'Baptême').length,
      communion: list.filter(e => e.sacrementType === 'Première Communion').length,
      confirmation: list.filter(e => e.sacrementType === 'Confirmation').length
    };
  });

  // Catéchumènes de l'année active qui ne remplissent PAS les conditions normales pour le sacrement choisi
  public readonly searchedCatechumenes = computed(() => {
    const sacType = this.selectedSacrementForAdd();
    const eligibleList = this.service.getCatechumenesEligiblesPourDerogation(sacType);
    const q = this.catSearchQuery().toLowerCase().trim();

    if (!q) return eligibleList.slice(0, 10);

    return eligibleList.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.prenoms.toLowerCase().includes(q) ||
      c.matricule.toLowerCase().includes(q) ||
      c.classe.toLowerCase().includes(q) ||
      c.niveau.toLowerCase().includes(q)
    );
  });

  public onSacrementSelectChange(type: TypeSacrement): void {
    this.selectedSacrementForAdd.set(type);
    this.newExceptionForm.update(f => ({ ...f, sacrementType: type }));
    this.selectedCatechumene.set(null);
  }

  public openAddModal(): void {
    this.catSearchQuery.set('');
    this.selectedCatechumene.set(null);
    this.selectedSacrementForAdd.set('Baptême');
    this.newExceptionForm.set({
      sacrementType: 'Baptême',
      motif: 'Décision du Curé',
      autorisePar: '',
      observation: ''
    });
    this.isAddModalOpen.set(true);
  }

  public selectCatechumene(c: CatechumeneSacrement): void {
    this.selectedCatechumene.set(c);
  }

  public saveNewException(): void {
    const cat = this.selectedCatechumene();
    if (!cat) return;

    const f = this.newExceptionForm();
    this.service.addException(cat.id, f.sacrementType, f.motif, f.autorisePar, f.observation).subscribe({
      next: () => {
        this.isAddModalOpen.set(false);
        this.toastService.success(
          'Dérogation enregistrée',
          `Dérogation accordée pour ${cat.nom} ${cat.prenoms} (${f.sacrementType})`
        );
      },
      error: () => {
        this.toastService.error('Erreur', "Impossible d'enregistrer la dérogation.");
      }
    });
  }

  public updateNewForm(patch: Partial<{ sacrementType: TypeSacrement; motif: MotifException; autorisePar: string; observation: string }>): void {
    this.newExceptionForm.update(f => ({ ...f, ...patch }));
  }

  public updateEditForm(patch: Partial<{ sacrementType: TypeSacrement; motif: MotifException; autorisePar: string; observation: string }>): void {
    this.editExceptionForm.update(f => ({ ...f, ...patch }));
  }

  public openEditModal(exc: ExceptionSacrement): void {
    this.selectedException.set(exc);
    this.editExceptionForm.set({
      id: exc.id,
      catechumeneNomComplet: exc.catechumeneNomComplet || '',
      sacrementType: exc.sacrementType,
      motif: exc.motif,
      autorisePar: exc.autorisePar || '',
      observation: exc.observation || ''
    });
    this.isEditModalOpen.set(true);
  }

  public saveEditException(): void {
    const f = this.editExceptionForm();
    if (!f.id) return;

    this.service.updateException(f.id, {
      motif: f.motif,
      autorisePar: f.autorisePar,
      observation: f.observation,
      sacrementType: f.sacrementType
    }).subscribe({
      next: () => {
        this.isEditModalOpen.set(false);
        this.toastService.success(
          'Dérogation modifiée',
          `La dérogation pour ${f.catechumeneNomComplet} (${f.sacrementType}) a été mise à jour.`
        );
      },
      error: () => {
        this.toastService.error('Erreur', 'Impossible de mettre à jour la dérogation.');
      }
    });
  }

  public openDeleteModal(exc: ExceptionSacrement): void {
    this.selectedException.set(exc);
    this.isDeleteModalOpen.set(true);
  }

  public confirmDelete(): void {
    const exc = this.selectedException();
    if (exc) {
      this.service.deleteException(exc.id).subscribe({
        next: () => {
          this.toastService.info(
            'Dérogation supprimée',
            `La dérogation pour ${exc.catechumeneNomComplet} (${exc.sacrementType}) a été révoquée.`
          );
        },
        error: () => {
          this.toastService.error('Erreur', 'Impossible de révoquer la dérogation.');
        }
      });
    }
    this.isDeleteModalOpen.set(false);
  }

  public printSheet(): void {
    this.isPrintModalOpen.set(true);
  }

  public printList(): void {
    window.print();
  }

  public openPdfReader(): void {
    this.pdfService.previewRegistreExceptionsPdf({
      title: 'Registre des Exceptions & Dérogations Pastorales',
      customTitle: 'REGISTRE PASTORAL DES EXCEPTIONS & DÉROGATIONS',
      exceptions: this.filteredExceptions(),
      anneePastorale: this.activeAnneeLibelle(),
      fileName: 'registre-exceptions-pastorales.pdf'
    });
  }
}
