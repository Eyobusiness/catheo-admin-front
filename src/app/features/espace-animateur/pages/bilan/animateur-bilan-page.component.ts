import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnimateurClasseService } from '../../services/animateur-classe.service';
import { BilanAnnuelService } from '../../../Evaluations/bilan-annuel/services/bilan-annuel.service';
import { EvaluationService } from '../../../Evaluations/evaluation/services/evaluation.service';
import { SeanceService } from '../../../Presences/services/seance.service';
import { PdfService } from '../../../../core/services/pdf.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BilanAnnuelItem, DecisionStatus } from '../../../Evaluations/bilan-annuel/models/bilan-annuel.model';
import { ClasseMoyennesResponse } from '../../../Evaluations/evaluation/models/evaluation.model';

export interface AnimateurBilanRow {
  catechumeneId: string;
  matricule: string;
  nomPrenoms: string;
  sexe?: string;
  moyenneGenerale: number | null;
  presenceCoursNb: number;
  totalSeances: number;
  presenceCoursPct: number;
  presenceMesse: number;
  presenceCEB: number;
  presenceMouvement: number;
  decision: DecisionStatus;
  observation?: string;
}

@Component({
  selector: 'app-animateur-bilan-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './animateur-bilan-page.component.html',
  styleUrl: './animateur-bilan-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurBilanPageComponent implements OnInit {
  protected readonly classeService = inject(AnimateurClasseService);
  protected readonly bilanService = inject(BilanAnnuelService);
  protected readonly evalService = inject(EvaluationService);
  protected readonly seanceService = inject(SeanceService);
  protected readonly pdfService = inject(PdfService);
  private readonly toastService = inject(ToastService);

  // Données pastorales de la classe de l'animateur
  protected readonly classe = this.classeService.classe;
  protected readonly niveau = this.classeService.niveau;
  protected readonly section = this.classeService.section;
  protected readonly annee = this.classeService.anneePastorale;
  protected readonly eleves = this.classeService.catechumenes;
  protected readonly hasNoAffectation = this.classeService.hasNoAffectation;

  protected readonly currentClasseId = computed(() => {
    const c = this.classe();
    return c ? String(c.id) : '';
  });

  protected readonly anneeLibelle = computed(() => {
    const a = this.annee();
    return a ? a.libelle : '2025-2026';
  });

  // Statut de verrouillage : vrai une fois validé par l'animateur ou l'admin
  // ATTENTION : Seul l'administrateur dans son interface admin peut déverrouiller.
  // L'animateur n'a AUCUN bouton de déverrouillage.
  protected readonly isLocked = computed(() => {
    const cid = this.currentClasseId();
    if (!cid) return false;
    return this.bilanService.isBilanOfficielValide(this.anneeLibelle(), cid);
  });

  // Moyennes réelles de la classe
  protected readonly classAverages = signal<ClasseMoyennesResponse | null>(null);
  protected readonly isLoadingData = signal<boolean>(false);
  protected readonly isSaving = signal<boolean>(false);
  protected readonly searchQuery = signal<string>('');

  // Modals
  protected readonly isConfirmModalOpen = signal<boolean>(false);

  // Saisies et modifications locales
  protected readonly localEdits = signal<Record<string, {
    presenceCoursNb?: number;
    presenceMesse?: number;
    presenceCEB?: number;
    presenceMouvement?: number;
    decision?: DecisionStatus;
    observation?: string;
  }>>({});

  public readonly decisionOptions: DecisionStatus[] = ['Admis', 'Ajourné', 'Non admis', 'Abandon'];

  // Construction réactive des lignes du bilan
  protected readonly bilanRows = computed<AnimateurBilanRow[]>(() => {
    const elevesList = this.eleves();
    const averages = this.classAverages();
    const edits = this.localEdits();
    const allSeances = this.seanceService.seances();
    const cid = this.currentClasseId();

    // Récupérer les séances de la classe
    const classSeances = allSeances.filter(s =>
      (String(s.classe_id) === cid || String(s.classe?.id) === cid) &&
      s.presences && s.presences.length > 0
    );
    const totalSeances = classSeances.length;

    // Récupérer les données préalablement sauvegardées s'il y en a
    const savedData = cid ? this.bilanService.getBilanData(this.anneeLibelle(), cid) : null;

    return elevesList.map(cat => {
      const catId = String(cat.id || cat.uuid || '');
      const matricule = cat.matricule || '';
      const nom = cat.nom || '';
      const prenoms = cat.prenoms || '';
      const nomPrenoms = cat.nom_complet || `${nom} ${prenoms}`.trim();

      // Correspondance moyenne
      const eleveAvg = averages?.eleves?.find(e =>
        (matricule && e.matricule && String(e.matricule).toLowerCase().trim() === matricule.toLowerCase().trim()) ||
        String(e.catechumene_id) === catId
      ) || averages?.eleves?.find(e =>
        e.nom_prenoms && nomPrenoms && String(e.nom_prenoms).toLowerCase().trim() === nomPrenoms.toLowerCase().trim()
      );

      const rawMoy = eleveAvg?.moyenne ?? (eleveAvg as any)?.moyenne_generale ?? (eleveAvg as any)?.moyenne_sur_20 ?? (eleveAvg as any)?.moyenne_annuelle;
      const moyenneGenerale = (rawMoy !== undefined && rawMoy !== null && rawMoy !== '')
        ? parseFloat(Number(rawMoy).toFixed(2))
        : null;

      // Données sauvegardées ou proposition automatique
      const savedItem = savedData?.find(s => s.catechumeneId === catId || s.matricule === matricule);
      const userEdit = edits[catId] || (matricule ? edits[matricule] : null) || {};

      // Calcul assiduité aux cours (automatique depuis les séances)
      let presenceCoursAutoNb = 0;
      if (totalSeances > 0) {
        presenceCoursAutoNb = classSeances.filter(s =>
          s.presences?.some(p =>
            (String(p.catechumene_id) === catId || String(p.catechumene?.id) === catId) &&
            (p.statut_presence === 'present' || p.statut_presence === 'retard' || p.est_present === true)
          )
        ).length;
      }

      const presenceCoursNb = userEdit.presenceCoursNb !== undefined
        ? Number(userEdit.presenceCoursNb)
        : (savedItem?.presenceCoursNb !== undefined ? Number(savedItem.presenceCoursNb) : presenceCoursAutoNb);

      const presenceCoursPct = totalSeances > 0
        ? Math.round((presenceCoursNb / totalSeances) * 100)
        : (presenceCoursNb > 0 ? 100 : 0);

      const presenceMesse = userEdit.presenceMesse !== undefined
        ? Number(userEdit.presenceMesse)
        : (savedItem?.presenceMesse !== undefined ? Number(savedItem.presenceMesse) : 0);

      const presenceCEB = userEdit.presenceCEB !== undefined
        ? Number(userEdit.presenceCEB)
        : (savedItem?.presenceCEB !== undefined ? Number(savedItem.presenceCEB) : 0);

      const presenceMouvement = userEdit.presenceMouvement !== undefined
        ? Number(userEdit.presenceMouvement)
        : (savedItem?.presenceMouvement !== undefined ? Number(savedItem.presenceMouvement) : 0);

      let defaultDecision: DecisionStatus = 'Non admis';
      if (moyenneGenerale !== null) {
        if (moyenneGenerale >= 10) defaultDecision = 'Admis';
        else if (moyenneGenerale >= 8.5) defaultDecision = 'Ajourné';
        else defaultDecision = 'Non admis';
      }

      const decision: DecisionStatus = userEdit?.decision
        || savedItem?.decision
        || defaultDecision;

      return {
        catechumeneId: catId,
        matricule,
        nomPrenoms,
        sexe: cat.sexe,
        moyenneGenerale,
        presenceCoursNb,
        totalSeances,
        presenceCoursPct,
        presenceMesse,
        presenceCEB,
        presenceMouvement,
        decision,
        observation: userEdit?.observation || ''
      };
    });
  });

  // Liste filtrée avec champ de recherche
  protected readonly filteredBilanRows = computed<AnimateurBilanRow[]>(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const rows = this.bilanRows();
    if (!q) return rows;
    return rows.filter(r =>
      r.nomPrenoms.toLowerCase().includes(q) ||
      r.matricule.toLowerCase().includes(q)
    );
  });

  // Statistiques de délibération
  protected readonly stats = computed(() => {
    const rows = this.bilanRows();
    const total = rows.length;
    const admis = rows.filter(r => r.decision === 'Admis').length;
    const ajournes = rows.filter(r => r.decision === 'Ajourné').length;
    const nonAdmis = rows.filter(r => r.decision === 'Non admis').length;
    const abandons = rows.filter(r => r.decision === 'Abandon').length;
    const presents = total - abandons;
    const tauxReussite = presents > 0 ? Math.round((admis / presents) * 100) : 0;

    return { total, admis, ajournes, nonAdmis, abandons, tauxReussite };
  });

  public ngOnInit(): void {
    if (!this.classeService.classeData()) {
      this.classeService.getMaClasse().subscribe({
        next: () => this.loadClasseDependencies()
      });
    } else {
      this.loadClasseDependencies();
    }
  }

  private loadClasseDependencies(): void {
    const cid = this.currentClasseId();
    if (!cid) return;

    // Recharger les données sauvegardées s'il y en a
    const savedItems = this.bilanService.getBilanData(this.anneeLibelle(), cid);
    if (savedItems && savedItems.length > 0) {
      const editsMap: Record<string, {
        presenceCoursNb?: number;
        presenceMesse?: number;
        presenceCEB?: number;
        presenceMouvement?: number;
        decision?: DecisionStatus;
        observation?: string;
      }> = {};
      for (const item of savedItems) {
        const editObj = {
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
    }

    this.isLoadingData.set(true);

    // Charger les moyennes officielles de la classe
    const anneeId = this.annee()?.id ? String(this.annee()!.id) : undefined;
    this.evalService.getClassAverages(cid, anneeId).subscribe({
      next: res => {
        this.classAverages.set(res);
        this.isLoadingData.set(false);
      },
      error: () => {
        this.classAverages.set(null);
        this.isLoadingData.set(false);
      }
    });

    // Charger les séances pour calculer l'assiduité
    this.seanceService.getAll(cid).subscribe({
      error: () => {}
    });
  }

  protected updateField(
    catId: string,
    field: 'presenceCoursNb' | 'presenceMesse' | 'presenceCEB' | 'presenceMouvement',
    val: any
  ): void {
    if (this.isLocked()) {
      this.toastService.warning('Bilan Verrouillé', 'Ce bilan a été validé et ne peut plus être modifié.');
      return;
    }

    const parsedVal = Math.max(0, parseInt(val, 10) || 0);

    this.localEdits.update(edits => ({
      ...edits,
      [catId]: {
        ...(edits[catId] || {}),
        [field]: parsedVal
      }
    }));
  }

  protected updateDecision(catId: string, decision: DecisionStatus): void {
    if (this.isLocked()) {
      this.toastService.warning('Bilan Verrouillé', 'Ce bilan a été validé et ne peut plus être modifié.');
      return;
    }

    this.localEdits.update(edits => ({
      ...edits,
      [catId]: {
        ...(edits[catId] || {}),
        decision
      }
    }));
  }

  protected openConfirmModal(): void {
    if (this.isLocked()) {
      this.toastService.warning('Bilan Verrouillé', 'Ce bilan est déjà validé et verrouillé.');
      return;
    }
    this.isConfirmModalOpen.set(true);
  }

  protected closeConfirmModal(): void {
    this.isConfirmModalOpen.set(false);
  }

  /**
   * Validation définitive par l'Animateur.
   * Une fois validé, le bilan se verrouille AUTOMATIQUEMENT pour l'animateur.
   * Seul l'administrateur dans le backoffice paroissial a le droit de le déverrouiller.
   */
  protected onValiderBilan(): void {
    const cid = this.currentClasseId();
    if (!cid || this.isLocked()) return;

    this.isSaving.set(true);

    const rows = this.bilanRows();
    const items: BilanAnnuelItem[] = rows.map(r => ({
      catechumeneId: r.catechumeneId,
      matricule: r.matricule,
      nomPrenoms: r.nomPrenoms,
      section: this.section()?.nom || '',
      niveau: this.niveau()?.nom || '',
      classe: this.classe()?.nom || '',
      anneePastorale: this.anneeLibelle(),
      moyenneGenerale: r.moyenneGenerale,
      presenceCoursNb: r.presenceCoursNb,
      totalSeances: r.totalSeances,
      presenceCoursPct: r.presenceCoursPct,
      presenceMesse: r.presenceMesse,
      presenceCEB: r.presenceCEB,
      presenceMouvement: r.presenceMouvement,
      decision: r.decision
    }));

    this.bilanService.validerBilan(this.anneeLibelle(), cid, items, { source: 'animateur' }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeConfirmModal();
        this.toastService.success(
          'Bilan Validé & Verrouillé',
          'Le bilan annuel de votre classe est maintenant validé et verrouillé. Il a été transmis à la direction paroissiale.'
        );
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  protected printBilan(): void {
    const cid = this.currentClasseId();
    const cls = this.classe();
    const sec = this.section();
    const niv = this.niveau();
    const rows = this.bilanRows();

    const students = rows.map((r, idx) => ({
      numero: String(idx + 1).padStart(2, '0'),
      matricule: r.matricule,
      nomPrenoms: r.nomPrenoms,
      nom_complet: r.nomPrenoms,
      telephone: '-',
      contact: '-',
      moyenne: r.moyenneGenerale !== null ? `${r.moyenneGenerale} / 20` : 'N/A',
      moyenne_generale: r.moyenneGenerale,
      moyenne_annuelle: r.moyenneGenerale,
      presences_cours: r.presenceCoursNb,
      presences_messe: r.presenceMesse,
      presences_mouvement: r.presenceMouvement,
      presences_ceb: r.presenceCEB,
      decision: r.decision
    }));

    this.pdfService.previewBilanAnnuelPdf({
      classe_id: cid,
      annee_pastorale: this.anneeLibelle()
    }, {
      classeNom: cls?.nom,
      sectionNom: sec?.nom,
      niveauNom: niv?.nom,
      students
    });
  }
}
