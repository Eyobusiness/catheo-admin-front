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
import { BilanAnnuelService } from '../services/bilan-annuel.service';
import { SectionService } from '../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../Organisations/Niveaux/services/niveau.service';
import { ClasseService } from '../../../Organisations/Classe/services/classe.service';
import { InscriptionAnnuelleService } from '../../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { CatechumeneService } from '../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { SeanceService } from '../../../Presences/services/seance.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  BilanAnnuelItem,
  DecisionStatus
} from '../models/bilan-annuel.model';

@Component({
  selector: 'app-bilan-annuel-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './bilan-annuel-page.component.html',
  styleUrl: './bilan-annuel-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BilanAnnuelPageComponent implements OnInit {
  public readonly service = inject(BilanAnnuelService);
  public readonly sectionService = inject(SectionService);
  public readonly niveauService = inject(NiveauService);
  public readonly classeService = inject(ClasseService);
  public readonly inscriptionService = inject(InscriptionAnnuelleService);
  public readonly catechumeneService = inject(CatechumeneService);
  public readonly seanceService = inject(SeanceService);
  public readonly anneeService = inject(AnneeCatecheseService);
  private readonly toastService = inject(ToastService);

  // Signaux des services
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.classeService.classes;
  public readonly inscriptions = this.inscriptionService.inscriptions;
  public readonly catechumenes = this.catechumeneService.catechumenes;
  public readonly seances = this.seanceService.seances;
  public readonly activeAnnee = this.anneeService.activeAnnee;

  // Signaux de filtres
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly searchQuery = signal<string>('');

  // Modifications locales de saisie
  public readonly localEdits = signal<Record<string, Partial<BilanAnnuelItem>>>({});

  // Modals
  public readonly isValidateModalOpen = signal(false);

  public readonly optionsDecision: DecisionStatus[] = ['Admis', 'Non admis', 'Ajourné'];

  // Listes en cascade
  public readonly filteredNiveaux = computed(() => {
    const secId = this.selectedSectionId();
    const all = this.niveaux();
    if (!secId) return all;
    return all.filter(n => n.section_id === secId || n.section?.id === secId);
  });

  public readonly filteredClasses = computed(() => {
    const secId = this.selectedSectionId();
    const nivId = this.selectedNiveauId();
    let list = this.classes();
    if (secId) {
      list = list.filter(c => c.niveau?.section_id === secId || c.niveau?.section?.id === secId);
    }
    if (nivId) {
      list = list.filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
    }
    return list;
  });

  public readonly selectedClasseName = computed<string>(() => {
    const cid = this.selectedClasseId();
    const cls = this.classes().find(c => c.id === cid);
    return cls ? cls.nom : 'Toutes les classes';
  });

  public readonly currentAnneePastorale = computed<string>(() => {
    const active = this.activeAnnee();
    return active ? active.libelle : '2025-2026';
  });

  // Statut de validation pour la classe sélectionnée
  public readonly isValide = computed(() => {
    return this.service.isBilanOfficielValide(this.currentAnneePastorale(), this.selectedClasseId());
  });

  // Liste des bilans calculée de manière pure et réactive avec présences automatiques et saisies numériques
  public readonly classBilans = computed<BilanAnnuelItem[]>(() => {
    const cid = this.selectedClasseId();
    const allInscriptions = this.inscriptions();
    const allCats = this.catechumenes();
    const allSeances = this.seances();
    const activeAnnee = this.currentAnneePastorale();
    const edits = this.localEdits();

    let classInscriptions = allInscriptions;
    if (cid) {
      classInscriptions = allInscriptions.filter(i => i.classe_id === cid || i.classe?.id === cid);
    }

    // Séances avec présences de la classe
    const classSeances = cid
      ? allSeances.filter(s => (s.classe_id === cid || s.classe?.id === cid) && s.presences && s.presences.length > 0)
      : allSeances.filter(s => s.presences && s.presences.length > 0);

    const totalSeances = classSeances.length;

    return classInscriptions.map(ins => {
      const catId = ins.catechumene_id || ins.catechumene?.id || ins.id;
      const cat = ins.catechumene || allCats.find(c => c.id === catId);

      const nom = cat?.nom || '';
      const prenoms = cat?.prenoms || '';
      const fullName = `${nom} ${prenoms}`.trim() || `Catéchumène #${catId.substring(0, 6)}`;
      const matricule = cat?.matricule || cat?.code_catechumene || ins.code_inscription || '';

      const override = edits[catId] || {};

      // Calcul automatique de la présence aux cours par le système
      let presenceCoursAuto = 90;
      if (totalSeances > 0) {
        const presents = classSeances.filter(s =>
          s.presences?.some(p =>
            p.catechumene_id === catId &&
            (p.statut_presence === 'present' || p.statut_presence === 'retard' || p.est_present)
          )
        ).length;
        presenceCoursAuto = Math.round((presents / totalSeances) * 100);
      }

      return {
        catechumeneId: catId,
        matricule,
        nomPrenoms: fullName,
        section: ins.section?.nom || '',
        niveau: ins.niveau?.nom || '',
        classe: ins.classe?.nom || this.selectedClasseName(),
        anneePastorale: activeAnnee,
        moyenneGenerale: override.moyenneGenerale ?? 12.5,
        presenceCoursPct: override.presenceCoursPct ?? presenceCoursAuto,
        presenceMesse: override.presenceMesse !== undefined ? Number(override.presenceMesse) : 0,
        presenceCEB: override.presenceCEB !== undefined ? Number(override.presenceCEB) : 0,
        presenceMouvement: override.presenceMouvement !== undefined ? Number(override.presenceMouvement) : 0,
        decision: override.decision || 'Admis'
      };
    });
  });

  // Liste filtrée des bilans avec recherche
  public readonly filteredBilans = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.classBilans();

    if (!q) return list;
    return list.filter(b =>
      b.nomPrenoms.toLowerCase().includes(q) ||
      b.matricule.toLowerCase().includes(q)
    );
  });

  // Statistiques KPI de la classe
  public readonly statsBilan = computed(() => {
    const list = this.filteredBilans();
    const total = list.length;
    const admis = list.filter(b => b.decision === 'Admis').length;
    const nonAdmis = list.filter(b => b.decision === 'Non admis').length;
    const ajournes = list.filter(b => b.decision === 'Ajourné').length;
    const tauxReussite = total > 0 ? parseFloat(((admis / total) * 100).toFixed(1)) : 0;

    return { total, admis, nonAdmis, ajournes, tauxReussite };
  });

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.classeService.getAll().subscribe(cls => {
      if (cls.length > 0 && !this.selectedClasseId()) {
        this.selectedClasseId.set(cls[0].id);
      }
    });
    this.inscriptionService.getAll().subscribe();
    this.seanceService.getAll().subscribe();
  }

  public onSectionChange(sectionId: string): void {
    this.selectedSectionId.set(sectionId);
    this.selectedNiveauId.set('');
    const availableCls = this.filteredClasses();
    if (availableCls.length > 0) {
      this.selectedClasseId.set(availableCls[0].id);
    }
  }

  public onNiveauChange(niveauId: string): void {
    this.selectedNiveauId.set(niveauId);
    const availableCls = this.filteredClasses();
    if (availableCls.length > 0) {
      this.selectedClasseId.set(availableCls[0].id);
    }
  }

  public onClasseChange(classeId: string): void {
    this.selectedClasseId.set(classeId);
  }

  public updateField(catId: string, field: keyof BilanAnnuelItem, val: any): void {
    const parsedVal = (field === 'presenceMesse' || field === 'presenceCEB' || field === 'presenceMouvement')
      ? Math.max(0, parseInt(val, 10) || 0)
      : val;

    this.localEdits.update(edits => ({
      ...edits,
      [catId]: {
        ...(edits[catId] || {}),
        [field]: parsedVal
      }
    }));
  }

  public openValiderModal(): void {
    this.isValidateModalOpen.set(true);
  }

  public closeValiderModal(): void {
    this.isValidateModalOpen.set(false);
  }

  public confirmValiderBilan(): void {
    this.service.validerBilan(this.currentAnneePastorale(), this.selectedClasseId()).subscribe({
      next: () => {
        this.isValidateModalOpen.set(false);
      }
    });
  }
}
