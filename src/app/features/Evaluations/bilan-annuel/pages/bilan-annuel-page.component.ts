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
import { PdfService } from '../../../../core/services/pdf.service';
import { EvaluationService } from '../../evaluation/services/evaluation.service';
import { ClasseMoyennesResponse } from '../../evaluation/models/evaluation.model';
import { AuthService } from '../../../../core/services/auth.service';
import {
  BilanAnnuelItem,
  DecisionStatus
} from '../models/bilan-annuel.model';

import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-bilan-annuel-page',
  imports: [CommonModule, FormsModule, HasPermissionDirective],
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
  public readonly evalService = inject(EvaluationService);
  public readonly pdfService = inject(PdfService);
  public readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  // Vérification du rôle Administrateur
  public readonly isAdmin = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return true;
    const roleStr = String(u.role || u.role_nom || u.profil?.code || u.profil?.nom || u.profil?.libelle || '').toLowerCase();
    return !roleStr || roleStr.includes('admin') || roleStr.includes('super') || roleStr.includes('directeur') || roleStr.includes('responsable') || roleStr.includes('cur') || roleStr.includes('secret');
  });

  // Signaux des services
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly classes = this.classeService.classes;
  public readonly inscriptions = this.inscriptionService.inscriptions;
  public readonly catechumenes = this.catechumeneService.catechumenes;
  public readonly seances = this.seanceService.seances;
  public readonly activeAnnee = this.anneeService.activeAnnee;

  // Signaux de filtres (pas de présélection automatique)
  public readonly selectedSectionId = signal<string>('');
  public readonly selectedNiveauId = signal<string>('');
  public readonly selectedClasseId = signal<string>('');
  public readonly searchQuery = signal<string>('');

  // Moyennes réelles de la classe chargées depuis le backend
  public readonly classAverages = signal<ClasseMoyennesResponse | null>(null);
  public readonly isLoadingAverages = signal<boolean>(false);

  // Modifications locales de saisie
  public readonly localEdits = signal<Record<string, Partial<BilanAnnuelItem>>>({});

  // Modals
  public readonly isValidateModalOpen = signal(false);
  public readonly isUnlockModalOpen = signal(false);

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
    return cls ? cls.nom : 'Aucune classe sélectionnée';
  });

  public readonly currentAnneePastorale = computed<string>(() => {
    const active = this.activeAnnee();
    return active ? active.libelle : '2025-2026';
  });

  // Statut de validation pour la classe sélectionnée
  public readonly isValide = computed(() => {
    const cid = this.selectedClasseId();
    if (!cid) return false;
    return this.service.isBilanOfficielValide(this.currentAnneePastorale(), cid);
  });

  // Liste des bilans calculée UNIQUEMENT si une classe est choisie
  public readonly classBilans = computed<BilanAnnuelItem[]>(() => {
    const cid = this.selectedClasseId();
    if (!cid) return [];

    const allInscriptions = this.inscriptions();
    const allCats = this.catechumenes();
    const allSeances = this.seances();
    const activeAnnee = this.currentAnneePastorale();
    const edits = this.localEdits();
    const averages = this.classAverages();

    const classInscriptions = allInscriptions.filter(i => i.classe_id === cid || i.classe?.id === cid);

    // Séances avec présences de la classe
    const classSeances = allSeances.filter(s =>
      (s.classe_id === cid || s.classe?.id === cid) && s.presences && s.presences.length > 0
    );

    const totalSeances = classSeances.length;

    return classInscriptions.map(ins => {
      const catId = ins.catechumene_id || ins.catechumene?.id || ins.id;
      const cat = ins.catechumene || allCats.find(c => c.id === catId);

      const nom = cat?.nom || '';
      const prenoms = cat?.prenoms || '';
      const fullName = `${nom} ${prenoms}`.trim() || `Catéchumène #${catId.substring(0, 6)}`;
      const matricule = cat?.matricule || cat?.code_catechumene || ins.code_inscription || '';

      const override = edits[catId] || (matricule ? edits[matricule] : null) || {};

      // Calcul automatique de la présence aux cours : compter le nombre de fois où le catéchumène a été présent
      let presenceCoursAutoNb = 0;
      if (totalSeances > 0) {
        presenceCoursAutoNb = classSeances.filter(s =>
          s.presences?.some(p =>
            (p.catechumene_id === catId || (p.catechumene && p.catechumene.id === catId)) &&
            (p.statut_presence === 'present' || p.statut_presence === 'retard' || p.est_present === true)
          )
        ).length;
      }

      const presenceCoursNb = override.presenceCoursNb !== undefined
        ? Number(override.presenceCoursNb)
        : presenceCoursAutoNb;

      const presenceCoursPct = totalSeances > 0
        ? Math.round((presenceCoursNb / totalSeances) * 100)
        : (presenceCoursNb > 0 ? 100 : 0);

      // Correspondance exacte de l'élève (par matricule ou ID UUID d'abord pour éviter tout conflit d'homonymes)
      const eleveAvg = averages?.eleves?.find(e =>
        (matricule && e.matricule && String(e.matricule).toLowerCase().trim() === String(matricule).toLowerCase().trim()) ||
        String(e.catechumene_id) === String(catId) ||
        (cat && cat.id && String(e.catechumene_id) === String(cat.id))
      ) || averages?.eleves?.find(e =>
        e.nom_prenoms && fullName && String(e.nom_prenoms).toLowerCase().trim() === String(fullName).toLowerCase().trim()
      );

      // Moyenne réelle officielle issue du backend (identique au bulletin)
      const rawMoy = eleveAvg?.moyenne ?? (eleveAvg as any)?.moyenne_generale ?? (eleveAvg as any)?.moyenne_sur_20 ?? (eleveAvg as any)?.moyenne_annuelle;
      let realMoyenne = (rawMoy !== undefined && rawMoy !== null && rawMoy !== '')
        ? parseFloat(Number(rawMoy).toFixed(2))
        : null;

      // Si pas de moyenne directe calculée, calcul pondéré des notes comme dans le bulletin
      if (realMoyenne === null) {
        const evalsList = averages?.evaluations || [];
        let totalCoeff = 0;
        let totalPoints = 0;

        if (evalsList.length > 0 && eleveAvg?.details_notes) {
          evalsList.forEach(ev => {
            const noteEntry = eleveAvg.details_notes.find(n => n.evaluation_id === ev.id);
            const noteObtenue = noteEntry?.note_obtenue !== undefined && noteEntry?.note_obtenue !== null
              ? Number(noteEntry.note_obtenue)
              : null;
            const noteSur20 = noteEntry?.note_sur_20 !== undefined && noteEntry?.note_sur_20 !== null
              ? Number(noteEntry.note_sur_20)
              : (noteObtenue !== null && ev.note_max > 0 ? parseFloat(((noteObtenue / ev.note_max) * 20).toFixed(2)) : null);

            if (noteSur20 !== null) {
              const coeff = ev.coefficient || 1;
              totalCoeff += coeff;
              totalPoints += parseFloat((noteSur20 * coeff).toFixed(2));
            }
          });
        } else if (eleveAvg?.details_notes && eleveAvg.details_notes.length > 0) {
          for (const n of eleveAvg.details_notes) {
            const noteObtenue = n.note_obtenue !== undefined && n.note_obtenue !== null ? Number(n.note_obtenue) : null;
            const noteSur20 = n.note_sur_20 !== undefined && n.note_sur_20 !== null
              ? Number(n.note_sur_20)
              : (noteObtenue !== null && n.note_max > 0 ? (noteObtenue / n.note_max) * 20 : null);
            if (noteSur20 !== null) {
              const coeff = n.coefficient || 1;
              totalCoeff += coeff;
              totalPoints += parseFloat((noteSur20 * coeff).toFixed(2));
            }
          }
        }

        if (totalCoeff > 0) {
          realMoyenne = parseFloat((totalPoints / totalCoeff).toFixed(2));
        }
      }

      // La moyenne générale calculée prévaut toujours
      const moyenneGenerale = realMoyenne !== null ? realMoyenne : (override.moyenneGenerale ?? null);

      // Décision pastorale par défaut selon la moyenne
      let defaultDecision: DecisionStatus = 'Admis';
      if (moyenneGenerale !== null) {
        if (moyenneGenerale >= 10) defaultDecision = 'Admis';
        else if (moyenneGenerale >= 8.5) defaultDecision = 'Ajourné';
        else defaultDecision = 'Non admis';
      }

      return {
        catechumeneId: catId,
        matricule,
        nomPrenoms: fullName,
        section: ins.section?.nom || '',
        niveau: ins.niveau?.nom || '',
        classe: ins.classe?.nom || this.selectedClasseName(),
        anneePastorale: activeAnnee,
        moyenneGenerale,
        presenceCoursNb,
        totalSeances,
        presenceCoursPct,
        presenceMesse: override.presenceMesse !== undefined ? Number(override.presenceMesse) : 0,
        presenceCEB: override.presenceCEB !== undefined ? Number(override.presenceCEB) : 0,
        presenceMouvement: override.presenceMouvement !== undefined ? Number(override.presenceMouvement) : 0,
        decision: override.decision || defaultDecision
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
    this.classeService.getAll().subscribe();
    this.inscriptionService.getAll().subscribe();
    this.seanceService.getAll().subscribe();
  }

  public onSectionChange(sectionId: string): void {
    this.selectedSectionId.set(sectionId);
    this.selectedNiveauId.set('');
    this.selectedClasseId.set('');
    this.classAverages.set(null);
  }

  public onNiveauChange(niveauId: string): void {
    this.selectedNiveauId.set(niveauId);
    this.selectedClasseId.set('');
    this.classAverages.set(null);
  }

  public onClasseChange(classeId: string): void {
    this.selectedClasseId.set(classeId);
    if (classeId) {
      // Recharger les données sauvegardées s'il y en a
      const savedItems = this.service.getBilanData(this.currentAnneePastorale(), classeId);
      if (savedItems && savedItems.length > 0) {
        const editsMap: Record<string, Partial<BilanAnnuelItem>> = {};
        for (const item of savedItems) {
          const editObj: Partial<BilanAnnuelItem> = {
            presenceCoursNb: item.presenceCoursNb,
            presenceMesse: item.presenceMesse,
            presenceCEB: item.presenceCEB,
            presenceMouvement: item.presenceMouvement,
            decision: item.decision
          };
          if (item.catechumeneId) editsMap[item.catechumeneId] = editObj;
          if (item.matricule) editsMap[item.matricule] = editObj;
        }
        this.localEdits.set(editsMap);
      } else {
        this.localEdits.set({});
      }

      this.loadClassAverages(classeId);
      this.seanceService.getAll(classeId).subscribe();
    } else {
      this.classAverages.set(null);
      this.localEdits.set({});
    }
  }

  public loadClassAverages(classeId: string): void {
    this.isLoadingAverages.set(true);
    this.evalService.getClassAverages(classeId, this.activeAnnee()?.id).subscribe({
      next: res => {
        this.classAverages.set(res);
        this.isLoadingAverages.set(false);
      },
      error: () => {
        this.classAverages.set(null);
        this.isLoadingAverages.set(false);
      }
    });
  }

  public updateField(catId: string, field: keyof BilanAnnuelItem, val: any): void {
    const parsedVal = (field === 'presenceMesse' || field === 'presenceCEB' || field === 'presenceMouvement' || field === 'presenceCoursNb')
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

  public printBilan(): void {
    const cid = this.selectedClasseId();
    if (!cid) return;
    const cls = this.classes().find(c => c.id === cid);
    const sec = this.sections().find(s => s.id === this.selectedSectionId());
    const niv = this.niveaux().find(n => n.id === this.selectedNiveauId());

    const students = this.classBilans().map((b, idx) => ({
      id: b.catechumeneId,
      num: String(idx + 1).padStart(2, '0'),
      numero: String(idx + 1).padStart(2, '0'),
      matricule: b.matricule,
      nomPrenoms: b.nomPrenoms,
      nom_complet: b.nomPrenoms,
      telephone: (this.catechumenes().find(c => c.id === b.catechumeneId)?.telephone) || '-',
      contact: (this.catechumenes().find(c => c.id === b.catechumeneId)?.telephone) || '-',
      moyenne: b.moyenneGenerale !== null && b.moyenneGenerale !== undefined ? `${b.moyenneGenerale} / 20` : '',
      moyenne_generale: b.moyenneGenerale,
      moyenne_annuelle: b.moyenneGenerale,
      presences_cours: b.presenceCoursNb,
      presences_messe: b.presenceMesse,
      presences_mouvement: b.presenceMouvement,
      presences_ceb: b.presenceCEB,
      decision: b.decision
    }));

    this.pdfService.previewBilanAnnuelPdf({
      classe_id: cid,
      annee_pastorale: this.currentAnneePastorale()
    }, {
      classeNom: cls?.nom,
      sectionNom: sec?.nom,
      niveauNom: niv?.nom,
      students
    });
  }

  public openValiderModal(): void {
    if (!this.selectedClasseId()) return;
    this.isValidateModalOpen.set(true);
  }

  public closeValiderModal(): void {
    this.isValidateModalOpen.set(false);
  }

  public confirmValiderBilan(): void {
    const cid = this.selectedClasseId();
    if (!cid) return;
    const currentList = this.classBilans();
    this.service.validerBilan(this.currentAnneePastorale(), cid, currentList).subscribe({
      next: () => {
        this.isValidateModalOpen.set(false);
      }
    });
  }

  public openDeverrouillerModal(): void {
    if (!this.selectedClasseId()) return;
    this.isUnlockModalOpen.set(true);
  }

  public closeDeverrouillerModal(): void {
    this.isUnlockModalOpen.set(false);
  }

  public confirmDeverrouillerBilan(): void {
    const cid = this.selectedClasseId();
    if (!cid) return;
    this.service.deverrouillerBilan(this.currentAnneePastorale(), cid).subscribe({
      next: () => {
        this.isUnlockModalOpen.set(false);
      }
    });
  }
}
