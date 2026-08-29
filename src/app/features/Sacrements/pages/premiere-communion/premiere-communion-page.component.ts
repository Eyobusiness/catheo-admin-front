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
  MotifException
} from '../../models/sacrements.model';

@Component({
  selector: 'app-premiere-communion-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './premiere-communion-page.component.html',
  styleUrl: './premiere-communion-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiereCommunionPageComponent {
  public readonly service = inject(SacrementsService);
  public readonly sectionService = inject(SectionService);
  public readonly niveauService = inject(NiveauService);
  public readonly classeService = inject(ClasseService);

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
    lieu: 'Paroisse Cœur Immaculé de Marie',
    celebrant: 'Père Curé',
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
    autorisePar: 'Père Curé',
    observation: ''
  });

  public readonly motifsException: MotifException[] = [
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
      list = list.filter(c => c.section_id === sec || c.section === sec);
    }

    if (niv) {
      list = list.filter(c => c.niveau_id === niv || c.niveau === niv);
    }

    if (cla) {
      list = list.filter(c => c.classe_id === cla || c.classe === cla);
    }

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
    const enAttente = total - valides;

    const dbSections = this.sections();
    const sectionsStats = dbSections.map(s => {
      const count = all.filter(c => c.section_id === s.id || c.section === s.nom).length;
      return { id: s.id, nom: s.nom, count };
    });

    return {
      total,
      valides,
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
      date: new Date().toISOString().split('T')[0],
      lieu: 'Paroisse Cœur Immaculé de Marie',
      celebrant: 'Père Curé',
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
    this.triggerToast(`La Première Communion de ${cat.nom} ${cat.prenoms} a été validée et enregistrée !`, 'success');
  }

  public validerSelectionBulk(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;

    this.service.validerSacrementsBulk(ids, 'Première Communion');
    this.selectedIds.set(new Set());
    this.triggerToast(`${ids.length} première(s) communion(s) validée(s) avec succès !`, 'success');
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
    this.service.addException(target.id, 'Première Communion', f.motif, f.autorisePar, f.observation);
    this.isExceptionModalOpen.set(false);
    this.triggerToast(`Exception pastorale ajoutée pour ${target.nom} ${target.prenoms} (Première Communion).`, 'success');
  }

  public openDeleteModal(cat: CatechumeneSacrement): void {
    this.selectedCatechumene.set(cat);
    this.isDeleteModalOpen.set(true);
  }

  public confirmDelete(): void {
    const cat = this.selectedCatechumene();
    if (cat) {
      this.service.removeCandidate(cat.id);
      this.triggerToast(`Candidat retiré du registre de préparation à la Première Communion.`, 'danger');
    }
    this.isDeleteModalOpen.set(false);
  }

  public printList(): void {
    window.print();
  }

  private triggerToast(msg: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3500);
  }
}
