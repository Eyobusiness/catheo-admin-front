import {
  ChangeDetectionStrategy,
  Component,
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

@Component({
  selector: 'app-exceptions-pastorales-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './exceptions-pastorales-page.component.html',
  styleUrl: './exceptions-pastorales-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExceptionsPastoralesPageComponent {
  public readonly service = inject(SacrementsService);
  public readonly sectionService = inject(SectionService);
  public readonly niveauService = inject(NiveauService);
  public readonly classeService = inject(ClasseService);

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

  // Listes dynamiques en cascade selon la BD
  public readonly filteredNiveauxList = computed(() => {
    const secId = this.filterSection();
    if (!secId) return this.niveaux();
    return this.niveaux().filter(n => n.section_id === secId || n.section?.id === secId || n.section?.nom === secId);
  });

  public readonly filteredClassesList = computed(() => {
    const nivId = this.filterNiveau();
    const secId = this.filterSection();
    let res = this.classes();
    if (nivId) {
      res = res.filter(c => c.niveau_id === nivId || c.niveau?.id === nivId || c.niveau?.nom === nivId);
    } else if (secId) {
      const nivIdsInSec = new Set(this.filteredNiveauxList().map(n => n.id));
      res = res.filter(c => (!!c.niveau_id && nivIdsInSec.has(c.niveau_id)) || (!!c.niveau?.id && nivIdsInSec.has(c.niveau.id)));
    }
    return res;
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
  public readonly isDeleteModalOpen = signal(false);
  public readonly selectedException = signal<ExceptionSacrement | null>(null);

  // Formulaire d'ajout
  public readonly catSearchQuery = signal('');
  public readonly selectedCatechumene = signal<CatechumeneSacrement | null>(null);
  public readonly newExceptionForm = signal({
    sacrementType: 'Baptême' as TypeSacrement,
    motif: 'Décision du Curé' as MotifException,
    autorisePar: 'Père Curé',
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

  // Toast
  public readonly toastMessage = signal('');
  public readonly toastType = signal<'success' | 'danger' | 'warning' | 'info'>('success');
  public readonly showToast = signal(false);

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

  // Catéchumènes trouvés pour l'ajout
  public readonly searchedCatechumenes = computed(() => {
    const q = this.catSearchQuery().toLowerCase().trim();
    const all = this.service.catechumenes();
    if (!q) return all.slice(0, 5);
    return all.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.prenoms.toLowerCase().includes(q) ||
      c.matricule.toLowerCase().includes(q) ||
      c.classe.toLowerCase().includes(q)
    );
  });

  public openAddModal(): void {
    this.catSearchQuery.set('');
    this.selectedCatechumene.set(null);
    this.newExceptionForm.set({
      sacrementType: 'Baptême',
      motif: 'Décision du Curé',
      autorisePar: 'Père Curé',
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
    this.service.addException(cat.id, f.sacrementType, f.motif, f.autorisePar, f.observation);
    this.isAddModalOpen.set(false);
    this.triggerToast(`Dérogation enregistrée pour ${cat.nom} ${cat.prenoms} (${f.sacrementType})`, 'success');
  }

  public openDeleteModal(exc: ExceptionSacrement): void {
    this.selectedException.set(exc);
    this.isDeleteModalOpen.set(true);
  }

  public confirmDelete(): void {
    const exc = this.selectedException();
    if (exc) {
      this.service.deleteException(exc.id);
      this.triggerToast(`Dérogation supprimée avec succès.`, 'info');
    }
    this.isDeleteModalOpen.set(false);
  }

  public printSheet(): void {
    window.print();
  }

  private triggerToast(msg: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3500);
  }
}
